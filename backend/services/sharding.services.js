import JSZip from 'jszip';
import axios from 'axios';
import FormData from 'form-data';
import { setLlmSlotShardCid, getLlmJobSlots } from './db.services.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Download a ZIP from IPFS via Pinata gateway and return a JSZip instance.
 */
const downloadAndUnzip = async (cid) => {
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
    console.log(`[Shard] Downloading dataset from ${url}`);

    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 120_000,  // 2 min for large datasets
    });

    const zip = await JSZip.loadAsync(response.data);
    return zip;
};

/**
 * Find the first data file in the ZIP and return its name + raw text content.
 * Looks for .jsonl → .json → .csv (in priority order).
 */
const extractDataFile = async (zip) => {
    const fileNames = Object.keys(zip.files).filter(f => !zip.files[f].dir);

    for (const ext of ['.jsonl', '.json', '.csv']) {
        const match = fileNames.find(f => f.toLowerCase().endsWith(ext));
        if (match) {
            const content = await zip.files[match].async('string');
            return { fileName: match, content, ext };
        }
    }

    throw new Error(
        `No supported data file found in ZIP. ` +
        `Upload a file with extension .jsonl, .json, or .csv. ` +
        `Found: ${fileNames.join(', ')}`
    );
};

/**
 * Parse raw text content into an array of plain objects.
 * Handles JSONL, JSON array, and CSV (with header row).
 */
const parseDataFile = (content, ext) => {
    if (ext === '.jsonl') {
        return content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map((line, i) => {
                try { return JSON.parse(line); }
                catch (e) { throw new Error(`JSONL parse error on line ${i + 1}: ${e.message}`); }
            });
    }

    if (ext === '.json') {
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
            throw new Error('JSON file must be a top-level array of objects e.g. [{...}, ...]');
        }
        return parsed;
    }

    if (ext === '.csv') {
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

        return lines.slice(1).map(line => {
            // Simple CSV split — handles quoted fields with commas
            const values = [];
            let current = '';
            let inQuotes = false;
            for (const char of line) {
                if (char === '"') { inQuotes = !inQuotes; continue; }
                if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
                else current += char;
            }
            values.push(current.trim());

            const row = {};
            headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
            return row;
        });
    }

    throw new Error(`Unsupported extension: ${ext}`);
};

/**
 * Split an array into N roughly equal chunks.
 * The last chunk gets any remainder rows.
 */
const splitIntoShards = (rows, n) => {
    const baseSize = Math.floor(rows.length / n);
    const remainder = rows.length % n;

    const shards = [];
    let offset = 0;
    for (let i = 0; i < n; i++) {
        const size = baseSize + (i < remainder ? 1 : 0);
        shards.push(rows.slice(offset, offset + size));
        offset += size;
    }
    return shards;
};

/**
 * Pack a shard array into a ZIP buffer (single shard.jsonl file inside).
 */
const packShardAsZip = async (shardRows, shardIndex) => {
    const zip = new JSZip();
    const jsonl = shardRows.map(row => JSON.stringify(row)).join('\n');
    zip.file(`shard_${shardIndex}.jsonl`, jsonl);
    return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
};

/**
 * Upload a single buffer to Pinata as a named file.
 * Returns the IPFS CID (IpfsHash).
 */
const uploadBufferToPinata = async (buffer, fileName) => {
    const formData = new FormData();
    formData.append('file', buffer, { filename: fileName, contentType: 'application/zip' });

    const headers = {
        pinata_api_key: process.env.PINATA_API_Key,
        pinata_secret_api_key: process.env.PINATA_API_Secret,
        ...formData.getHeaders(),
    };

    const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        { headers, maxBodyLength: Infinity }
    );

    return response.data.IpfsHash;
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main entry point — call this after all slots are filled.
 *
 * @param {number}   jobId       - DB job ID
 * @param {string}   datasetCid  - IPFS CID of the full dataset ZIP
 * @param {Array}    slots       - rows from llm_contributor_slots (ordered by slot_index)
 *
 * Returns an array of { slotIndex, shardCid, shardSize } for logging.
 */
export const shardDatasetForJob = async (jobId, datasetCid, slots) => {
    console.log(`[Shard] Starting sharding for job ${jobId}, ${slots.length} shards`);

    if (!process.env.PINATA_API_Key || !process.env.PINATA_API_Secret) {
        throw new Error('Pinata API credentials not set');
    }

    // 1. Download + unzip dataset
    const zip = await downloadAndUnzip(datasetCid);

    // 2. Find and extract the data file
    const { fileName, content, ext } = await extractDataFile(zip);
    console.log(`[Shard] Data file: ${fileName} (${ext}), size: ${content.length} chars`);

    // 3. Parse into rows
    const allRows = parseDataFile(content, ext);
    console.log(`[Shard] Total rows: ${allRows.length}`);

    if (allRows.length < slots.length) {
        throw new Error(
            `Dataset has only ${allRows.length} rows but ${slots.length} contributors — ` +
            `each shard needs at least 1 row. Upload a larger dataset.`
        );
    }

    // 4. Split into N shards
    const shards = splitIntoShards(allRows, slots.length);

    // 5. Upload each shard and update DB
    const results = [];
    for (let i = 0; i < shards.length; i++) {
        const slot = slots[i];
        const shardRows = shards[i];

        console.log(`[Shard] Uploading shard ${i} (${shardRows.length} rows) for ${slot.contributor_address}`);

        const zipBuffer = await packShardAsZip(shardRows, i);
        const shardCid = await uploadBufferToPinata(zipBuffer, `job_${jobId}_shard_${i}.zip`);

        await setLlmSlotShardCid(jobId, slot.contributor_address, shardCid, shardRows.length);

        console.log(`[Shard] Shard ${i} → ${shardCid} (${shardRows.length} rows)`);
        results.push({ slotIndex: i, shardCid, shardSize: shardRows.length });
    }

    console.log(`[Shard] All ${slots.length} shards uploaded for job ${jobId}`);
    return results;
};