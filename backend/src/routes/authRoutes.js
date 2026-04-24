const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/portal/auth", authController.agentLogin);

module.exports = router;
