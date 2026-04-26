const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ ok: true, db: "connected" });
  } catch (err) {
    res.status(503).json({ ok: false, db: "unreachable", error: err.message });
  }
});

router.get("/version", (req, res) => {
  res.json({ service: "kleenuplink", version: "1.0.0" });
});

module.exports = router;