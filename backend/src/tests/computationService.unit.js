// Comprehensive unit tests for computationService
// Tests edge cases, boundaries, and error conditions

const {
  isProjectEligible,
  selectActivePolicyTier,
  computeTierPayoutAmount,
  isParentOverrideActive,
  buildSettlementRecommendations,
  createReclawAdjustment,
  computeNetPayable,
} = require("../services/computationService");

const { diffFullMonths, roundCurrency } = require("../utils/formatters");

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${err.message}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}. ${message}`);
  }
}

function assertTrue(value, message) {
  if (!value) throw new Error(message);
}

function assertFalse(value, message) {
  if (value) throw new Error(message);
}

console.log("\n========================================");
console.log("COMPUTATION SERVICE UNIT TESTS");
console.log("========================================\n");

// ---- Eligibility Tests ----
console.log("Eligibility Tests:");
test("Eligible: COMPLETED + not disputed", () => {
  const result = isProjectEligible({ projectStatus: "COMPLETED", disputedFlag: false });
  assertTrue(result, "Should be eligible");
});

test("Not eligible: COMPLETED but disputed", () => {
  const result = isProjectEligible({ projectStatus: "COMPLETED", disputedFlag: true });
  assertFalse(result, "Should NOT be eligible when disputed");
});

test("Not eligible: Not COMPLETED", () => {
  const result = isProjectEligible({ projectStatus: "PENDING", disputedFlag: false });
  assertFalse(result, "Should NOT be eligible when not COMPLETED");
});

test("Not eligible: COMPLETED but null disputed flag", () => {
  const result = isProjectEligible({ projectStatus: "COMPLETED", disputedFlag: null });
  assertFalse(result, "Should NOT be eligible with null disputed flag");
});

// ---- Tier Selection Tests ----
console.log("\nTier Selection Tests:");
test("Select Tier 1: 0 months elapsed", () => {
  const tiers = [
    { tierSequence: 1, durationMonths: 6, metricValue: 0.50 },
    { tierSequence: 2, durationMonths: 6, metricValue: 0.25 },
  ];
  const start = new Date("2026-03-01");
  const end = new Date("2026-03-15"); // 0 full months
  const result = selectActivePolicyTier({
    policyTiers: tiers,
    clockStartDate: start,
    completedAt: end,
  });
  assertEqual(result.activeTier.tierSequence, 1, "Should select Tier 1");
  assertEqual(result.monthsSinceClockStart, 0, "Months should be 0");
});

test("Select Tier 2: 6 months elapsed", () => {
  const tiers = [
    { tierSequence: 1, durationMonths: 6, metricValue: 0.50 },
    { tierSequence: 2, durationMonths: 6, metricValue: 0.25 },
  ];
  const start = new Date("2026-03-01");
  const end = new Date("2026-09-01"); // 6 full months
  const result = selectActivePolicyTier({
    policyTiers: tiers,
    clockStartDate: start,
    completedAt: end,
  });
  assertEqual(result.activeTier.tierSequence, 2, "Should select Tier 2");
});

test("Select Tier 3 (open-ended): 12+ months elapsed", () => {
  const tiers = [
    { tierSequence: 1, durationMonths: 6, metricValue: 0.50 },
    { tierSequence: 2, durationMonths: 6, metricValue: 0.25 },
    { tierSequence: 3, durationMonths: 0, metricValue: 0.10 }, // open-ended
  ];
  const start = new Date("2026-03-01");
  const end = new Date("2027-03-01"); // 12 full months
  const result = selectActivePolicyTier({
    policyTiers: tiers,
    clockStartDate: start,
    completedAt: end,
  });
  assertEqual(result.activeTier.tierSequence, 3, "Should select open-ended Tier 3");
});

test("No active tier: empty tiers array", () => {
  const result = selectActivePolicyTier({
    policyTiers: [],
    clockStartDate: new Date(),
    completedAt: new Date(),
  });
  assertEqual(result.activeTier, null, "Should return null tier");
});

// ---- Payout Calculation Tests ----
console.log("\nPayout Calculation Tests:");
test("PERCENT_REV: 50% of $200 = $100", () => {
  const result = computeTierPayoutAmount({
    metricType: "PERCENT_REV",
    metricValue: 0.50,
    grossFeeAmount: 200.00,
  });
  assertEqual(result, 100.00, "Should calculate 50% correctly");
});

test("PERCENT_REV: 25% of $200 = $50", () => {
  const result = computeTierPayoutAmount({
    metricType: "PERCENT_REV",
    metricValue: 0.25,
    grossFeeAmount: 200.00,
  });
  assertEqual(result, 50.00, "Should calculate 25% correctly");
});

test("FIXED_USD: flat $25 payout", () => {
  const result = computeTierPayoutAmount({
    metricType: "FIXED_USD",
    metricValue: 25.00,
    grossFeeAmount: 200.00, // irrelevant for FIXED_USD
  });
  assertEqual(result, 25.00, "Should return fixed amount");
});

test("Unsupported metric type throws error", () => {
  try {
    computeTierPayoutAmount({
      metricType: "UNKNOWN",
      metricValue: 0.50,
      grossFeeAmount: 100,
    });
    throw new Error("Should have thrown error");
  } catch (err) {
    assertTrue(err.message.includes("Unsupported"), "Should throw unsupported metric error");
  }
});

test("Zero gross fee = zero payout", () => {
  const result = computeTierPayoutAmount({
    metricType: "PERCENT_REV",
    metricValue: 0.50,
    grossFeeAmount: 0,
  });
  assertEqual(result, 0, "Should return 0");
});

// ---- Currency Rounding Tests ----
console.log("\nCurrency Rounding Tests:");
test("Round $10.015 to cents", () => {
  const result = roundCurrency(10.015);
  assertEqual(result, 10.02, "Should round to nearest cent");
});

test("Round $10.014 to cents", () => {
  const result = roundCurrency(10.014);
  assertEqual(result, 10.01, "Should round down");
});

test("Round $0.005 to cents", () => {
  const result = roundCurrency(0.005);
  assertEqual(result, 0.01, "Should round small amounts correctly");
});

test("Round $100 stays $100.00", () => {
  const result = roundCurrency(100);
  assertEqual(result, 100.00, "Should work with whole dollars");
});

// ---- Parent Override Tests ----
console.log("\nParent Override Tests:");
test("Parent override active: parent exists, expiry in future", () => {
  const result = isParentOverrideActive({
    parentAgentId: "X-Bob456",
    parentOverrideExpiresAt: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000), // 100 days from now
    completedAt: new Date(),
  });
  assertTrue(result, "Should be active");
});

test("Parent override inactive: parent null", () => {
  const result = isParentOverrideActive({
    parentAgentId: null,
    parentOverrideExpiresAt: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
    completedAt: new Date(),
  });
  assertFalse(result, "Should not be active");
});

test("Parent override inactive: expired", () => {
  const result = isParentOverrideActive({
    parentAgentId: "X-Bob456",
    parentOverrideExpiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    completedAt: new Date(),
  });
  assertFalse(result, "Should not be active when expired");
});

test("Parent override active: no expiry date (unlimited)", () => {
  const result = isParentOverrideActive({
    parentAgentId: "X-Bob456",
    parentOverrideExpiresAt: null,
    completedAt: new Date(),
  });
  assertTrue(result, "Should be active indefinitely");
});

// ---- Reclaw Tests ----
console.log("\nReclaw Tests:");
test("Reclaw forces amount negative", () => {
  const result = createReclawAdjustment({
    agentId: "X-Jane123",
    amount: 50.00, // positive input
    reasonCode: "DUPLICATE",
    adminId: "ADMIN_001",
  });
  assertEqual(result.amount, -50.00, "Should force negative");
  assertEqual(result.transaction_type, "RECLAW", "Should be RECLAW type");
  assertEqual(result.status, "APPROVED", "Should be immediately APPROVED");
});

test("Reclaw with zero amount throws error", () => {
  try {
    createReclawAdjustment({
      agentId: "X-Jane123",
      amount: 0,
      reasonCode: "DUPLICATE",
      adminId: "ADMIN_001",
    });
    throw new Error("Should have thrown error");
  } catch (err) {
    assertTrue(err.message.includes("non-zero"), "Should reject zero amount");
  }
});

test("Reclaw missing reason code throws error", () => {
  try {
    createReclawAdjustment({
      agentId: "X-Jane123",
      amount: 50.00,
      reasonCode: null, // missing
      adminId: "ADMIN_001",
    });
    throw new Error("Should have thrown error");
  } catch (err) {
    assertTrue(err.message.includes("required"), "Should require reason code");
  }
});

// ---- Net Payable Tests ----
console.log("\nNet Payable Tests:");
test("Sum only APPROVED entries", () => {
  const entries = [
    { status: "APPROVED", amount: 100.00 },
    { status: "APPROVED", amount: 50.00 },
    { status: "PENDING_REVIEW", amount: 25.00 }, // should NOT count
    { status: "REJECTED", amount: 10.00 }, // should NOT count
  ];
  const result = computeNetPayable(entries);
  assertEqual(result, 150.00, "Should sum only APPROVED");
});

test("Include negative APPROVED amounts (reclaws)", () => {
  const entries = [
    { status: "APPROVED", amount: 100.00 },
    { status: "APPROVED", amount: -30.00 }, // reclaw
  ];
  const result = computeNetPayable(entries);
  assertEqual(result, 70.00, "Should include negative amounts");
});

test("Empty ledger returns zero", () => {
  const result = computeNetPayable([]);
  assertEqual(result, 0, "Should return 0 for empty ledger");
});

test("All non-approved entries returns zero", () => {
  const entries = [
    { status: "PENDING_REVIEW", amount: 100.00 },
    { status: "ON_HOLD", amount: 50.00 },
  ];
  const result = computeNetPayable(entries);
  assertEqual(result, 0, "Should return 0 when nothing approved");
});

// ---- Integration Tests ----
console.log("\nIntegration Tests:");
test("Full flow: eligible project, tier 1, parent override", () => {
  const result = buildSettlementRecommendations({
    masterProjectId: "proj_001",
    agentId: "X-Jane123",
    grossFeeAmount: 100.00,
    policyTiers: [
      { tierSequence: 1, durationMonths: 6, metricType: "PERCENT_REV", metricValue: 0.50 },
    ],
    clockStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    parentAgentId: "X-Bob456",
    parentOverrideExpiresAt: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
    parentOverrideRate: 0.15,
    serviceCategory: "CLEANING",
    normalizedAddress: "123 Main St",
    addressHash: "abc123",
    projectStatus: "COMPLETED",
    disputedFlag: false,
  });

  assertTrue(result.recommendations.length === 2, "Should have 2 recommendations");
  assertEqual(result.recommendations[0].amount, 50.00, "Agent earning should be $50");
  assertEqual(result.recommendations[1].amount, 15.00, "Parent override should be $15");
  assertEqual(result.eligibility, "ELIGIBLE", "Should be eligible");
});

test("Full flow: ineligible project (disputed) returns no recommendations", () => {
  const result = buildSettlementRecommendations({
    masterProjectId: "proj_002",
    agentId: "X-Jane123",
    grossFeeAmount: 100.00,
    policyTiers: [
      { tierSequence: 1, durationMonths: 6, metricType: "PERCENT_REV", metricValue: 0.50 },
    ],
    clockStartDate: new Date(),
    completedAt: new Date(),
    parentAgentId: null,
    parentOverrideExpiresAt: null,
    parentOverrideRate: 0,
    serviceCategory: "CLEANING",
    normalizedAddress: "456 Oak St",
    addressHash: "def456",
    projectStatus: "COMPLETED",
    disputedFlag: true, // DISPUTED - should reject
  });

  assertEqual(result.recommendations.length, 0, "Should have 0 recommendations");
  assertEqual(result.eligibility, "NOT_ELIGIBLE", "Should be not eligible");
});

// ---- Test Summary ----
console.log("\n\n========================================");
console.log("TEST RESULTS");
console.log("========================================");
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total:  ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log("\n✓ All tests passed!");
} else {
  console.log(`\n✗ ${testsFailed} test(s) failed`);
  process.exit(1);
}
console.log("========================================\n");
