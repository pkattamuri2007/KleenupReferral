-- KLEENUPLink schema
-- Run once against a fresh PostgreSQL database.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Agents (prospects, promoted, active, suspended)
CREATE TABLE IF NOT EXISTS agents (
  agent_id          TEXT PRIMARY KEY,
  status            TEXT NOT NULL CHECK (status IN ('PROSPECT', 'PROMOTED', 'ACTIVE', 'SUSPENDED')),
  parent_agent_id   TEXT NULL REFERENCES agents(agent_id),
  activation_date   TIMESTAMP NULL,
  assigned_policy_id UUID NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Incentive policies
CREATE TABLE IF NOT EXISTS incentive_policies (
  policy_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name     TEXT NOT NULL,
  service_category TEXT NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Policy tiers (temporal decay, fixed fee, percent rev)
CREATE TABLE IF NOT EXISTS policy_tiers (
  policy_tier_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id       UUID NOT NULL REFERENCES incentive_policies(policy_id) ON DELETE CASCADE,
  tier_sequence   INT NOT NULL,
  duration_months INT NULL,           -- NULL = open-ended tier
  metric_type     TEXT NOT NULL CHECK (metric_type IN ('PERCENT_REV', 'FIXED_USD')),
  metric_value    NUMERIC(10,4) NOT NULL,
  UNIQUE (policy_id, tier_sequence)
);

-- Lead handoffs (WordPress → KLEENUPLink)
CREATE TABLE IF NOT EXISTS lead_handoffs (
  handoff_uuid    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        TEXT NOT NULL REFERENCES agents(agent_id),
  normalized_address TEXT NOT NULL,
  address_hash    TEXT NOT NULL,
  visitor_ip      TEXT NOT NULL,
  threat_level    TEXT NOT NULL CHECK (threat_level IN ('CLEAN', 'GREY', 'BLACK')),
  requires_audit  BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT NULL UNIQUE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_handoffs_address_hash ON lead_handoffs(address_hash);
CREATE INDEX IF NOT EXISTS idx_lead_handoffs_agent_id ON lead_handoffs(agent_id);

-- Referral clocks (first handoff wins per address)
CREATE TABLE IF NOT EXISTS referral_clocks (
  address_hash       TEXT PRIMARY KEY,
  owning_agent_id    TEXT NOT NULL REFERENCES agents(agent_id),
  clock_start_date   TIMESTAMP NOT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Settlement ledger
CREATE TABLE IF NOT EXISTS settlement_ledger (
  ledger_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            TEXT NOT NULL REFERENCES agents(agent_id),
  master_project_id   TEXT NOT NULL,
  transaction_type    TEXT NOT NULL CHECK (transaction_type IN ('EARNING', 'TIER2_OVERRIDE', 'RECLAW', 'SPIFF')),
  amount              NUMERIC(10,2) NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ON_HOLD')),
  admin_id            TEXT NULL,
  admin_reason_code   TEXT NULL,
  metadata_json       JSONB NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlement_ledger_agent_id ON settlement_ledger(agent_id);
CREATE INDEX IF NOT EXISTS idx_settlement_ledger_status ON settlement_ledger(status);

-- Landing visits (pre-address capture page hits)
CREATE TABLE IF NOT EXISTS landing_visits (
  visit_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    TEXT NOT NULL REFERENCES agents(agent_id),
  visitor_ip  TEXT NULL,
  source_url  TEXT NULL,
  fingerprint TEXT NULL,
  visited_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landing_visits_agent_id ON landing_visits(agent_id);

-- Project shadow (Flutter → KLEENUPLink)
CREATE TABLE IF NOT EXISTS project_shadow (
  master_project_id       TEXT PRIMARY KEY,
  normalized_address      TEXT NULL,
  address_hash            TEXT NULL,
  service_category        TEXT NULL,
  gross_transaction_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  kleenup_fee_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  project_status          TEXT NOT NULL DEFAULT 'PENDING',
  disputed_flag           BOOLEAN NOT NULL DEFAULT FALSE,
  computation_queued      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Threat rules (IP blacklist/greylist)
CREATE TABLE IF NOT EXISTS threat_rules (
  rule_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type   TEXT NOT NULL,           -- 'IP', 'SUBNET', 'COUNTRY'
  value       TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('GREY', 'BLACK')),
  notes       TEXT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threat_rules_type_value ON threat_rules(rule_type, value);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    TEXT NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NULL,
  entity_id   TEXT NULL,
  payload     JSONB NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
