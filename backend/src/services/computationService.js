const {
  hashNormalizedAddress,
  roundCurrency,
  toDate,
  diffFullMonths,
} = require("../utils/formatters");

const PROJECT_STATUS_COMPLETED = "COMPLETED";
const TXN_EARNING = "EARNING";
const TXN_TIER2_OVERRIDE = "TIER2_OVERRIDE";
const TXN_RECLAW = "RECLAW";
const STATUS_PENDING_REVIEW = "PENDING_REVIEW";
const STATUS_APPROVED = "APPROVED";

function isProjectEligible({ projectStatus, disputedFlag }) {
  return projectStatus === PROJECT_STATUS_COMPLETED && disputedFlag === false;
}

function sortPolicyTiers(policyTiers = []) {
  return [...policyTiers].sort((a, b) => Number(a.tierSequence) - Number(b.tierSequence));
}

function selectActivePolicyTier({ policyTiers, clockStartDate, completedAt }) {
  if (!Array.isArray(policyTiers) || policyTiers.length === 0) {
    return { activeTier: null, monthsSinceClockStart: 0 };
  }

  const monthsSinceClockStart = diffFullMonths(clockStartDate, completedAt);
  const sortedTiers = sortPolicyTiers(policyTiers);

  let cumulativeMonths = 0;

  for (const tier of sortedTiers) {
    const durationMonths = Number(tier.durationMonths || 0);

    // Duration 0 means open-ended tier (no expiry).
    if (durationMonths === 0) {
      return { activeTier: tier, monthsSinceClockStart };
    }

    if (monthsSinceClockStart < cumulativeMonths + durationMonths) {
      return { activeTier: tier, monthsSinceClockStart };
    }

    cumulativeMonths += durationMonths;
  }

  return { activeTier: null, monthsSinceClockStart };
}

function computeTierPayoutAmount({ metricType, metricValue, grossFeeAmount }) {
  const gross = Number(grossFeeAmount || 0);
  const metric = Number(metricValue || 0);

  if (metricType === "PERCENT_REV") {
    return roundCurrency(gross * metric);
  }

  if (metricType === "FIXED_USD") {
    return roundCurrency(metric);
  }

  throw new Error(`Unsupported metric type: ${metricType}`);
}

function isParentOverrideActive({ parentAgentId, parentOverrideExpiresAt, completedAt }) {
  if (!parentAgentId) {
    return false;
  }

  if (!parentOverrideExpiresAt) {
    return true;
  }

  return toDate(completedAt) <= toDate(parentOverrideExpiresAt);
}

function computeParentOverrideAmount({ grossFeeAmount, overrideRate = 0.1 }) {
  return roundCurrency(Number(grossFeeAmount || 0) * Number(overrideRate || 0));
}

function buildSettlementRecommendations(input) {
  const {
    masterProjectId,
    agentId,
    grossFeeAmount,
    policyTiers,
    clockStartDate,
    completedAt,
    parentAgentId,
    parentOverrideExpiresAt,
    parentOverrideRate,
    serviceCategory,
    normalizedAddress,
    addressHash,
    projectStatus,
    disputedFlag,
  } = input;

  if (!masterProjectId) {
    throw new Error("masterProjectId is required");
  }

  if (!agentId) {
    throw new Error("agentId is required");
  }

  if (!isProjectEligible({ projectStatus, disputedFlag })) {
    return {
      recommendations: [],
      selectedTier: null,
      monthsSinceClockStart: 0,
      eligibility: "NOT_ELIGIBLE",
    };
  }

  const normalizedClockStart = toDate(clockStartDate || completedAt);
  const completionDate = toDate(completedAt);

  const { activeTier, monthsSinceClockStart } = selectActivePolicyTier({
    policyTiers,
    clockStartDate: normalizedClockStart,
    completedAt: completionDate,
  });

  const recommendations = [];

  if (activeTier) {
    const amount = computeTierPayoutAmount({
      metricType: activeTier.metricType,
      metricValue: activeTier.metricValue,
      grossFeeAmount,
    });

    if (amount > 0) {
      recommendations.push({
        agent_id: agentId,
        master_project_id: masterProjectId,
        transaction_type: TXN_EARNING,
        amount,
        status: STATUS_PENDING_REVIEW,
        metadata_json: {
          service_category: serviceCategory,
          normalized_address: normalizedAddress,
          address_hash: addressHash || hashNormalizedAddress(normalizedAddress || ""),
          months_since_clock_start: monthsSinceClockStart,
          tier_sequence: activeTier.tierSequence,
          metric_type: activeTier.metricType,
          metric_value: Number(activeTier.metricValue),
          gross_fee_amount: Number(grossFeeAmount),
        },
      });
    }
  }

  if (
    isParentOverrideActive({
      parentAgentId,
      parentOverrideExpiresAt,
      completedAt: completionDate,
    })
  ) {
    const parentAmount = computeParentOverrideAmount({
      grossFeeAmount,
      overrideRate: parentOverrideRate,
    });

    if (parentAmount > 0) {
      recommendations.push({
        agent_id: parentAgentId,
        master_project_id: masterProjectId,
        transaction_type: TXN_TIER2_OVERRIDE,
        amount: parentAmount,
        status: STATUS_PENDING_REVIEW,
        metadata_json: {
          source_agent_id: agentId,
          override_rate: Number(parentOverrideRate || 0.1),
          gross_fee_amount: Number(grossFeeAmount),
          expires_at: parentOverrideExpiresAt || null,
        },
      });
    }
  }

  return {
    recommendations,
    selectedTier: activeTier,
    monthsSinceClockStart,
    eligibility: "ELIGIBLE",
  };
}

function createReclawAdjustment({
  agentId,
  amount,
  reasonCode,
  adminId,
  masterProjectId,
  metadata = {},
}) {
  if (!agentId) {
    throw new Error("agentId is required for reclaw");
  }

  if (!reasonCode) {
    throw new Error("reasonCode is required for reclaw");
  }

  if (!adminId) {
    throw new Error("adminId is required for reclaw");
  }

  const absoluteAmount = Math.abs(Number(amount || 0));
  if (absoluteAmount === 0) {
    throw new Error("reclaw amount must be non-zero");
  }

  return {
    agent_id: agentId,
    master_project_id: masterProjectId || `manual-reclaw-${Date.now()}`,
    transaction_type: TXN_RECLAW,
    amount: roundCurrency(-absoluteAmount),
    status: STATUS_APPROVED,
    admin_reason_code: reasonCode,
    actor_admin_id: adminId,
    metadata_json: metadata,
  };
}

function computeNetPayable(ledgerEntries = []) {
  const approvedTotal = ledgerEntries.reduce((sum, entry) => {
    if (entry.status !== STATUS_APPROVED) {
      return sum;
    }
    return sum + Number(entry.amount || 0);
  }, 0);

  return roundCurrency(approvedTotal);
}

module.exports = {
  PROJECT_STATUS_COMPLETED,
  TXN_EARNING,
  TXN_TIER2_OVERRIDE,
  TXN_RECLAW,
  STATUS_PENDING_REVIEW,
  STATUS_APPROVED,
  isProjectEligible,
  selectActivePolicyTier,
  computeTierPayoutAmount,
  isParentOverrideActive,
  computeParentOverrideAmount,
  buildSettlementRecommendations,
  createReclawAdjustment,
  computeNetPayable,
};
