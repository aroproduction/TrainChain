/**
 * Minimum reward per contributor per model size tier.
 * These are soft guidelines shown in the UI — not enforced on-chain.
 * Adjust as the project matures and real GPU costs are better understood.
 */
export const MODEL_TIERS = {
    'small':  { label: 'Small  (≤1B params, e.g. TinyLlama-1.1B)',   minRewardPerContributor: 0.05  },
    'medium': { label: 'Medium (1B–4B params, e.g. Phi-2 2.7B)',      minRewardPerContributor: 0.10  },
    'large':  { label: 'Large  (4B–8B params, e.g. Mistral-7B)',      minRewardPerContributor: 0.20  },
};

/**
 * Classify a HuggingFace model name into a size tier.
 * Simple heuristic — override is always possible in the form.
 */
export const classifyModelTier = (modelName) => {
    const name = modelName.toLowerCase();
    if (name.includes('7b') || name.includes('8b') || name.includes('6b')) return 'large';
    if (name.includes('2b') || name.includes('3b') || name.includes('4b') || name.includes('phi')) return 'medium';
    return 'small'; // TinyLlama, 1B, 1.1B, etc.
};

/**
 * Calculate the total stake (msg.value) the requester must send.
 *
 * Formula:
 *   totalReward = rewardPerContributor * maxContributors
 *   stakeAmount = totalReward / 0.9   (so that after 10% platform fee, contributors get totalReward)
 *
 * @param {number} rewardPerContributor - How much each contributor earns, in ETH
 * @param {number} maxContributors      - Number of shards / contributors
 * @returns {{
 *   stakeAmount:            number,   // what requester sends (ETH)
 *   totalContributorReward: number,   // sum paid to contributors (ETH)
 *   platformFee:            number,   // platform's 10% cut (ETH)
 *   rewardPerContributor:   number,   // per-contributor payout (ETH)
 *   maxContributors:        number,
 * }}
 */
export const calculateStake = (rewardPerContributor, maxContributors) => {
    const totalContributorReward = rewardPerContributor * maxContributors;
    // Invert the 10% cut: stakeAmount * 0.9 = totalContributorReward
    const stakeAmount = totalContributorReward / 0.9;
    const platformFee = stakeAmount - totalContributorReward;

    return {
        stakeAmount:            parseFloat(stakeAmount.toFixed(6)),
        totalContributorReward: parseFloat(totalContributorReward.toFixed(6)),
        platformFee:            parseFloat(platformFee.toFixed(6)),
        rewardPerContributor:   parseFloat(rewardPerContributor.toFixed(6)),
        maxContributors,
    };
};

/**
 * Validate that the reward is above the minimum for the model tier.
 * Returns { valid: true } or { valid: false, message: string }.
 *
 * @param {number} rewardPerContributor
 * @param {number} maxContributors
 * @param {string} modelTier  - 'small' | 'medium' | 'large'
 */
export const validateReward = (rewardPerContributor, maxContributors, modelTier) => {
    const tier = MODEL_TIERS[modelTier];
    if (!tier) {
        return { valid: false, message: `Unknown model tier: ${modelTier}` };
    }

    if (rewardPerContributor < tier.minRewardPerContributor) {
        return {
            valid: false,
            message:
                `Minimum reward for ${tier.label} is ` +
                `${tier.minRewardPerContributor} POL per contributor. ` +
                `With ${maxContributors} contributors you need at least ` +
                `${calculateStake(tier.minRewardPerContributor, maxContributors).stakeAmount} POL total.`,
        };
    }

    if (maxContributors < 2 || maxContributors > 10) {
        return { valid: false, message: 'Number of contributors must be between 2 and 10.' };
    }

    return { valid: true };
};