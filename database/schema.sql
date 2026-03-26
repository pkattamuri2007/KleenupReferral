-- KLEENUPLink MVP PostgreSQL schema
-- This schema is designed for a shadow-ledger referral engine.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS incentive_policies (
	policy_id UUID PRIMARY KEY,
	policy_name VARCHAR(120) NOT NULL,
	service_category VARCHAR(40) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_policy_service_category
		CHECK (service_category IN ('CLEANING', 'LANDSCAPING', 'ALL', 'PLUMBING', 'HANDYMAN'))
);

CREATE TABLE IF NOT EXISTS policy_tiers (
	tier_id UUID PRIMARY KEY,
	policy_id UUID NOT NULL REFERENCES incentive_policies(policy_id) ON DELETE CASCADE,
	tier_sequence INT NOT NULL,
	duration_months INT NOT NULL,
	metric_type VARCHAR(20) NOT NULL,
	metric_value NUMERIC(10,4) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_tier_sequence_positive CHECK (tier_sequence > 0),
	CONSTRAINT chk_duration_non_negative CHECK (duration_months >= 0),
	CONSTRAINT chk_metric_value_non_negative CHECK (metric_value >= 0),
	CONSTRAINT chk_metric_type CHECK (metric_type IN ('PERCENT_REV', 'FIXED_USD')),
	CONSTRAINT uq_policy_tier_sequence UNIQUE (policy_id, tier_sequence)
);

CREATE TABLE IF NOT EXISTS agents (
	agent_id VARCHAR(80) PRIMARY KEY,
	status VARCHAR(20) NOT NULL,
	parent_agent_id VARCHAR(80) NULL REFERENCES agents(agent_id),
	assigned_policy_id UUID NULL REFERENCES incentive_policies(policy_id),
	activation_date TIMESTAMPTZ NULL,
	override_expires_at TIMESTAMPTZ NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_override_after_activation CHECK (
		override_expires_at IS NULL OR activation_date IS NULL OR override_expires_at >= activation_date
	),
	CONSTRAINT chk_agent_status CHECK (status IN ('PROSPECT', 'PROMOTED', 'ACTIVE', 'SUSPENDED'))
);

CREATE INDEX IF NOT EXISTS idx_agents_parent_agent
	ON agents (parent_agent_id);

CREATE INDEX IF NOT EXISTS idx_agents_status
	ON agents (status);

CREATE TABLE IF NOT EXISTS ip_access_rules (
	rule_id UUID PRIMARY KEY,
	rule_type VARCHAR(20) NOT NULL,
	cidr_or_pattern VARCHAR(80) NOT NULL,
	reason_code VARCHAR(120) NULL,
	active BOOLEAN NOT NULL DEFAULT TRUE,
	created_by VARCHAR(80) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT uq_rule_type_pattern UNIQUE (rule_type, cidr_or_pattern),
	CONSTRAINT chk_rule_type CHECK (rule_type IN ('BLACK', 'GREY'))
);

CREATE TABLE IF NOT EXISTS lead_handoffs (
	handoff_uuid UUID PRIMARY KEY,
	idempotency_key VARCHAR(120) NOT NULL UNIQUE,
	agent_id VARCHAR(80) NOT NULL REFERENCES agents(agent_id),
	normalized_address TEXT NOT NULL,
	address_hash VARCHAR(80) NOT NULL,
	visitor_ip VARCHAR(80) NOT NULL,
	threat_level VARCHAR(10) NOT NULL,
	requires_audit BOOLEAN NOT NULL DEFAULT FALSE,
	source_channel VARCHAR(40) NOT NULL DEFAULT 'WORDPRESS',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_threat_level CHECK (threat_level IN ('CLEAN', 'GREY'))
);

CREATE INDEX IF NOT EXISTS idx_lead_handoffs_address_hash
	ON lead_handoffs (address_hash);

CREATE INDEX IF NOT EXISTS idx_lead_handoffs_agent_created_at
	ON lead_handoffs (agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS referral_clocks (
	address_hash VARCHAR(80) PRIMARY KEY,
	owning_agent_id VARCHAR(80) NOT NULL REFERENCES agents(agent_id),
	first_master_project_id VARCHAR(80) NOT NULL,
	clock_start_date TIMESTAMPTZ NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_referral_clocks_first_project
	ON referral_clocks (first_master_project_id);

CREATE TABLE IF NOT EXISTS settlement_ledger (
	ledger_id UUID PRIMARY KEY,
	agent_id VARCHAR(80) NOT NULL REFERENCES agents(agent_id),
	master_project_id VARCHAR(80) NOT NULL,
	transaction_type VARCHAR(20) NOT NULL,
	amount NUMERIC(12,2) NOT NULL,
	status VARCHAR(20) NOT NULL,
	admin_reason_code VARCHAR(120) NULL,
	actor_admin_id VARCHAR(80) NULL,
	metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_earning_sign CHECK (
		(transaction_type = 'RECLAW' AND amount <= 0) OR
		(transaction_type <> 'RECLAW' AND amount >= 0)
	),
	CONSTRAINT chk_reclaw_reason_required CHECK (
		transaction_type <> 'RECLAW' OR admin_reason_code IS NOT NULL
	),
	CONSTRAINT chk_reclaw_actor_required CHECK (
		transaction_type <> 'RECLAW' OR actor_admin_id IS NOT NULL
	),
	CONSTRAINT chk_transaction_type CHECK (
		transaction_type IN ('EARNING', 'TIER2_OVERRIDE', 'RECLAW', 'SPIFF')
	),
	CONSTRAINT chk_settlement_status CHECK (
		status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ON_HOLD')
	),
	CONSTRAINT uq_project_agent_txn UNIQUE (master_project_id, agent_id, transaction_type)
);

CREATE INDEX IF NOT EXISTS idx_settlement_status_created
	ON settlement_ledger (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_settlement_agent_status
	ON settlement_ledger (agent_id, status);

CREATE TABLE IF NOT EXISTS project_eligibility_events (
	event_id UUID PRIMARY KEY,
	idempotency_key VARCHAR(120) NOT NULL UNIQUE,
	master_project_id VARCHAR(80) NOT NULL,
	normalized_address TEXT NOT NULL,
	address_hash VARCHAR(80) NOT NULL,
	service_category VARCHAR(40) NOT NULL,
	project_status VARCHAR(40) NOT NULL,
	disputed_flag BOOLEAN NOT NULL,
	project_amount NUMERIC(12,2) NOT NULL,
	gross_fee_amount NUMERIC(12,2) NOT NULL,
	completed_at TIMESTAMPTZ NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT uq_project_eligibility_master_project UNIQUE (master_project_id),
	CONSTRAINT chk_project_status_completed CHECK (project_status = 'COMPLETED'),
	CONSTRAINT chk_disputed_false CHECK (disputed_flag = FALSE),
	CONSTRAINT chk_project_amount_non_negative CHECK (project_amount >= 0),
	CONSTRAINT chk_gross_fee_non_negative CHECK (gross_fee_amount >= 0),
	CONSTRAINT chk_gross_fee_within_project_amount CHECK (gross_fee_amount <= project_amount)
);

CREATE INDEX IF NOT EXISTS idx_project_eligibility_address_hash
	ON project_eligibility_events (address_hash, completed_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_log (
	audit_id UUID PRIMARY KEY,
	admin_id VARCHAR(80) NOT NULL,
	action_type VARCHAR(80) NOT NULL,
	target_table VARCHAR(80) NOT NULL,
	target_id VARCHAR(80) NOT NULL,
	reason_code VARCHAR(120) NULL,
	before_json JSONB NULL,
	after_json JSONB NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW agent_payable_balances AS
SELECT
	a.agent_id,
	COALESCE(
		SUM(CASE WHEN sl.status = 'APPROVED' THEN sl.amount ELSE 0 END),
		0
	) AS net_payable
FROM agents a
LEFT JOIN settlement_ledger sl ON sl.agent_id = a.agent_id
GROUP BY a.agent_id;

DROP TRIGGER IF EXISTS trg_incentive_policies_set_updated_at ON incentive_policies;
CREATE TRIGGER trg_incentive_policies_set_updated_at
BEFORE UPDATE ON incentive_policies
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_agents_set_updated_at ON agents;
CREATE TRIGGER trg_agents_set_updated_at
BEFORE UPDATE ON agents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_settlement_ledger_set_updated_at ON settlement_ledger;
CREATE TRIGGER trg_settlement_ledger_set_updated_at
BEFORE UPDATE ON settlement_ledger
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
