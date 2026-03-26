const db = require("../db");

async function findById(agentId) {
  const { rows } = await db.query(
    "SELECT * FROM agents WHERE agent_id = $1",
    [agentId]
  );
  return rows[0] || null;
}

async function create({ agentId, status = "PROSPECT", parentAgentId = null, assignedPolicyId = null }) {
  const { rows } = await db.query(
    `INSERT INTO agents (agent_id, status, parent_agent_id, assigned_policy_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (agent_id) DO NOTHING
     RETURNING *`,
    [agentId, status, parentAgentId, assignedPolicyId]
  );
  return rows[0] || null;
}

async function updateStatus(agentId, status) {
  const { rows } = await db.query(
    "UPDATE agents SET status = $1 WHERE agent_id = $2 RETURNING *",
    [status, agentId]
  );
  return rows[0] || null;
}

async function assignPolicy(agentId, policyId) {
  const { rows } = await db.query(
    "UPDATE agents SET assigned_policy_id = $1 WHERE agent_id = $2 RETURNING *",
    [policyId, agentId]
  );
  return rows[0] || null;
}

async function findProspects() {
  const { rows } = await db.query(
    "SELECT * FROM agents WHERE status = 'PROSPECT' ORDER BY created_at DESC"
  );
  return rows;
}

async function findByParent(parentAgentId) {
  const { rows } = await db.query(
    "SELECT * FROM agents WHERE parent_agent_id = $1 ORDER BY created_at DESC",
    [parentAgentId]
  );
  return rows;
}

module.exports = { findById, create, updateStatus, assignPolicy, findProspects, findByParent };
