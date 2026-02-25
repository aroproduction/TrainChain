import dotenv from 'dotenv';
dotenv.config();

import JSZip from 'jszip';
import axios from "axios";
import FormData from 'form-data';

export const uploadFolderHandler = async (folderName, files) => {
  if (!folderName || !files || files.length === 0) {
    throw new Error("Folder name and files are required.");
  }

  console.log("Pinata Key:", process.env.PINATA_API_Key || "Not Set");
  console.log("Pinata Secret:", process.env.PINATA_API_Secret || "Not Set");

  if (!process.env.PINATA_API_Key || !process.env.PINATA_API_Secret) {
    throw new Error("Pinata API key or secret not set");
  }

  try {
    // Create a zip archive of the folder
    const zip = new JSZip();
    const fileNames = files.map(file => file.originalname);

    files.forEach(file => {
      zip.file(file.originalname, file.buffer);
    });

    // Generate the zip file as a buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Create FormData and append the zip file
    const formData = new FormData();
    formData.append("file", zipBuffer, `${folderName}.zip`);
    // Do NOT wrap with directory so that the returned CID is for the zip file itself

    // Build headers for the file upload
    const formHeaders = formData.getHeaders();
    const fileUploadHeaders = {
      pinata_api_key: process.env.PINATA_API_Key,
      pinata_secret_api_key: process.env.PINATA_API_Secret,
      ...formHeaders,
    };

    console.log("Uploading folder (as zip):", folderName);

    // Upload the zip file to Pinata
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      { headers: fileUploadHeaders }
    );

    console.log("Folder upload response:", response.data);
    const folderCid = response.data.IpfsHash;
    console.log("Folder CID:", folderCid);

    // Create metadata JSON that stores the zip file's CID
    const metadata = {
      folderName,
      folderCid,
      fileNames,
    };

    console.log("Uploading metadata:", metadata);

    // Use JSON-specific headers for metadata upload
    const jsonUploadHeaders = {
      "Content-Type": "application/json",
      pinata_api_key: process.env.PINATA_API_Key,
      pinata_secret_api_key: process.env.PINATA_API_Secret,
    };

    const metadataResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadata,
      { headers: jsonUploadHeaders }
    );

    const metadataCid = metadataResponse.data.IpfsHash;

    return { folderCid, metadataCid };
  } catch (error) {
    console.log("Pinata error response:", error.response?.data);
    throw new Error(`Error uploading folder: ${error.message}`);
  }
};

export const downloadFolderAsZip = async (folderCid) => {
  try {
    if (!folderCid) {
      throw new Error("Folder CID is required");
    }

    // Fetch the zip file from IPFS using fileCid
    const zipUrl = `https://gateway.pinata.cloud/ipfs/${folderCid}`;
    const response = await axios.get(zipUrl, {
      responseType: 'arraybuffer'
    });
    
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Error fetching zip file: ${error.message}`);
  }
};

/**
 * Upload a single file buffer directly to Pinata without any re-zipping.
 * Used by uploadAdapterController so the aggregation service can extract
 * adapter_model.safetensors straight from the top-level of the ZIP.
 */
export const uploadRawFile = async (fileName, fileBuffer, mimeType = 'application/zip') => {
  if (!process.env.PINATA_API_Key || !process.env.PINATA_API_Secret) {
    throw new Error('Pinata API key or secret not set');
  }

  const formData = new FormData();
  formData.append('file', fileBuffer, { filename: fileName, contentType: mimeType });

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      headers: {
        pinata_api_key:        process.env.PINATA_API_Key,
        pinata_secret_api_key: process.env.PINATA_API_Secret,
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,
    }
  );

  const cid = response.data.IpfsHash;
  console.log(`[ipfs] uploadRawFile ${fileName} -> ${cid}`);
  return cid;
};
