# KLEENUPLink MVP Backlog

## Sprint 0 - Foundation
- [ ] Create PostgreSQL schema and indexes from database/schema.sql.
- [ ] Add environment management and secrets contract (.env.example for each app).
- [ ] Define API auth strategy (HMAC or short-lived bearer) and middleware.
- [ ] Stand up health checks and error envelope conventions.

## Sprint 1 - Referral Ingestion
- [ ] Implement POST /api/referrals/handoff with idempotency key support.
- [ ] Add threat classification service (CLEAN/GREY/BLACK).
- [ ] Persist lead handoff records and dedupe duplicates.
- [ ] Add request validation for address, ip, and agent_id.

## Sprint 2 - Agent Lifecycle + Policies
- [ ] Implement agent creation for prospect/promoted/active states.
- [ ] Build policy + policy_tiers CRUD (admin-only).
- [ ] Implement auto-enroll webhook for new consumer registrations.
- [ ] Add parent-child recruitment link support (one-level hierarchy).

## Sprint 3 - Eligibility + Shadow Ledger
- [ ] Implement project eligibility ingestion endpoint.
- [ ] Add matching engine by normalized address.
- [ ] Create referral clock on first eligible completion per address.
- [ ] Implement payout calculator for percent and fixed tiers.
- [ ] Write settlement recommendations as PENDING_REVIEW entries.
- [ ] Guard duplicate credits by project + agent uniqueness.

## Sprint 4 - Admin Settlement Queue
- [ ] Build pending review query endpoint.
- [ ] Implement approve/reject/on-hold decisions.
- [ ] Implement reclaw endpoint with required reason code and actor.
- [ ] Expose payable balance as approved earnings plus adjustments.

## Sprint 5 - UIs (Thin but Functional)
- [ ] frontend-admin: pending queue, decision actions, reclaw form.
- [ ] frontend-agent: net payable, referral pipeline, ledger history.
- [ ] Basic auth guard and role separation for admin vs agent views.

## Testing Requirements
- [ ] Idempotency tests for duplicate handoff payloads.
- [ ] Calculator tests for temporal decay and fixed fees.
- [ ] Integration test for approve/reclaw lifecycle.
- [ ] Contract tests for webhook payload validation.

## Release Criteria
- [ ] 22-step scenario executable in staging with seeded data.
- [ ] No writes to production systems beyond approved read-only data feeds.
- [ ] Observability available for ingestion failures and settlement decisions.
