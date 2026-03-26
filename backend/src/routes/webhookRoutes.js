const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

router.post("/webhooks/app/auto-enroll", webhookController.autoEnrollAgent);
router.post("/webhooks/app/project-upsert", webhookController.projectUpsert);
router.post("/webhooks/app/project-completed", webhookController.projectCompleted);
router.post("/webhooks/app/dispute-cleared", webhookController.disputeCleared);

module.exports = router;