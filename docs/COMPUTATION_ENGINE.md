# Computation Engine Contract

This module is intentionally API-agnostic so the API team can call it from controllers or queue workers.

## File
- backend/src/services/computationService.js

## Primary Flow
1. Validate project eligibility (`projectStatus === COMPLETED`, `disputedFlag === false`).
2. Resolve active policy tier using full-month decay since `clockStartDate`.
3. Compute earning amount against `grossFeeAmount`:
   - `PERCENT_REV`: `grossFeeAmount * metricValue`
   - `FIXED_USD`: `metricValue`
4. Optionally compute one-level parent override when active.
5. Return settlement recommendation rows in `PENDING_REVIEW` status.

## Exported Functions
- `isProjectEligible(input)`
- `selectActivePolicyTier(input)`
- `computeTierPayoutAmount(input)`
- `isParentOverrideActive(input)`
- `computeParentOverrideAmount(input)`
- `buildSettlementRecommendations(input)`
- `createReclawAdjustment(input)`
- `computeNetPayable(ledgerEntries)`

## Input Shape for buildSettlementRecommendations
```js
{
  masterProjectId: "proj_123",
  agentId: "X-Jane123",
  grossFeeAmount: 20.00,
  policyTiers: [
    { tierSequence: 1, durationMonths: 6, metricType: "PERCENT_REV", metricValue: 0.50 },
    { tierSequence: 2, durationMonths: 6, metricType: "PERCENT_REV", metricValue: 0.25 }
  ],
  clockStartDate: "2026-03-01T00:00:00.000Z",
  completedAt: "2026-03-20T00:00:00.000Z",
  parentAgentId: null,
  parentOverrideExpiresAt: null,
  parentOverrideRate: 0.10,
  serviceCategory: "CLEANING",
  normalizedAddress: "123 Main Street, Aspen Hill, MD 20906",
  addressHash: "optional precomputed hash",
  projectStatus: "COMPLETED",
  disputedFlag: false
}
```

## Output Shape
```js
{
  eligibility: "ELIGIBLE",
  monthsSinceClockStart: 0,
  selectedTier: { ...tier },
  recommendations: [
    {
      agent_id: "X-Jane123",
      master_project_id: "proj_123",
      transaction_type: "EARNING",
      amount: 10.00,
      status: "PENDING_REVIEW",
      metadata_json: { ... }
    }
  ]
}
```

## Notes
- Currency values are rounded to cents.
- `durationMonths: 0` is treated as open-ended.
- Reclaws are forced negative and marked `APPROVED` when created.
