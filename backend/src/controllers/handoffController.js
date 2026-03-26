const handoffService = require("../services/handoffService");

async function createHandoff(req, res) {
  try {
    const result = await handoffService.createHandoff(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Failed to create handoff" });
  }
}

async function logLandingVisit(req, res) {
  try {
    const result = await handoffService.logLandingVisit(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Failed to log landing visit" });
  }
}

async function getPublicAgentProfile(req, res) {
  try {
    const result = await handoffService.getPublicAgentProfile(req.params.agentId);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Failed to fetch agent profile" });
  }
}

module.exports = { createHandoff, logLandingVisit, getPublicAgentProfile };
