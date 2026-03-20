# KLEENUPLink MVP Build Plan

## 1) MVP Goal
Deliver a production-safe Standalone Referral and Attribution Engine that can:
- ingest referral handoffs from WordPress,
- track agent lifecycle and policy assignment,
- compute earnings in a shadow ledger after project eligibility,
- enforce manual admin approval before funds are payable,
- support manual reclaws with immutable auditability.

## 2) Hard Constraints (Must Not Break)
- Do not write to KLEENUP production database.
- Do not connect to Stripe or trigger payments.
- Use AI-assisted development and GitHub-based workflow.
- Keep calculations based on KLEENUP gross fee (10% service fee), not net after processor costs.

## 3) MVP Scope
### In Scope
- Agent lifecycle states: PROSPECT, PROMOTED, ACTIVE, SUSPENDED.
- Referral handoff API from WordPress using normalized address as join key.
- Auto-enrollment webhook for new Flutter consumer accounts.
- Policy-driven earnings engine for:
  - temporal decay tiers,
  - fixed payout tiers,
  - one-level parent override window.
- Shadow ledger recommendation flow:
  - PENDING_REVIEW,
  - APPROVED,
  - REJECTED,
  - ON_HOLD,
  - RECLAW adjustments.
- Admin queue for manual decisions and adjustments.
- Idempotency and dedupe for handoffs and project ingestion.
- Basic threat matrix: CLEAN, GREY, BLACK plus CIDR rule table.

### Out of Scope (Post-MVP)
- Full browser fingerprinting platform.
- Complex ML-based fraud scoring.
- Multi-tenant architecture.
- Fully automated payroll disbursement rails.
- Deep BI dashboards and long-range forecasting models.

## 4) Service Architecture (MVP)
- backend: Node.js + Express REST API (source of truth for referral logic).
- database: PostgreSQL schema in database/schema.sql.
- frontend-admin: Next.js admin operations UI.
- frontend-agent: Next.js agent account portal.

## 5) API Contract (MVP Surface)
### Public/Internal Ingestion
- POST /api/referrals/handoff
  - purpose: store agent-to-address handoff from WordPress.
  - idempotency: required header or body field (idempotency_key).
- POST /api/referrals/auto-enroll
  - purpose: create ACTIVE consumer-agent profile from Flutter webhook.
- POST /api/referrals/projects/eligible
  - purpose: ingest eligible project payload for shadow-ledger computation.

### Admin
- GET /api/admin/settlements/pending
  - list pending recommendations requiring decision.
- POST /api/admin/settlements/:ledgerId/decision
  - approve/reject/on-hold a recommendation.
- POST /api/admin/settlements/reclaw
  - create negative adjustment with mandatory reason code.

### Agent
- GET /api/agents/:agentId/dashboard
  - aggregate pipeline, approved earnings, and adjustments.

## 6) Core Business Rules (MVP)
- Join key for attribution is normalized_address.
- Eligibility requires:
  - project_status = COMPLETED,
  - disputed_flag = false.
- First eligible completion at an address starts the temporal clock.
- Percentage payout applies to gross_fee_amount only.
- Parent override eligibility is bounded by override expiry window.
- No amount appears as payable before admin approval.

## 7) Security + Compliance Baseline
- HMAC or short-lived bearer validation for internal calls.
- Role-based admin actions with actor_id captured.
- No full customer PII storage in this service.
- Visitor IP retention policy with masking/scrub job after 90 days.

## 8) Definition of Done for MVP
- End-to-end 22-step scenario works at MVP level:
  - handoff captured,
  - eligible project matched,
  - recommendation created,
  - admin approval visible in agent balance,
  - reclaw reverses payable and preserves immutable audit history.
- Idempotency tests prevent duplicate handoffs and duplicate ledger credits.
- API latency target for POST /handoff under 150ms at normal load.
