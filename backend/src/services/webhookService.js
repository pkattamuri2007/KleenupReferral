const agentRepository = require("../repositories/agentRepository");
const projectRepository = require("../repositories/projectRepository");
const handoffRepository = require("../repositories/handoffRepository");
const ledgerRepository = require("../repositories/ledgerRepository");
const policyRepository = require("../repositories/policyRepository");
const referralClockRepository = require("../repositories/referralClockRepository");
const { buildSettlementRecommendations } = require("./computationService");
const { hashNormalizedAddress } = require("../utils/formatters");

async function autoEnrollAgent({ userId, email, defaultPolicyId }) {
  if (!userId) throw Object.assign(new Error("userId is required"), { statusCode: 400 });

  const agentId = String(userId);
  const agent = await agentRepository.create({
    agentId,
    status: "ACTIVE",
    assignedPolicyId: defaultPolicyId || null,
  });

  return { ok: true, agentId, created: !!agent };
}

async function projectUpsert(data) {
  const { masterProjectId, normalizedAddress, serviceCategory, grossTransactionAmount, kleenupFeeAmount, projectStatus, disputedFlag } = data;

  if (!masterProjectId) throw Object.assign(new Error("masterProjectId is required"), { statusCode: 400 });

  const addressHash = normalizedAddress ? hashNormalizedAddress(normalizedAddress) : null;

  const project = await projectRepository.upsert({
    masterProjectId,
    normalizedAddress: normalizedAddress || null,
    addressHash,
    serviceCategory: serviceCategory || null,
    grossTransactionAmount: grossTransactionAmount || 0,
    kleenupFeeAmount: kleenupFeeAmount || 0,
    projectStatus: projectStatus || "PENDING",
    disputedFlag: disputedFlag === true,
  });

  return { ok: true, masterProjectId: project.master_project_id };
}

async function projectCompleted(data) {
  return projectUpsert({ ...data, projectStatus: "COMPLETED" });
}

async function disputeCleared(data) {
  const { masterProjectId, normalizedAddress, serviceCategory, grossTransactionAmount, kleenupFeeAmount } = data;

  if (!masterProjectId) throw Object.assign(new Error("masterProjectId is required"), { statusCode: 400 });
  if (!normalizedAddress) throw Object.assign(new Error("normalizedAddress is required"), { statusCode: 400 });

  const addressHash = hashNormalizedAddress(normalizedAddress);

  // Upsert project as completed and dispute-cleared
  await projectRepository.upsert({
    masterProjectId,
    normalizedAddress,
    addressHash,
    serviceCategory: serviceCategory || null,
    grossTransactionAmount: grossTransactionAmount || 0,
    kleenupFeeAmount: kleenupFeeAmount || 0,
    projectStatus: "COMPLETED",
    disputedFlag: false,
  });

  // Find the referral handoff for this address
  const handoff = await handoffRepository.findByAddressHash(addressHash);
  if (!handoff) {
    return { ok: true, computed: false, reason: "No matching handoff for address" };
  }

  // Load agent + policy
  const agentRepository = require("../repositories/agentRepository");
  const agent = await agentRepository.findById(handoff.agent_id);
  if (!agent || !agent.assigned_policy_id) {
    return { ok: true, computed: false, reason: "Agent has no assigned policy" };
  }

  const policy = await policyRepository.findById(agent.assigned_policy_id);
  if (!policy) {
    return { ok: true, computed: false, reason: "Policy not found" };
  }

  const parentAgent = agent.parent_agent_id
    ? await agentRepository.findById(agent.parent_agent_id)
    : null;

  const existingClock = await referralClockRepository.findByAddressHash(addressHash);
  const completionDate = new Date();
  const clockStartDate = existingClock?.clock_start_date || completionDate;

  if (!existingClock) {
    await referralClockRepository.createIfMissing({
      addressHash,
      owningAgentId: agent.agent_id,
      firstMasterProjectId: masterProjectId,
      clockStartDate: completionDate,
    });
  }

  const mappedPolicyTiers = (policy.tiers || []).map((tier) => ({
    tierSequence: tier.tier_sequence,
    durationMonths: tier.duration_months,
    metricType: tier.metric_type,
    metricValue: Number(tier.metric_value),
  }));

  const result = buildSettlementRecommendations({
    masterProjectId,
    agentId: agent.agent_id,
    grossFeeAmount: kleenupFeeAmount || 0,
    policyTiers: mappedPolicyTiers,
    clockStartDate,
    completedAt: completionDate,
    parentAgentId: parentAgent?.agent_id || null,
    parentOverrideExpiresAt: parentAgent?.override_expires_at || null,
    parentOverrideRate: 0.1,
    serviceCategory,
    normalizedAddress,
    addressHash,
    projectStatus: "COMPLETED",
    disputedFlag: false,
  });

  if (result.eligibility === "ELIGIBLE" && result.recommendations.length > 0) {
    await ledgerRepository.insertMany(result.recommendations);
  }

  return {
    ok: true,
    computed: true,
    eligibility: result.eligibility,
    ledgerEntries: result.recommendations.length,
  };
}

module.exports = { autoEnrollAgent, projectUpsert, projectCompleted, disputeCleared };
