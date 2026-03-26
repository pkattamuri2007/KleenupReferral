const db = require("../db");

async function upsert({
  masterProjectId,
  normalizedAddress,
  addressHash,
  serviceCategory,
  grossTransactionAmount,
  kleenupFeeAmount,
  projectStatus,
  disputedFlag,
}) {
  const { rows } = await db.query(
    `INSERT INTO project_shadow
       (master_project_id, normalized_address, address_hash, service_category,
        gross_transaction_amount, kleenup_fee_amount, project_status, disputed_flag)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (master_project_id) DO UPDATE SET
       normalized_address = EXCLUDED.normalized_address,
       address_hash = EXCLUDED.address_hash,
       service_category = EXCLUDED.service_category,
       gross_transaction_amount = EXCLUDED.gross_transaction_amount,
       kleenup_fee_amount = EXCLUDED.kleenup_fee_amount,
       project_status = EXCLUDED.project_status,
       disputed_flag = EXCLUDED.disputed_flag,
       updated_at = NOW()
     RETURNING *`,
    [masterProjectId, normalizedAddress, addressHash, serviceCategory,
     grossTransactionAmount, kleenupFeeAmount, projectStatus, disputedFlag]
  );
  return rows[0];
}

async function findById(masterProjectId) {
  const { rows } = await db.query(
    "SELECT * FROM project_shadow WHERE master_project_id = $1",
    [masterProjectId]
  );
  return rows[0] || null;
}

async function findPendingComputation() {
  const { rows } = await db.query(
    `SELECT * FROM project_shadow
     WHERE project_status = 'COMPLETED' AND disputed_flag = false
       AND computation_queued = false`
  );
  return rows;
}

async function markComputationQueued(masterProjectId) {
  await db.query(
    "UPDATE project_shadow SET computation_queued = true WHERE master_project_id = $1",
    [masterProjectId]
  );
}

module.exports = { upsert, findById, findPendingComputation, markComputationQueued };
