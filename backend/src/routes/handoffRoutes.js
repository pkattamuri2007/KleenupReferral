const express = require("express");
const router = express.Router();
const handoffController = require("../controllers/handoffController");

router.post("/handoff", handoffController.createHandoff);
router.post("/landing-visit", handoffController.logLandingVisit);
router.get("/public/agents/:agentId", handoffController.getPublicAgentProfile);

module.exports = router;