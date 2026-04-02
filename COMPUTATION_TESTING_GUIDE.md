# Comprehensive Computation Services Testing Guide

## Table of Contents
1. Prerequisites & Setup
2. Understanding the Data Model
3. Testing Each Computation Service
4. Viewing & Accessing Results
5. Troubleshooting

---

## PART 1: PREREQUISITES & SETUP

### 1.1 Check Backend Server is Running

**Terminal Command:**
```powershell
# Check if server is listening on port 4000
Test-NetConnection -ComputerName localhost -Port 4000 -InformationLevel Quiet
```

**If TRUE:** Server is running ✓
**If FALSE:** Start the server:
```powershell
cd backend
npm start
```

### 1.2 Verify PostgreSQL Connection

**Terminal Command:**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "SELECT version();"
```

**Expected Output:** PostgreSQL version string (e.g., "PostgreSQL 18.3")

### 1.3 Verify Seed Data Loaded

**Terminal Command:**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT 'AGENTS' as entity, COUNT(*) as count FROM agents
UNION ALL
SELECT 'POLICIES', COUNT(*) FROM incentive_policies
UNION ALL
SELECT 'TIERS', COUNT(*) FROM policy_tiers
UNION ALL
SELECT 'HANDOFFS', COUNT(*) FROM lead_handoffs
UNION ALL
SELECT 'REFERRAL CLOCKS', COUNT(*) FROM referral_clocks
UNION ALL
SELECT 'PROJECTS', COUNT(*) FROM project_eligibility_events
UNION ALL
SELECT 'LEDGER ENTRIES', COUNT(*) FROM settlement_ledger
;"
```

**Expected Output:**
```
## SYSTEM PHILOSOPHY: Why Computation Services Matter

### The Business Problem
You have a **referral network** where agents bring customers. You want to:
1. **Pay agents for quality referrals** (incentivize participation)
2. **Prevent overpaying** (protect profit margin)
3. **Audit everything** (tax/legal compliance)
4. **Grow the network** (recruit agents to recruit agents)
5. **Control cash flow** (review before paying)

### Common Failure Modes (What Breaks Without These Tests)

| Failure | Impact | Why It Happens |
|---------|--------|----------------|
| **Auto-pay without review** | Agents paid for disputed projects, chargebacks hit you | No approval gate |
| **Non-deterministic amounts** | Ledger shows $100 one day, $80 next day | Computation not idempotent |
| **Wrong tier selected** | Agent underpaid/overpaid | Time calculation error |
| **Parent override always paid** | Cost 10% more than intended | Expiry check missing |
| **Disputed projects paid** | Customer disputes → refund → loss | Eligibility gate broken |
| **Duplicate entries** | Agent gets paid twice for 1 project | No idempotency check |
| **Negative reclaw as positive** | Agent gains money instead of loses | Amount-sign validation missing |

### How Computation Services Prevent Failures

```
Project Completed
  ↓
Computation Engine (These are the 8 functions you're testing)
  ├─→ isProjectEligible()         [Gate 1: COMPLETED + not disputed?]
  ├─→ selectActivePolicyTier()    [Gate 2: Correct tier by time?]
  ├─→ computeTierPayoutAmount()   [Deterministic: Same input = same output]
  ├─→ isParentOverrideActive()    [Gate 3: Parent exists + not expired?]
  ├─→ computeParentOverrideAmount() [Deterministic calculation]
  ├─→ buildSettlementRecommendations() [Orchestrator function]
  ├─→ createReclawAdjustment()    [Gate 4: Force negative, require reason]
  └─→ computeNetPayable()         [Gate 5: Only count APPROVED]
  ↓
Ledger Entry (PENDING_REVIEW status)
  ↓
Admin Review Gate (human approval)
  ↓
Ledger Entry (APPROVED status)
  ↓
Agent Can Withdraw
```

### Why Each Test Exists

**Tests 1-5**: Core computation pipeline
- Ensure eligibility gates work
- Ensure amounts calculated correctly
- Ensure approval workflow blocks auto-pay
- Ensure only approved amounts count

**Tests 6-8**: Edge cases & fraud prevention
- Dispute handling (gate works)
- Tier selection over time (decay incentive works)
- Parent expiry (controls costs)

**Test 9**: State management
- ON_HOLD status exists (audit trail)

---

       entity        | count
---------------------+-------


 AGENTS              |     2
 POLICIES            |     1
 TIERS               |     3
 HANDOFFS            |     1
 REFERRAL CLOCKS     |     1
 PROJECTS            |     1
 LEDGER ENTRIES      |     0  (initially empty)
```

---

## PART 2: UNDERSTANDING THE DATA MODEL

### Agent Hierarchy
```
X-Bob456 (Parent Agent)
  └── X-Jane123 (Child Agent)
       └── Parent override: 10% of earnings for 9 months from now()
```

### Policy Structure
```
Policy: "2026 Cleaning Referral Program"
├── Tier 1: 0-6 months elapsed   → 50% of fee
├── Tier 2: 6-12 months elapsed  → 25% of fee
└── Tier 3: 12+ months elapsed   → 10% of fee
```

### Example Project
```
Address: "123 main street aspen hill md 20906"
Address Hash: 61e7c9f3ca62a374fcbca576bc72bf0ac36bdbe1fecdbd30f9480d4954644133
Agent: X-Jane123
Parent: X-Bob456
Project Fee: $200 (subject to payout calculation)
Clock Started: 10 days ago (still in Tier 1: 50%)
```

### Ledger Entry States
```
PENDING_REVIEW  → Admin hasn't reviewed yet
   ↓
APPROVED        → Admin approved, counts toward payable balance
   ↓
REJECTED        → Admin rejected, doesn't count
   
ON_HOLD         → Awaiting verification, doesn't count
RECLAW          → Negative amount, auto-APPROVED, reduces payable
```

---

## PART 3: TESTING EACH COMPUTATION SERVICE

### TEST 1: Basic Eligibility & Tier Calculation

**What This Tests:**
- Eligible project produces settlement recommendations
- Tier 1 payout is applied correctly (50%)
- Parent override payout is applied correctly (10%)

**Step 1.1: Trigger Computation Webhook**
```powershell
$body = '{
  "masterProjectId": "test-basic-001",
  "normalizedAddress": "123 main street aspen hill md 20906",
  "serviceCategory": "CLEANING",
  "grossTransactionAmount": 2000,
  "kleenupFeeAmount": 200,
  "projectStatus": "COMPLETED",
  "disputedFlag": false
}'

Write-Host "Posting dispute-cleared webhook for test-basic-001..."
$response = Invoke-WebRequest -Uri "http://localhost:4000/api/webhooks/app/dispute-cleared" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing

Write-Host "=== WEBHOOK RESPONSE ==="
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

**What Should Happen:**
1. Webhook validates input
2. Finds handoff matching address hash
3. Loads agent policy configuration
4. Calculates time elapsed since clock start (should be ~10 days)
5. Selects Tier 1 (50% rate)
6. Computes: $200 × 0.50 = $100 for main agent
7. Computes: $200 × 0.10 = $20 for parent override
8. Inserts 2 ledger entries in PENDING_REVIEW status

**Expected Response:**
```json
{
  "ok": true,
  "computed": true,
  "eligibility": "ELIGIBLE",
  "ledgerEntries": 2
}
```

**View Results in Database:**

**Command 1: See All Ledger Entries**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT 
  ledger_id,
  agent_id,
  amount,
  transaction_type,
  status,
  created_at
FROM settlement_ledger 
WHERE master_project_id = 'test-basic-001'
ORDER BY created_at;"
```

**Expected Output:**
```
                 ledger_id                 | agent_id  | amount | transaction_type |     status     |         created_at
------------------------------------------+-----------+--------+------------------+----------------+----------------------------
 [UUID1]                                  | X-Jane123 | 100.00 | EARNING          | PENDING_REVIEW | 2026-03-26 19:58:00
 [UUID2]                                  | X-Bob456  |  20.00 | TIER2_OVERRIDE   | PENDING_REVIEW | 2026-03-26 19:58:00
```

**Command 2: Understanding the Amounts**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT 
  'CALCULATION BREAKDOWN' as info,
  'X-Jane123' as agent,
  'Gross Fee' as field,
  200.00 as value
UNION ALL
SELECT '', 'X-Jane123', 'Tier Rate (50%)', 0.50
UNION ALL
SELECT '', 'X-Jane123', '= Earning', 100.00
UNION ALL
SELECT '', 'X-Bob456', 'Gross Fee', 200.00
UNION ALL
SELECT '', 'X-Bob456', 'Parent Rate (10%)', 0.10
UNION ALL
SELECT '', 'X-Bob456', '= Override', 20.00;"
```

---

### TEST 2: Settlement Approval Workflow

**What This Tests:**
- Admin can change ledger status from PENDING_REVIEW → APPROVED
- Only APPROVED entries count toward payable balance

**Step 2.1: Get a Ledger ID to Approve**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
$ledgerId = psql -U postgres -d kleenupreferral `
  -c "SELECT ledger_id FROM settlement_ledger WHERE master_project_id = 'test-basic-001' AND transaction_type = 'EARNING';" `
  -q --no-align --tuples-only

Write-Host "Ledger ID to approve: $ledgerId"
```

**Step 2.2: Approve via API**
```powershell
$env:ADMIN_API_TOKEN = "toke"
Write-Host "Client token = [$env:ADMIN_API_TOKEN]"

$headers = @{ Authorization = "Bearer token" }

$body = '{
  "status": "APPROVED",
  "adminId": "admin-001",
  "reasonCode": "MANUAL_REVIEW_APPROVED"
}'

Write-Host "Approving ledger entry..."
$response = Invoke-WebRequest -Uri "http://localhost:4000/api/admin/settlements/$ledgerId/review" `
  -Method PATCH `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing

Write-Host "Response: $($response.StatusCode)"
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

**Step 2.3: Verify Status Changed**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT 
  ledger_id,
  agent_id,
  amount,
  transaction_type,
  status,
  updated_at
FROM settlement_ledger
WHERE master_project_id = 'test-basic-001'
ORDER BY created_at;"
```


**Expected Output After Step 2.3:**
```
 agent_id  | amount | transaction_type |     status     |       updated_at
-----------+--------+------------------+----------------+----------------------------
 X-Jane123 | 100.00 | EARNING          | APPROVED       | 2026-03-26 20:00:15
 X-Bob456  |  20.00 | TIER2_OVERRIDE   | PENDING_REVIEW | 2026-03-26 19:58:00
```

**What Changed:**
- X-Jane123's $100 entry is now APPROVED
- X-Bob456's $20 entry is still PENDING_REVIEW
- Only $100 counts toward payable balance currently

---

### TEST 3: Settlement Rejection

**What This Tests:**
- Admin can reject entries (they don't count toward payable)

**Step 3.1: Get Pending Entry**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
$ledgerId = psql -U postgres -d kleenupreferral `
  -c "SELECT ledger_id FROM settlement_ledger WHERE master_project_id = 'test-basic-001' AND status = 'PENDING_REVIEW';" `
  -q --no-align --tuples-only

Write-Host "Ledger ID to reject: $ledgerId"
```

**Step 3.2: Reject via API**
```powershell
$body = "{
  ""status"": ""REJECTED"",
  ""adminId"": ""admin-001"",
  ""adminReasonCode"": ""DUPLICATE_RECORD""
}"

$response = Invoke-WebRequest -Uri "http://localhost:4000/api/admin/settlements/$ledgerId/review" `
  -Method PATCH `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body `
  -UseBasicParsing

Write-Host "Rejection response: $($response.StatusCode)"
```

**Step 3.3: Verify Status Changed**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT agent_id, amount, status FROM settlement_ledger WHERE master_project_id = 'test-basic-001';"
```

**Expected Output:**
```
 agent_id  | amount |     status
-----------+--------+----------------
 X-Jane123 | 100.00 | APPROVED
 X-Bob456  |  20.00 | REJECTED
```

---

### TEST 4: Net Payable Calculation (Portal Service)

**What This Tests:**
- Agent can view their total earnings (only APPROVED entries)
- REJECTED and PENDING_REVIEW entries are excluded

**Step 4.1: Query Agent Payable Balance**
```powershell
$agentToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZ2VudElkIjoiWC1KYW5lMTIzIn0.fXLGehdgHkdvMINqNQvVx6fBDw52iOtHve2xmLASe1M"

$headers = @{ Authorization = "Bearer $agentToken" }

$response = Invoke-WebRequest -Uri "http://localhost:4000/api/portal/me/net-payable" `
  -Method GET `
  -Headers $headers `
  -UseBasicParsing

Write-Host "=== Agent Payable Balance ==="
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Expected Response:**
```json
{
  "agentId": "X-Jane123",
  "payableBalance": 100.00
}
```

**Why $100?**
- X-Jane123 has $100 APPROVED
- PENDING_REVIEW entries don't count
- Calculation uses the `agent_payable_balances` view

**Step 4.2: Verify via Database View**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT 
  agent_id,
  total_payable
FROM agent_payable_balances
ORDER BY agent_id;"
```

**Expected Output:**
```
 agent_id  | total_payable
-----------+---------------
 X-Jane123 |        100.00
 X-Bob456  |           0.00
```

**Why X-Bob456 is 0?**
- Their $20 override was REJECTED
- They have no other ledger entries

---

### TEST 5: Reclaw Adjustment (Admin Service)

**What This Tests:**
- Admin can create negative adjustments for chargeback/refund scenarios
- Reclaws are auto-APPROVED and immediately affect payable balance
- Amount is forced negative regardless of what admin sends

**Step 5.1: Create a Reclaw**
```powershell
$adminHeaders = @{ Authorization = "Bearer token" }
$body = '{
  "agentId": "X-Jane123",
  "amount": 30,
  "masterProjectId": "test-basic-001",
  "reasonCode": "CUSTOMER_CHARGEBACK",
  "adminId": "admin-001"
}'

Write-Host "Creating reclaw adjustment..."
$response = Invoke-WebRequest -Uri "http://localhost:4000/api/admin/ledger/reclaw" `
  -Method POST `
  -ContentType "application/json" `
  -Headers $adminheaders `
  -Body $body `
  -UseBasicParsing

Write-Host "Response: $($response.StatusCode)"
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Expected Response:**
```json
{
  "ok": true,
  "ledgerId": "[UUID]",
  "amount": -30.00,
  "status": "APPROVED"
}
```

**Key Point:** Admin sent `"amount": 30`, but system stored `-30.00` (forced negative)

**Step 5.2: Verify Reclaw in Database**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT 
  agent_id,
  amount,
  transaction_type,
  status,
  admin_reason_code
FROM settlement_ledger 
WHERE transaction_type = 'RECLAW'
ORDER BY created_at DESC LIMIT 5;"
```

**Expected Output:**
```
 agent_id  | amount | transaction_type |  status  | admin_reason_code
-----------+--------+------------------+----------+-------------------
 X-Jane123 | -30.00 | RECLAW           | APPROVED | CUSTOMER_CHARGEBACK
```

**Step 5.3: Verify Payable Balance Updated**
```powershell
$agentToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZ2VudElkIjoiWC1KYW5lMTIzIn0.fXLGehdgHkdvMINqNQvVx6fBDw52iOtHve2xmLASe1M"

$headers = @{ Authorization = "Bearer $agentToken" }

$response = Invoke-WebRequest -Uri "http://localhost:4000/api/portal/me/net-payable" `
  -Method GET `
  -Headers $headers `
  -UseBasicParsing

Write-Host "=== Agent Payable Balance ==="
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Expected Output:**
```json
{
  "agentId": "X-Jane123",
  "payableBalance": 70.00
}
```

**Calculation:**
- $100 (APPROVED EARNING)
- -$30 (APPROVED RECLAW)
- = $70 total payable

---

### TEST 6: Ineligible Project (Disputed)

**What This Tests:**
- Disputed projects generate 0 ledger recommendations
- Even if OTHER fields are correct, one disputed flag blocks all payouts

**Step 6.1: Create Disputed Project**
```powershell
$body = '{
  "masterProjectId": "test-disputed-001",
  "normalizedAddress": "123 main street aspen hill md 20906",
  "serviceCategory": "CLEANING",
  "grossTransactionAmount": 2000,
  "kleenupFeeAmount": 200,
  "projectStatus": "COMPLETED",
  "disputedFlag": true
}'

Write-Host "Posting disputed project webhook..."
$response = Invoke-WebRequest -Uri "http://localhost:4000/api/webhooks/app/project-completed" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing

Write-Host "Response: $($response.StatusCode)"
$response.Content
```

**Expected Response:**
```json
{"ok":true,"masterProjectId":"test-disputed-001"}
```

**Step 6.2: Verify NO Ledger Entries Created**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT COUNT(*) as entry_count 
FROM settlement_ledger 
WHERE master_project_id = 'test-disputed-001';"
```

**Expected Output:**
```
 entry_count
-------------
           0
```

---

### TEST 7: Tier Selection (Different Time Periods)

**What This Tests:**
- Correct tier is selected based on months elapsed
- Tier 1 (50%): 0-6 months
- Tier 2 (25%): 6-12 months
- Tier 3 (10%): 12+ months

**Context:** Current seed data clock started 10 days ago → Should be Tier 1

**Step 7.1: Test Tier 2 - Setup New Agent with Old Clock**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"

# Create new address
$newAddress = "999 tier2-test street city state 12345"
$newAddressHash = (node -e "const {hashNormalizedAddress} = require('./backend/src/utils/formatters'); console.log(hashNormalizedAddress('$newAddress'))")

Write-Host "New Address Hash: $newAddressHash"

# Insert handoff record
psql -U postgres -d kleenupreferral -c "
INSERT INTO lead_handoffs 
  (handoff_uuid, idempotency_key, agent_id, normalized_address, address_hash, visitor_ip, threat_level)
VALUES 
  ('777e8400-e29b-41d4-a716-446655440002'::UUID, 
   'handoff_tier2_test', 
   'X-Jane123', 
   '$newAddress', 
   '$newAddressHash', 
   '203.0.113.50', 
   'CLEAN')
ON CONFLICT DO NOTHING;"

# Insert clock that started 8 months ago (Tier 2)
psql -U postgres -d kleenupreferral -c "
INSERT INTO referral_clocks 
  (address_hash, owning_agent_id, first_master_project_id, clock_start_date)
VALUES 
  ('$newAddressHash', 'X-Jane123', 'proj_tier2_old', NOW() - INTERVAL '8 months')
ON CONFLICT DO NOTHING;"
```

**Step 7.2: Trigger Webhook for Tier 2 Address**
```powershell
$body = "{
  ""masterProjectId"": ""test-tier2-001"",
  ""normalizedAddress"": ""999 tier2-test street city state 12345"",
  ""serviceCategory"": ""CLEANING"",
  ""grossTransactionAmount"": 2000,
  ""kleenupFeeAmount"": 200
}"

$response = Invoke-WebRequest -Uri "http://localhost:4000/api/webhooks/app/dispute-cleared" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing

Write-Host "Response:"
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Step 7.3: Verify Tier 2 Amounts (25%)**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT 
  agent_id,
  amount,
  transaction_type,
  'Calculation:' as note,
  CASE 
    WHEN transaction_type = 'EARNING' THEN '200 * 0.25 = 50'
    WHEN transaction_type = 'TIER2_OVERRIDE' THEN '200 * 0.10 = 20'
  END as expected
FROM settlement_ledger 
WHERE master_project_id = 'test-tier2-001'
ORDER BY created_at;"
```

**Expected Output:**
```
 agent_id  | amount | transaction_type |     note      |     expected
-----------+--------+------------------+---------------+------------------
 X-Jane123 |  50.00 | EARNING          | Calculation:  | 200 * 0.25 = 50
 X-Bob456  |  20.00 | TIER2_OVERRIDE   | Calculation:  | 200 * 0.10 = 20
```

**Key Difference from Test 1:**
- Test 1: $100 earning (50% Tier 1)
- Test 7: $50 earning (25% Tier 2)
- Both have $20 parent override
- **Proves tier selection works correctly**

---

### TEST 8: Parent Override Expiry

**What This Tests:**
- If parent override expires BEFORE project completion, no parent earnings
- If parent override is NULL, no parent earnings

**Step 8.1: Create Agent with EXPIRED Parent**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"

psql -U postgres -d kleenupreferral -c "
INSERT INTO agents 
  (agent_id, status, parent_agent_id, assigned_policy_id, activation_date, override_expires_at)
VALUES 
  ('X-Expired-Child', 'ACTIVE', 'X-Bob456', '550e8400-e29b-41d4-a716-446655440000'::UUID, NOW(), NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;"

# Verify expiry date is in the past
psql -U postgres -d kleenupreferral -c "
SELECT agent_id, parent_agent_id, override_expires_at, 
  (override_expires_at < NOW()) as is_expired
FROM agents WHERE agent_id = 'X-Expired-Child';"
```

**Expected Output:**
```
   agent_id     | parent_agent_id |    override_expires_at    | is_expired
----------------+-----------------+---------------------------+------------
 X-Expired-Child| X-Bob456        | 2026-03-25 19:58:00+00:00 |    t
```

**Step 8.2: Trigger Webhook for Expired Parent Agent**
```powershell
# Create a handoff for this agent
$env:PGPASSWORD = "Tanmanx08192007"
$expiredAddress = "888 expired-parent street city state 12345"
$expiredAddressHash = (node -e "const {hashNormalizedAddress} = require('./backend/src/utils/formatters'); console.log(hashNormalizedAddress('$expiredAddress'))")

psql -U postgres -d kleenupreferral -c "
INSERT INTO lead_handoffs 
  (handoff_uuid, idempotency_key, agent_id, normalized_address, address_hash, visitor_ip, threat_level)
VALUES 
  ('777e8400-e29b-41d4-a716-446655440003'::UUID, 
   'handoff_expired_parent', 
   'X-Expired-Child', 
   '$expiredAddress', 
   '$expiredAddressHash', 
   '203.0.113.51', 
   'CLEAN')
ON CONFLICT DO NOTHING;"

# Clock for this agent
psql -U postgres -d kleenupreferral -c "
INSERT INTO referral_clocks 
  (address_hash, owning_agent_id, first_master_project_id, clock_start_date)
VALUES 
  ('$expiredAddressHash', 'X-Expired-Child', 'proj_expired_parent', NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;"
```

**Step 8.3: Trigger Webhook**
```powershell
$body = "{
  ""masterProjectId"": ""test-expired-parent-001"",
  ""normalizedAddress"": ""888 expired-parent street city state 12345"",
  ""serviceCategory"": ""CLEANING"",
  ""grossTransactionAmount"": 2000,
  ""kleenupFeeAmount"": 200
}"

$response = Invoke-WebRequest -Uri "http://localhost:4000/api/webhooks/app/dispute-cleared" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Step 8.4: Verify Only 1 Ledger Entry (No Parent Override)**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT 
  agent_id,
  amount,
  transaction_type,
  COUNT(*) as entry_count
FROM settlement_ledger 
WHERE master_project_id = 'test-expired-parent-001'
GROUP BY agent_id, amount, transaction_type;"
```

**Expected Output:**
```
   agent_id    | amount | transaction_type | entry_count
----------------+--------+------------------+------------------
 X-Expired-Child|100.00  | EARNING          |            1
```

**Not Present:**
- No TIER2_OVERRIDE for X-Bob456
- **Proves parent expiry check works**

---

### TEST 9: On Hold Status

**What This Tests:**
- Admin can put entries ON_HOLD (pending verification)
- ON_HOLD entries don't count toward payable balance (not APPROVED)

**Step 9.1: Get a PENDING_REVIEW Entry**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
$ledgerId = psql -U postgres -d kleenupreferral `
  -c "SELECT ledger_id FROM settlement_ledger WHERE status = 'PENDING_REVIEW' LIMIT 1;" `
  -q --no-align --tuples-only

Write-Host "Ledger ID to put on hold: $ledgerId"
```

**Step 9.2: Update Status to ON_HOLD**
```powershell
$body = "{
  ""status"": ""ON_HOLD"",
  ""adminReasonCode"": ""AWAITING_VERIFICATION""
}"

$response = Invoke-WebRequest -Uri "http://localhost:4000/api/admin/settlements/$ledgerId/review" `
  -Method PATCH `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing

Write-Host "Response: $($response.StatusCode)"
```

**Step 9.3: Verify Status is ON_HOLD**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT ledger_id, agent_id, status, admin_reason_code 
FROM settlement_ledger WHERE ledger_id = '$ledgerId';"
```

**Expected Output:**
```
                 ledger_id                 | agent_id |   status   | admin_reason_code
------------------------------------------+-----------+------------+-------------------
 [UUID]                                   | X...      | ON_HOLD    | AWAITING_VERIFICATION
```

---

## PART 4: VIEWING & ACCESSING RESULTS

### 4.1 View All Ledger Entries

**Basic Query:**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT 
  ledger_id,
  master_project_id,
  agent_id,
  amount,
  status,
  created_at
FROM settlement_ledger
ORDER BY created_at DESC LIMIT 20;"
```

### 4.2 View Only APPROVED Entries

**Query:**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT 
  master_project_id,
  agent_id,
  SUM(amount) as total_approved
FROM settlement_ledger
WHERE status = 'APPROVED'
GROUP BY master_project_id, agent_id
ORDER BY created_at DESC;"
```

### 4.3 View Entry by Project

**Query:**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT 
  agent_id,
  transaction_type,
  amount,
  status,
  admin_reason_code
FROM settlement_ledger
WHERE master_project_id = 'test-basic-001'
ORDER BY created_at;"
```

### 4.4 View Team Payable Balances (Read-Only View)

**Query:**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT * FROM agent_payable_balances
ORDER BY agent_id;"
```

**Output:**
```
 agent_id  | total_payable
-----------+---------------
 X-Bob456  |          0.00
 X-Jane123 |         70.00
```

### 4.5 View Admin Audit Log

**Query:**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT 
  admin_id,
  action_type,
  affected_ledger_id,
  reason_code,
  created_at
FROM admin_audit_log
ORDER BY created_at DESC LIMIT 20;"
```

### 4.6 View Referral Clocks

**Query:**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT 
  owning_agent_id,
  first_master_project_id,
  clock_start_date,
  EXTRACT(DAY FROM (NOW() - clock_start_date)) as days_elapsed,
  EXTRACT(MONTH FROM (NOW() - clock_start_date)) as months_elapsed
FROM referral_clocks
ORDER BY clock_start_date DESC;"
```

---

## PART 5: TROUBLESHOOTING

### Issue: "No matching handoff for address"

**Cause:** Address hash doesn't match

**Solution:**
```powershell
# Check what addresses exist
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT normalized_address, address_hash FROM lead_handoffs;"

# Then calculate what hash your address should be
node -e "const {hashNormalizedAddress} = require('./backend/src/utils/formatters'); console.log(hashNormalizedAddress('your-exact-address'));"
```

### Issue: Wrong Amount Calculated

**Debug Steps:**
```powershell
# 1. Check agent's policy
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "
SELECT a.agent_id, a.assigned_policy_id, p.policy_name
FROM agents a
LEFT JOIN incentive_policies p ON a.assigned_policy_id = p.policy_id
WHERE a.agent_id = 'X-Jane123';"

# 2. Check policy tiers
psql -U postgres -d kleenupreferral -c "
SELECT tier_sequence, duration_months, metric_type, metric_value
FROM policy_tiers
WHERE policy_id = (SELECT assigned_policy_id FROM agents WHERE agent_id = 'X-Jane123')
ORDER BY tier_sequence;"

# 3. Check referral clock (when did it start?)
psql -U postgres -d kleenupreferral -c "
SELECT 
  clock_start_date,
  DATE_TRUNC('day', NOW() - clock_start_date) as age,
  EXTRACT(MONTH FROM (NOW() - clock_start_date)) as months_elapsed
FROM referral_clocks
WHERE owning_agent_id = 'X-Jane123';"
```

### Issue: Parent Override Not Appearing

**Debug Steps:**
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
# 1. Check if agent has parent
psql -U postgres -d kleenupreferral -c "
SELECT agent_id, parent_agent_id, override_expires_at
FROM agents WHERE agent_id = 'X-Jane123';"

# 2. Check if parent still active
psql -U postgres -d kleenupreferral -c "
SELECT agent_id, status FROM agents WHERE agent_id = 'X-Bob456';"

# 3. Check if override hasn't expired
psql -U postgres -d kleenupreferral -c "
SELECT override_expires_at, NOW(), (override_expires_at > NOW()) as still_valid
FROM agents WHERE agent_id = 'X-Jane123';"
```

---

## PART 6: SUMMARY CHECKLIST

Use this to verify all features work:

- [ ] **TEST 1:** Basic eligible project creates 2 ledger entries
- [ ] **TEST 2:** Admin can approve entry
- [ ] **TEST 3:** Admin can reject entry
- [ ] **TEST 4:** Agent can view net payable (APPROVED only)
- [ ] **TEST 5:** Admin can create reclaw (forces negative)
- [ ] **TEST 6:** Disputed projects create 0 entries
- [ ] **TEST 7:** Tier selection changes payout % correctly
- [ ] **TEST 8:** Expired parent override blocks TIER2_OVERRIDE entry
- [ ] **TEST 9:** Admin can put entry ON_HOLD

---

## QUICK REFERENCE: PowerShell Snippets

### Check Server Running
```powershell
Test-NetConnection -ComputerName localhost -Port 4000 -InformationLevel Quiet
```

### Get All Ledger Entries
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "SELECT * FROM settlement_ledger ORDER BY created_at DESC LIMIT 10;"
```

### Get Agent Payable Balance
```powershell
$body = '{"agentId":"X-Jane123"}'
Invoke-WebRequest -Uri "http://localhost:4000/api/portal/agent/payable-balance" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
```

### Trigger Webhook
```powershell
$body = '{"masterProjectId":"test-X","normalizedAddress":"123 main street aspen hill md 20906","serviceCategory":"CLEANING","grossTransactionAmount":2000,"kleenupFeeAmount":200}'
Invoke-WebRequest -Uri "http://localhost:4000/api/webhooks/app/dispute-cleared" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
```

### Clear All Ledger (for fresh testing)
```powershell
$env:PGPASSWORD = "Tanmanx08192007"
psql -U postgres -d kleenupreferral -c "DELETE FROM settlement_ledger; DELETE FROM admin_audit_log;"
```
