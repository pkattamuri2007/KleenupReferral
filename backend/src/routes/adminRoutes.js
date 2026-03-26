const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { requireAdminAuth } = require("../middleware/authMiddleware");

router.get("/admin/prospects", requireAdminAuth, adminController.getProspects);
router.post("/admin/prospects", requireAdminAuth, adminController.createProspect);
router.post("/admin/prospects/bulk-upload", requireAdminAuth, adminController.bulkUploadProspects);
router.patch("/admin/prospects/:agentId/promote", requireAdminAuth, adminController.promoteProspect);

router.patch("/admin/agents/:agentId/status", requireAdminAuth, adminController.updateAgentStatus);
router.patch("/admin/agents/:agentId/policy", requireAdminAuth, adminController.assignPolicy);

router.get("/admin/settlements/pending", requireAdminAuth, adminController.getPendingSettlements);
router.patch("/admin/settlements/:ledgerId/review", requireAdminAuth, adminController.reviewSettlement);

router.post("/admin/ledger/reclaw", requireAdminAuth, adminController.createReclaw);
router.get("/admin/agents/:agentId/ledger", requireAdminAuth, adminController.getAgentLedger);
router.get("/admin/agents/:agentId/handoffs", requireAdminAuth, adminController.getAgentHandoffs);

router.get("/admin/threat/ip-rules", requireAdminAuth, adminController.getThreatRules);
router.post("/admin/threat/ip-rules", requireAdminAuth, adminController.createThreatRule);
router.patch("/admin/threat/ip-rules/:ruleId", requireAdminAuth, adminController.updateThreatRule);

module.exports = router;