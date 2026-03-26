const db = require("../db");
const { v4: uuidv4 } = require("uuid");

async function insertMany(entries) {
  const inserted = [];
  for (const entry of entries) {
    const ledgerId = uuidv4();
    const { rows } = await db.query(
      `INSERT INTO settlement_ledger
         (ledger_id, agent_id, master_project_id, transaction_type, amount, status,
          admin_id, admin_reason_code, metadata_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        ledgerId,
        entry.agent_id,
        entry.master_project_id,
        entry.transaction_type,
        entry.amount,
        entry.status,
        entry.actor_admin_id || null,
        entry.admin_reason_code || null,
        entry.metadata_json ? JSON.stringify(entry.metadata_json) : null,
      ]
    );
    inserted.push(rows[0]);
  }
  return inserted;
}

async function findPending() {
  const { rows } = await db.query(
    "SELECT * FROM settlement_ledger WHERE status = 'PENDING_REVIEW' ORDER BY created_at DESC"
  );
  return rows;
}

async function findByAgent(agentId) {
  const { rows } = await db.query(
    "SELECT * FROM settlement_ledger WHERE agent_id = $1 ORDER BY created_at DESC",
    [agentId]
  );
  return rows;
}

async function updateStatus(ledgerId, { status, adminId, reasonCode }) {
  const { rows } = await db.query(
    `UPDATE settlement_ledger
     SET status = $1, admin_id = $2, admin_reason_code = $3
     WHERE ledger_id = $4
     RETURNING *`,
    [status, adminId, reasonCode, ledgerId]
  );
  return rows[0] || null;
}

module.exports = { insertMany, findPending, findByAgent, updateStatus };
