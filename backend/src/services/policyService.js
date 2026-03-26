const policyRepository = require("../repositories/policyRepository");
const projectRepository = require("../repositories/projectRepository");
const handoffRepository = require("../repositories/handoffRepository");
const agentRepository = require("../repositories/agentRepository");
const ledgerRepository = require("../repositories/ledgerRepository");
const { buildSettlementRecommendations } = require("./computationService");
const { hashNormalizedAddress } = require("../utils/formatters");

async function getPolicies() {
  return policyRepository.findAll();
}

async function createPolicy({ policyName, serviceCategory }) {
  if (!policyName || !serviceCategory) {
    throw Object.assign(new Error("policyName and serviceCategory are required"), { statusCode: 400 });
  }
  return policyRepository.create({ policyName, serviceCategory });
}

async function getPolicyById(policyId) {
  const policy = await policyRepository.findById(policyId);
  if (!policy) throw Object.assign(new Error("Policy not found"), { statusCode: 404 });
  return policy;
}

async function addPolicyTier(policyId, { tierSequence, durationMonths, metricType, metricValue }) {
  if (!tierSequence || !metricType || metricValue === undefined) {
    throw Object.assign(new Error("tierSequence, metricType, and metricValue are required"), { statusCode: 400 });
  }
  return policyRepository.addTier(policyId, { tierSequence, durationMonths, metricType, metricValue });
}

async function computeProject(masterProjectId) {
  const project = await projectRepository.findById(masterProjectId);
  if (!project) throw Object.assign(new Error("Project not found"), { statusCode: 404 });

  const addressHash = project.address_hash || hashNormalizedAddress(project.normalized_address || "");
  const handoff = await handoffRepository.findByAddressHash(addressHash);
  if (!handoff) throw Object.assign(new Error("No handoff found for this project address"), { statusCode: 404 });

  const agent = await agentRepository.findById(handoff.agent_id);
  if (!agent) throw Object.assign(new Error("Agent not found"), { statusCode: 404 });
  if (!agent.assigned_policy_id) throw Object.assign(new Error("Agent has no assigned policy"), { statusCode: 422 });

  const policy = await policyRepository.findById(agent.assigned_policy_id);
  if (!policy) throw Object.assign(new Error("Policy not found"), { statusCode: 404 });

  const parentAgent = agent.parent_agent_id
    ? await agentRepository.findById(agent.parent_agent_id)
    : null;

  const result = buildSettlementRecommendations({
    masterProjectId,
    agentId: agent.agent_id,
    grossFeeAmount: project.kleenup_fee_amount || 0,
    policyTiers: policy.tiers || [],
    clockStartDate: handoff.created_at,
    completedAt: new Date(),
    parentAgentId: parentAgent?.agent_id || null,
    parentOverrideExpiresAt: null,
    parentOverrideRate: 0.1,
    serviceCategory: project.service_category,
    normalizedAddress: project.normalized_address,
    addressHash,
    projectStatus: project.project_status,
    disputedFlag: project.disputed_flag,
  });

  if (result.eligibility === "ELIGIBLE" && result.recommendations.length > 0) {
    await ledgerRepository.insertMany(result.recommendations);
  }

  return {
    masterProjectId,
    eligibility: result.eligibility,
    ledgerEntries: result.recommendations.length,
  };
}

async function computePending() {
  const projects = await projectRepository.findPendingComputation();
  const results = [];

  for (const project of projects) {
    try {
      const r = await computeProject(project.master_project_id);
      await projectRepository.markComputationQueued(project.master_project_id);
      results.push({ ...r, ok: true });
    } catch (err) {
      results.push({ masterProjectId: project.master_project_id, ok: false, error: err.message });
    }
  }

  return { processed: results.length, results };
}

module.exports = { getPolicies, createPolicy, getPolicyById, addPolicyTier, computeProject, computePending };
