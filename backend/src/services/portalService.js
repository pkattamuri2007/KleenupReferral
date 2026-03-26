const agentRepository = require("../repositories/agentRepository");
const handoffRepository = require("../repositories/handoffRepository");
const ledgerRepository = require("../repositories/ledgerRepository");
const { computeNetPayable } = require("./computationService");

async function getMe(agentId) {
  const agent = await agentRepository.findById(agentId);
  if (!agent) throw Object.assign(new Error("Agent not found"), { statusCode: 404 });
  return agent;
}

async function getLinks(agentId) {
  const baseUrl = process.env.WP_BASE_URL || "";
  return {
    referralLink: `${baseUrl}/friends/${agentId}`,
    agentId,
  };
}

async function getVisits(agentId) {
  return handoffRepository.findVisitsByAgent(agentId);
}

async function getHandoffs(agentId) {
  return handoffRepository.findByAgent(agentId);
}

async function getLedger(agentId) {
  return ledgerRepository.findByAgent(agentId);
}

async function getNetPayable(agentId) {
  const entries = await ledgerRepository.findByAgent(agentId);
  const netPayable = computeNetPayable(entries);
  return { agentId, netPayable };
}

async function getRecruits(agentId) {
  return agentRepository.findByParent(agentId);
}

module.exports = { getMe, getLinks, getVisits, getHandoffs, getLedger, getNetPayable, getRecruits };
