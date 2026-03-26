const webhookService = require("../services/webhookService");

async function autoEnrollAgent(req, res) {
  try {
    const result = await webhookService.autoEnrollAgent(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Failed to auto-enroll agent" });
  }
}

async function projectUpsert(req, res) {
  try {
    const result = await webhookService.projectUpsert(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Failed to upsert project" });
  }
}

async function projectCompleted(req, res) {
  try {
    const result = await webhookService.projectCompleted(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Failed to mark project completed" });
  }
}

async function disputeCleared(req, res) {
  try {
    const result = await webhookService.disputeCleared(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Failed to process dispute-cleared" });
  }
}

module.exports = { autoEnrollAgent, projectUpsert, projectCompleted, disputeCleared };
