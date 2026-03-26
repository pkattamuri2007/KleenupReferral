const db = require("../db");
const { v4: uuidv4 } = require("uuid");

async function findAll() {
  const { rows } = await db.query(
    "SELECT * FROM threat_rules ORDER BY created_at DESC"
  );
  return rows;
}

async function create({ ruleType, value, category, notes }) {
  const ruleId = uuidv4();
  const { rows } = await db.query(
    `INSERT INTO threat_rules (rule_id, rule_type, value, category, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [ruleId, ruleType, value, category, notes || null]
  );
  return rows[0];
}

async function update(ruleId, { category, notes }) {
  const { rows } = await db.query(
    "UPDATE threat_rules SET category = $1, notes = $2 WHERE rule_id = $3 RETURNING *",
    [category, notes || null, ruleId]
  );
  return rows[0] || null;
}

async function matchIp(ip) {
  const { rows } = await db.query(
    `SELECT category FROM threat_rules
     WHERE rule_type = 'IP' AND value = $1
     LIMIT 1`,
    [ip]
  );
  return rows[0] || null;
}

module.exports = { findAll, create, update, matchIp };
