# KLEENUPLink API Endpoints

Base URL (local dev): `http://localhost:4000`

---

## Auth Reference

| Route Group | How to Authenticate |
|---|---|
| Public / Health | No auth required |
| WordPress bridge (`/handoff`, `/landing-visit`) | `Authorization: Bearer <INTERNAL_API_TOKEN>` or HMAC signature via `X-Signature` header |
| Flutter webhooks (`/webhooks/app/*`) | `Authorization: Bearer <INTERNAL_API_TOKEN>` or HMAC signature |
| Admin routes (`/admin/*`) | `Authorization: Bearer <ADMIN_API_TOKEN>` |
| Portal routes (`/portal/*`) | `Authorization: Bearer <agent_jwt>` (JWT signed with `AGENT_JWT_SECRET`, payload must contain `agentId`) |

---

## 1. Health & System

No auth required. Safe to call from anywhere to verify the server is up.

### `GET /api/health`
Returns a simple alive check.
```json
{ "ok": true }
```

### `GET /api/version`
Returns the service name and version.
```json
{ "service": "kleenuplink", "version": "1.0.0" }
```

---

## 2. WordPress Bridge

Called by the WordPress plugin when a visitor lands on a referral page or submits an address. Requires Bearer token or HMAC signature.

### `POST /api/handoff`
**The most critical endpoint.** WordPress calls this when a visitor enters a service address via a referral link. Creates a `Lead_Handoff` record that links the agent to a normalized address — this is the record that will eventually be matched to a completed job for commission calculation.

**Request body:**
```json
{
  "agentId": "X-Jane123",
  "normalizedAddress": "123 Main Street, Aspen Hill, MD 20906",
  "visitorIp": "73.214.10.5",
  "serviceCategory": "CLEANING",
  "fingerprint": "browserhash123",
  "idempotencyKey": "handoff-xjane-123main-001"
}
```

**Response:**
```json
{
  "ok": true,
  "handoffUuid": "c8f2c1c1-...",
  "threatLevel": "CLEAN",
  "requiresAudit": false
}
```

- `threatLevel` will be `CLEAN`, `GREY`, or `BLACK`. Black IPs are rejected with 403.
- `requiresAudit: true` means the handoff was recorded but is flagged — the agent cannot earn from it until an admin clears it.
- Send the same `idempotencyKey` on retries to prevent duplicate records.

---

### `POST /api/landing-visit`
Logs a page hit when a visitor clicks a referral link but hasn't entered an address yet. Used to populate the agent's "visits" analytics in their portal.

**Request body:**
```json
{
  "agentId": "X-Jane123",
  "visitorIp": "73.214.10.5",
  "sourceUrl": "https://kleenup.com/friends/X-Jane123",
  "fingerprint": "browserhash123"
}
```

**Response:**
```json
{ "ok": true, "visitId": "uuid..." }
```

---

### `GET /api/public/agents/:agentId`
Returns public-facing profile data for an agent's landing page. Called by WordPress to render `/friends/:agentId`. No auth required — this is public.

**Response:**
```json
{
  "agentId": "X-Jane123",
  "status": "ACTIVE",
  "activationDate": "2026-01-15T00:00:00.000Z"
}
```

Returns 404 if the agent doesn't exist or is suspended.

---

## 3. Flutter / App Webhooks

Called by the KLEENUP Flutter app backend when user or project events occur. Requires Bearer token or HMAC signature.

### `POST /api/webhooks/app/auto-enroll`
Called the moment a new user registers in the Flutter app. Automatically creates an ACTIVE agent profile for that user so they can immediately start referring friends.

**Request body:**
```json
{
  "userId": "88472",
  "email": "user@example.com",
  "defaultPolicyId": "2b82c1c1-..."
}
```

**Response:**
```json
{ "ok": true, "agentId": "88472", "created": true }
```

- `created: false` means the agent already existed (safe to ignore).

---

### `POST /api/webhooks/app/project-upsert`
Called whenever a project is created or updated in the Flutter app. Stores a shadow copy of the project metadata that KLEENUPLink needs for commission matching.

**Request body:**
```json
{
  "masterProjectId": "proj_10021",
  "normalizedAddress": "123 Main Street, Aspen Hill, MD 20906",
  "serviceCategory": "CLEANING",
  "grossTransactionAmount": 200.00,
  "kleenupFeeAmount": 20.00,
  "projectStatus": "PENDING",
  "disputedFlag": false
}
```

---

### `POST /api/webhooks/app/project-completed`
Shortcut for `project-upsert` that forces `projectStatus` to `COMPLETED`. Call this when a cleaner marks a job done in the app.

Same request body as `project-upsert`.

---

### `POST /api/webhooks/app/dispute-cleared`
**Triggers commission calculation.** Call this after the 24-hour dispute window expires with no complaint (`disputedFlag: false`). KLEENUPLink will:
1. Match the address to a `Lead_Handoff`
2. Find the agent and their assigned policy
3. Run the Temporal Decay math against the KLEENUP gross fee
4. Insert a `PENDING_REVIEW` ledger entry for admin approval

**Request body:**
```json
{
  "masterProjectId": "proj_10021",
  "normalizedAddress": "123 Main Street, Aspen Hill, MD 20906",
  "serviceCategory": "CLEANING",
  "grossTransactionAmount": 200.00,
  "kleenupFeeAmount": 20.00,
  "projectStatus": "Completed",
  "disputedFlag": false
}
```

**Response:**
```json
{
  "ok": true,
  "computed": true,
  "eligibility": "ELIGIBLE",
  "ledgerEntries": 2
}
```

- `ledgerEntries` is the number of rows created — typically 1 (agent earning) or 2 (if a parent/tier-2 override also applies).
- `computed: false` with a `reason` means no matching handoff was found or the agent has no policy — not an error, just nothing to compute.

---

## 4. Admin Dashboard

All routes require `Authorization: Bearer <ADMIN_API_TOKEN>`.

### Prospect Management

#### `GET /api/admin/prospects`
Returns all agents in `PROSPECT` status — the vetting queue. Admin reviews these before promoting them.

#### `POST /api/admin/prospects`
Manually creates a single prospect (e.g., from a web sign-up form).

**Request body:**
```json
{ "agentId": "X-Jane123", "parentAgentId": null }
```

#### `POST /api/admin/prospects/bulk-upload`
Creates multiple prospects at once from a CSV import (parsed before sending). Body is an array.

**Request body:**
```json
[
  { "agentId": "X-Jane123", "parentAgentId": null },
  { "agentId": "X-Bob456", "parentAgentId": "X-Jane123" }
]
```

#### `PATCH /api/admin/prospects/:agentId/promote`
Moves a prospect from `PROSPECT` → `PROMOTED`. After this, an invitation email should be sent (email sending is a future addition).

---

### Agent Management

#### `PATCH /api/admin/agents/:agentId/status`
Updates an agent's status. Valid values: `PROSPECT`, `PROMOTED`, `ACTIVE`, `SUSPENDED`.

**Request body:**
```json
{ "status": "SUSPENDED" }
```

#### `PATCH /api/admin/agents/:agentId/policy`
Assigns an incentive policy to an agent. Must be done before the agent can earn commissions.

**Request body:**
```json
{ "policyId": "uuid-of-policy" }
```

---

### Settlement Queue (The Checkmark System)

#### `GET /api/admin/settlements/pending`
Returns all ledger entries with status `PENDING_REVIEW`. This is the admin's daily approval queue — every computed commission lands here before an agent can see it.

#### `PATCH /api/admin/settlements/:ledgerId/review`
Approve, reject, or hold a pending settlement. Only `APPROVED` entries count toward an agent's net payable balance.

**Request body:**
```json
{
  "status": "APPROVED",
  "adminId": "admin_17",
  "reasonCode": "Verified — clean referral"
}
```

Valid statuses: `APPROVED`, `REJECTED`, `ON_HOLD`.

---

### Ledger & Reclaw

#### `POST /api/admin/ledger/reclaw`
Manually deducts money from an agent's ledger (e.g., after a chargeback). Creates a negative `RECLAW` entry. Requires `adminId` and `reasonCode` for audit trail.

**Request body:**
```json
{
  "agentId": "X-Jane123",
  "masterProjectId": "proj_10021",
  "amount": -10.00,
  "adminId": "admin_17",
  "reasonCode": "Chargeback_Reversal"
}
```

#### `GET /api/admin/agents/:agentId/ledger`
Returns the full ledger history for a specific agent — all earnings, overrides, and reclaws.

#### `GET /api/admin/agents/:agentId/handoffs`
Returns all lead handoffs attributed to a specific agent — useful for fraud review or commission disputes.

---

### Threat / IP Rules

#### `GET /api/admin/threat/ip-rules`
Returns all IP rules currently in the threat table (blacklist and greylist entries).

#### `POST /api/admin/threat/ip-rules`
Adds a new IP rule. Use this to block a bot IP or flag a suspicious range.

**Request body:**
```json
{
  "ruleType": "IP",
  "value": "185.220.101.5",
  "category": "BLACK",
  "notes": "Known Tor exit node"
}
```

Valid `ruleType` values: `IP`, `SUBNET`, `COUNTRY`. Valid `category` values: `GREY`, `BLACK`.

#### `PATCH /api/admin/threat/ip-rules/:ruleId`
Updates the category or notes on an existing rule.

**Request body:**
```json
{ "category": "BLACK", "notes": "Upgraded from grey after repeat stuffing" }
```

---

## 5. Agent Portal

All routes require `Authorization: Bearer <agent_jwt>`. The JWT payload must contain `agentId`. The server reads `req.agentId` set by the auth middleware — agents can only see their own data.

### `GET /api/portal/me`
Returns the agent's own profile: status, activation date, assigned policy.

### `GET /api/portal/me/links`
Returns the agent's referral link (e.g., `https://kleenup.com/friends/X-Jane123`).

### `GET /api/portal/me/visits`
Returns the list of landing page visits driven by the agent's referral link — who clicked it and when.

### `GET /api/portal/me/handoffs`
Returns all lead handoffs the agent has generated — every address submitted by a visitor via their link.

### `GET /api/portal/me/ledger`
Returns the agent's full earnings ledger — all entries regardless of status (pending, approved, rejected, reclaws).

### `GET /api/portal/me/net-payable`
Returns the agent's current net payable balance — the sum of all `APPROVED` ledger entries only.

```json
{ "agentId": "X-Jane123", "netPayable": 47.50 }
```

### `GET /api/portal/me/recruits`
Returns agents who were recruited under this agent (Tier-2 sub-agents). Used to show the agent their recruitment tree.

---

## 6. Policies & Computation

Admin-level endpoints for managing the rules engine and manually triggering commission calculation.

### Policy CRUD

#### `GET /api/policies`
Returns all incentive policies.

#### `POST /api/policies`
Creates a new policy (e.g., "Realtor VIP Policy").

**Request body:**
```json
{ "policyName": "Realtor VIP Policy", "serviceCategory": "CLEANING" }
```

#### `GET /api/policies/:policyId`
Returns a single policy including all its tiers.

#### `POST /api/policies/:policyId/tiers`
Adds a tier to a policy. Tiers define the Temporal Decay step-down structure.

**Request body:**
```json
{
  "tierSequence": 1,
  "durationMonths": 6,
  "metricType": "PERCENT_REV",
  "metricValue": 0.50
}
```

- `metricType: "PERCENT_REV"` — percentage of KLEENUP's gross fee (e.g., `0.50` = 50%)
- `metricType: "FIXED_USD"` — flat dollar amount per job (e.g., `20.00`)
- `durationMonths: null` — open-ended tier (never expires)

---

### Computation (Manual Trigger)

These are used during development and for re-running failed computations. In production, computation is triggered automatically by `POST /api/webhooks/app/dispute-cleared`.

#### `POST /api/compute/run-project/:masterProjectId`
Manually runs commission computation for a single project. Looks up the project's address, finds the matching handoff, loads the agent's policy, runs the math, and inserts ledger entries.

**Response:**
```json
{
  "masterProjectId": "proj_10021",
  "eligibility": "ELIGIBLE",
  "ledgerEntries": 1
}
```

#### `POST /api/compute/run-pending`
Runs computation for all projects in the shadow table that are completed, dispute-cleared, and not yet computed. Useful as a batch catch-up job.

**Response:**
```json
{
  "processed": 3,
  "results": [
    { "masterProjectId": "proj_10021", "ok": true, "eligibility": "ELIGIBLE", "ledgerEntries": 1 },
    { "masterProjectId": "proj_10022", "ok": false, "error": "No handoff found for this project address" }
  ]
}
```

---

## 7. WordPress Data Pull

Pulls live data from the KLEENUP WordPress site. Requires `WP_BASE_URL`, `WP_USERNAME`, and `WP_APP_PASSWORD` set in `.env`.

### `GET /api/wp/posts?page=1&perPage=10`
Returns paginated posts from the WordPress REST API.

### `GET /api/wp/users?page=1&perPage=10`
Returns paginated users from the WordPress REST API.

---

## Environment Variables Required

```env
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/kleenuplink

# Auth
INTERNAL_API_TOKEN=dev-shared-token       # Used by WordPress and Flutter webhooks
HMAC_SHARED_SECRET=supersecret            # Alternative to Bearer for internal calls
AGENT_JWT_SECRET=agentportaljwt           # Signs/verifies agent portal JWTs
ADMIN_API_TOKEN=admintoken                # Static token for admin dashboard

# WordPress
WP_BASE_URL=https://kleenup.com
WP_USERNAME=wp_api_user
WP_APP_PASSWORD=wp_app_password

# AWS (future)
AWS_REGION=us-east-1
SES_FROM_EMAIL=no-reply@kleenup.com
```
