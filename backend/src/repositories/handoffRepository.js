const db = require("../db");
const { v4: uuidv4 } = require("uuid");

async function create({ agentId, normalizedAddress, addressHash, visitorIp, threatLevel, requiresAudit, idempotencyKey }) {
  const handoffUuid = uuidv4();
  const { rows } = await db.query(
    `INSERT INTO lead_handoffs
       (handoff_uuid, agent_id, normalized_address, address_hash, visitor_ip, threat_level, requires_audit, idempotency_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING *`,
    [handoffUuid, agentId, normalizedAddress, addressHash, visitorIp, threatLevel, requiresAudit, idempotencyKey || null]
  );
  return rows[0] || null;
}

async function findByAddressHash(addressHash) {
  const { rows } = await db.query(
    "SELECT * FROM lead_handoffs WHERE address_hash = $1 ORDER BY created_at ASC LIMIT 1",
    [addressHash]
  );
  return rows[0] || null;
}

async function findByAgent(agentId) {
  const { rows } = await db.query(
    "SELECT * FROM lead_handoffs WHERE agent_id = $1 ORDER BY created_at DESC",
    [agentId]
  );
  return rows;
}

async function logLandingVisit({ agentId, visitorIp, sourceUrl, fingerprint }) {
  const { rows } = await db.query(
    `INSERT INTO landing_visits (agent_id, visitor_ip, source_url, fingerprint)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [agentId, visitorIp, sourceUrl || null, fingerprint || null]
  );
  return rows[0];
}

async function findVisitsByAgent(agentId) {
  const { rows } = await db.query(
    "SELECT * FROM landing_visits WHERE agent_id = $1 ORDER BY visited_at DESC",
    [agentId]
  );
  return rows;
}

module.exports = { create, findByAddressHash, findByAgent, logLandingVisit, findVisitsByAgent };
