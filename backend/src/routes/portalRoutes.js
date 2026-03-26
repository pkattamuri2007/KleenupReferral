const express = require("express");
const router = express.Router();
const portalController = require("../controllers/portalController");
const { requireAgentAuth } = require("../middleware/authMiddleware");

router.get("/portal/me", requireAgentAuth, portalController.getMe);
router.get("/portal/me/links", requireAgentAuth, portalController.getLinks);
router.get("/portal/me/visits", requireAgentAuth, portalController.getVisits);
router.get("/portal/me/handoffs", requireAgentAuth, portalController.getHandoffs);
router.get("/portal/me/ledger", requireAgentAuth, portalController.getLedger);
router.get("/portal/me/net-payable", requireAgentAuth, portalController.getNetPayable);
router.get("/portal/me/recruits", requireAgentAuth, portalController.getRecruits);

module.exports = router;