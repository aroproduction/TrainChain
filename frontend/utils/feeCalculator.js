// frontend/utils/feeCalculator.js
// Mirror of backend/utils/feeCalculator.js — kept in sync manually.
// Used for the live cost breakdown shown in the LLM finetune form.

export const MODEL_TIERS = {
    small:  { label: 'Small  (≤1B params, e.g. TinyLlama-1.1B)',   minRewardPerContributor: 0.05  },
    medium: { label: 'Medium (1B–4B params, e.g. Phi-2 2.7B)',      minRewardPerContributor: 0.10  },
    large:  { label: 'Large  (4B–8B params, e.g. Mistral-7B)',      minRewardPerContributor: 0.20  },
};

export const classifyModelTier = (modelName) => {
    const name = modelName.toLowerCase();
    if (name.includes('7b') || name.includes('8b') || name.includes('6b')) return 'large';
    if (name.includes('2b') || name.includes('3b') || name.includes('4b') || name.includes('phi')) return 'medium';
    return 'small';
};

/**
 * Calculate the full cost breakdown for the requester.
 *
 * @param {number} rewardPerContributor - Desired per-contributor payout in POL
 * @param {number} maxContributors
 * @returns {{
 *   stakeAmount:            string,   // ETH string for parseEther()
 *   totalContributorReward: number,
 *   platformFee:            number,
 *   rewardPerContributor:   number,
 *   maxContributors:        number,
 * }}
 */
export const calculateStake = (rewardPerContributor, maxContributors) => {
    const totalContributorReward = rewardPerContributor * maxContributors;
    const stakeAmount = totalContributorReward / 0.9;
    const platformFee = stakeAmount - totalContributorReward;

    return {
        stakeAmount:            stakeAmount.toFixed(6),   // string for ethers.parseEther()
        totalContributorReward: parseFloat(totalContributorReward.toFixed(6)),
        platformFee:            parseFloat(platformFee.toFixed(6)),
        rewardPerContributor:   parseFloat(rewardPerContributor.toFixed(6)),
        maxContributors,
    };
};

export const validateReward = (rewardPerContributor, maxContributors, modelTier) => {
    const tier = MODEL_TIERS[modelTier];
    if (!tier) return { valid: false, message: `Unknown model tier: ${modelTier}` };

    if (rewardPerContributor < tier.minRewardPerContributor) {
        const minStake = calculateStake(tier.minRewardPerContributor, maxContributors).stakeAmount;
        return {
            valid: false,
            message:
                `Minimum reward for this model size is ${tier.minRewardPerContributor} POL per contributor. ` +
                `You need at least ${minStake} POL total.`,
        };
    }

    if (maxContributors < 2 || maxContributors > 10) {
        return { valid: false, message: 'Contributors must be between 2 and 10.' };
    }

    return { valid: true };
};

/**
 * Format a breakdown object as a human-readable summary string.
 * Used in the form preview.
 */
export const formatBreakdown = (breakdown) => {
    return [
        `You send:          ${breakdown.stakeAmount} POL`,
        `Platform fee (10%): ${breakdown.platformFee.toFixed(6)} POL`,
        `Per contributor:    ${breakdown.rewardPerContributor.toFixed(6)} POL × ${breakdown.maxContributors}`,
        `Total to contributors: ${breakdown.totalContributorReward.toFixed(6)} POL`,
    ].join('\n');
};