const express = require("express");
const router = express.Router();
const policyController = require("../controllers/policyController");

router.get("/policies", policyController.getPolicies);
router.post("/policies", policyController.createPolicy);
router.get("/policies/:policyId", policyController.getPolicyById);
router.post("/policies/:policyId/tiers", policyController.addPolicyTier);

router.post("/compute/run-project/:masterProjectId", policyController.computeProject);
router.post("/compute/run-pending", policyController.computePending);

module.exports = router;