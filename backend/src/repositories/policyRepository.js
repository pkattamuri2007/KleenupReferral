const db = require("../db");
const { v4: uuidv4 } = require("uuid");

async function findAll() {
  const { rows } = await db.query(
    "SELECT * FROM incentive_policies ORDER BY created_at DESC"
  );
  return rows;
}

async function findById(policyId) {
  const { rows: policyRows } = await db.query(
    "SELECT * FROM incentive_policies WHERE policy_id = $1",
    [policyId]
  );
  if (!policyRows[0]) return null;

  const { rows: tierRows } = await db.query(
    "SELECT * FROM policy_tiers WHERE policy_id = $1 ORDER BY tier_sequence ASC",
    [policyId]
  );

  const tiers = tierRows.map(t => ({
    tierSequence:   t.tier_sequence,
    durationMonths: t.duration_months,
    metricType:     t.metric_type,
    metricValue:    t.metric_value,
  }));

  return { ...policyRows[0], tiers };
}

async function create({ policyName, serviceCategory }) {
  const policyId = uuidv4();
  const { rows } = await db.query(
    `INSERT INTO incentive_policies (policy_id, policy_name, service_category)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [policyId, policyName, serviceCategory]
  );
  return rows[0];
}

async function addTier(policyId, { tierSequence, durationMonths, metricType, metricValue }) {
  const tierId = uuidv4();
  const { rows } = await db.query(
    `INSERT INTO policy_tiers (tier_id, policy_id, tier_sequence, duration_months, metric_type, metric_value)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [tierId, policyId, tierSequence, durationMonths || null, metricType, metricValue]
  );
  return rows[0];
}

module.exports = { findAll, findById, create, addTier };
