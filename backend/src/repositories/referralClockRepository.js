const db = require("../db");

async function findByAddressHash(addressHash) {
  const { rows } = await db.query(
    "SELECT * FROM referral_clocks WHERE address_hash = $1",
    [addressHash]
  );
  return rows[0] || null;
}

async function createIfMissing({ addressHash, owningAgentId, firstMasterProjectId, clockStartDate }) {
  const { rows } = await db.query(
    `INSERT INTO referral_clocks (address_hash, owning_agent_id, first_master_project_id, clock_start_date)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (address_hash) DO NOTHING
     RETURNING *`,
    [addressHash, owningAgentId, firstMasterProjectId, clockStartDate]
  );

  return rows[0] || null;
}

module.exports = { findByAddressHash, createIfMissing };
