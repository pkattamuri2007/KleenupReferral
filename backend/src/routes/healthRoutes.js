const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true });
});

router.get("/version", (req, res) => {
  res.json({ service: "kleenuplink", version: "1.0.0" });
});

module.exports = router;