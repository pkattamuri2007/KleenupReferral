const agentRepository = require("../repositories/agentRepository");
const handoffRepository = require("../repositories/handoffRepository");
const ledgerRepository = require("../repositories/ledgerRepository");
const threatRepository = require("../repositories/threatRepository");
const { createReclawAdjustment } = require("./computationService");

async function getProspects() {
  return agentRepository.findProspects();
}

async function createProspect({ agentId, parentAgentId }) {
  if (!agentId) throw Object.assign(new Error("agentId is required"), { statusCode: 400 });

  const agent = await agentRepository.create({ agentId, status: "PROSPECT", parentAgentId });
  if (!agent) throw Object.assign(new Error("Agent already exists"), { statusCode: 409 });
  return agent;
}

async function bulkUploadProspects(prospects) {
  const results = [];
  for (const p of prospects) {
    const agent = await agentRepository.create({ agentId: p.agentId, status: "PROSPECT", parentAgentId: p.parentAgentId || null });
    results.push({ agentId: p.agentId, created: !!agent });
  }
  return results;
}

async function promoteProspect(agentId) {
  const agent = await agentRepository.updateStatus(agentId, "PROMOTED");
  if (!agent) throw Object.assign(new Error("Agent not found"), { statusCode: 404 });
  return agent;
}

async function updateAgentStatus(agentId, status) {
  const valid = ["PROSPECT", "PROMOTED", "ACTIVE", "SUSPENDED"];
  if (!valid.includes(status)) {
    throw Object.assign(new Error(`Invalid status. Must be one of: ${valid.join(", ")}`), { statusCode: 400 });
  }
  const agent = await agentRepository.updateStatus(agentId, status);
  if (!agent) throw Object.assign(new Error("Agent not found"), { statusCode: 404 });
  return agent;
}

async function assignPolicy(agentId, policyId) {
  if (!policyId) throw Object.assign(new Error("policyId is required"), { statusCode: 400 });
  const agent = await agentRepository.assignPolicy(agentId, policyId);
  if (!agent) throw Object.assign(new Error("Agent not found"), { statusCode: 404 });
  return agent;
}

async function getPendingSettlements() {
  return ledgerRepository.findPending();
}

async function reviewSettlement(ledgerId, { status, adminId, reasonCode }) {
  const valid = ["APPROVED", "REJECTED", "ON_HOLD"];
  if (!valid.includes(status)) {
    throw Object.assign(new Error(`Invalid status. Must be one of: ${valid.join(", ")}`), { statusCode: 400 });
  }
  if (!adminId) throw Object.assign(new Error("adminId is required"), { statusCode: 400 });

  const entry = await ledgerRepository.updateStatus(ledgerId, { status, adminId, reasonCode });
  if (!entry) throw Object.assign(new Error("Ledger entry not found"), { statusCode: 404 });
  return entry;
}

async function createReclaw({ agentId, masterProjectId, amount, adminId, reasonCode }) {
  const adjustment = createReclawAdjustment({ agentId, masterProjectId, amount, adminId, reasonCode });
  const [entry] = await ledgerRepository.insertMany([adjustment]);
  return entry;
}

async function getAgentLedger(agentId) {
  return ledgerRepository.findByAgent(agentId);
}

async function getAgentHandoffs(agentId) {
  return handoffRepository.findByAgent(agentId);
}

async function getThreatRules() {
  return threatRepository.findAll();
}

async function createThreatRule({ ruleType, value, category, notes }) {
  if (!ruleType || !value || !category) {
    throw Object.assign(new Error("ruleType, value, and category are required"), { statusCode: 400 });
  }
  return threatRepository.create({ ruleType, value, category, notes });
}

async function updateThreatRule(ruleId, { category, notes }) {
  const rule = await threatRepository.update(ruleId, { category, notes });
  if (!rule) throw Object.assign(new Error("Rule not found"), { statusCode: 404 });
  return rule;
}

module.exports = {
  getProspects, createProspect, bulkUploadProspects, promoteProspect,
  updateAgentStatus, assignPolicy,
  getPendingSettlements, reviewSettlement, createReclaw,
  getAgentLedger, getAgentHandoffs,
  getThreatRules, createThreatRule, updateThreatRule,
};
