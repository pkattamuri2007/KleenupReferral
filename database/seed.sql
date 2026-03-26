-- Sample seed data for testing the referral computation engine
-- This script populates test policies, agents, handoffs, and projects

-- 1. Create a sample policy
INSERT INTO incentive_policies (policy_id, policy_name, service_category)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000'::UUID, '2026 Cleaning Referral Program', 'CLEANING')
ON CONFLICT DO NOTHING;

-- 2. Create tiers for that policy
INSERT INTO policy_tiers (tier_id, policy_id, tier_sequence, duration_months, metric_type, metric_value)
VALUES 
  ('660e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440000'::UUID, 1, 6, 'PERCENT_REV', 0.50),
  ('660e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440000'::UUID, 2, 6, 'PERCENT_REV', 0.25),
  ('660e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440000'::UUID, 3, 0, 'PERCENT_REV', 0.10)
ON CONFLICT DO NOTHING;

-- 3. Create parent agent
INSERT INTO agents (agent_id, status, assigned_policy_id, activation_date)
VALUES 
  ('X-Bob456', 'ACTIVE', '550e8400-e29b-41d4-a716-446655440000'::UUID, NOW())
ON CONFLICT DO NOTHING;

-- 4. Create child agent with parent override
INSERT INTO agents (agent_id, status, parent_agent_id, assigned_policy_id, activation_date, override_expires_at)
VALUES 
  ('X-Jane123', 'ACTIVE', 'X-Bob456', '550e8400-e29b-41d4-a716-446655440000'::UUID, NOW(), NOW() + INTERVAL '9 months')
ON CONFLICT DO NOTHING;

-- 5. Create a sample lead handoff
INSERT INTO lead_handoffs (handoff_uuid, idempotency_key, agent_id, normalized_address, address_hash, visitor_ip, threat_level)
VALUES 
  ('770e8400-e29b-41d4-a716-446655440001'::UUID, 'handoff_test_001', 'X-Jane123', 
   '123 main street aspen hill md 20906', 
   '6c9e87b82ac66c63d2f1286f6cbdfc4c48a60d87e5c8e53f28b39d7e9e3a8f1d', 
   '203.0.113.42', 'CLEAN')
ON CONFLICT DO NOTHING;

-- 6. Create a referral clock (simulating first eligible project at address)
INSERT INTO referral_clocks (address_hash, owning_agent_id, first_master_project_id, clock_start_date)
VALUES 
  ('6c9e87b82ac66c63d2f1286f6cbdfc4c48a60d87e5c8e53f28b39d7e9e3a8f1d', 'X-Jane123', 'proj_test_001', NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;

-- 7. Create an eligible project completion event
INSERT INTO project_eligibility_events 
  (event_id, idempotency_key, master_project_id, normalized_address, address_hash, 
   service_category, project_status, disputed_flag, project_amount, gross_fee_amount, completed_at)
VALUES 
  ('880e8400-e29b-41d4-a716-446655440001'::UUID, 'proj_test_001_elig', 'proj_test_001',
   '123 main street aspen hill md 20906',
   '6c9e87b82ac66c63d2f1286f6cbdfc4c48a60d87e5c8e53f28b39d7e9e3a8f1d',
   'CLEANING', 'COMPLETED', FALSE, 2000.00, 200.00, NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- Verify data loaded
SELECT 'Agents created:' as test, COUNT(*) as count FROM agents WHERE agent_id IN ('X-Jane123', 'X-Bob456');
SELECT 'Policies created:' as test, COUNT(*) as count FROM incentive_policies;
SELECT 'Tiers created:' as test, COUNT(*) as count FROM policy_tiers;
SELECT 'Lead handoffs created:' as test, COUNT(*) as count FROM lead_handoffs;
SELECT 'Referral clocks created:' as test, COUNT(*) as count FROM referral_clocks;
SELECT 'Eligible projects created:' as test, COUNT(*) as count FROM project_eligibility_events;
