const handoffRepository = require("../repositories/handoffRepository");
const agentRepository = require("../repositories/agentRepository");
const threatService = require("./threatService");
const { hashNormalizedAddress } = require("../utils/formatters");

async function createHandoff({ agentId, normalizedAddress, visitorIp, serviceCategory, fingerprint, idempotencyKey }) {
  if (!agentId) throw Object.assign(new Error("agentId is required"), { statusCode: 400 });
  if (!normalizedAddress) throw Object.assign(new Error("normalizedAddress is required"), { statusCode: 400 });
  if (!visitorIp) throw Object.assign(new Error("visitorIp is required"), { statusCode: 400 });

  const agent = await agentRepository.findById(agentId);
  if (!agent) throw Object.assign(new Error("Agent not found"), { statusCode: 404 });
  if (agent.status === "SUSPENDED") throw Object.assign(new Error("Agent is suspended"), { statusCode: 403 });

  const threatLevel = await threatService.categorizeThreat(visitorIp);
  const requiresAudit = threatLevel !== "CLEAN";

  if (threatLevel === "BLACK") {
    throw Object.assign(new Error("Request blocked: IP is blacklisted"), { statusCode: 403 });
  }

  const addressHash = hashNormalizedAddress(normalizedAddress);

  const handoff = await handoffRepository.create({
    agentId,
    normalizedAddress,
    addressHash,
    visitorIp,
    threatLevel,
    requiresAudit,
    idempotencyKey: idempotencyKey || null,
  });

  if (!handoff) {
    // Idempotency: already exists — return success without re-inserting
    return { ok: true, deduplicated: true, threatLevel, requiresAudit };
  }

  return {
    ok: true,
    handoffUuid: handoff.handoff_uuid,
    threatLevel,
    requiresAudit,
  };
}

async function logLandingVisit({ agentId, visitorIp, sourceUrl, fingerprint }) {
  if (!agentId) throw Object.assign(new Error("agentId is required"), { statusCode: 400 });

  const visit = await handoffRepository.logLandingVisit({ agentId, visitorIp, sourceUrl, fingerprint });
  return { ok: true, visitId: visit.visit_id };
}

async function getPublicAgentProfile(agentId) {
  const agent = await agentRepository.findById(agentId);
  if (!agent || agent.status === "SUSPENDED") {
    throw Object.assign(new Error("Agent not found"), { statusCode: 404 });
  }

  return {
    agentId: agent.agent_id,
    status: agent.status,
    activationDate: agent.activation_date,
  };
}

module.exports = { createHandoff, logLandingVisit, getPublicAgentProfile };
