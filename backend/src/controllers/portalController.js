const portalService = require("../services/portalService");

async function getMe(req, res) {
  try {
    res.json(await portalService.getMe(req.agentId));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function getLinks(req, res) {
  try {
    res.json(await portalService.getLinks(req.agentId));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function getVisits(req, res) {
  try {
    res.json(await portalService.getVisits(req.agentId));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function getHandoffs(req, res) {
  try {
    res.json(await portalService.getHandoffs(req.agentId));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function getLedger(req, res) {
  try {
    res.json(await portalService.getLedger(req.agentId));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function getNetPayable(req, res) {
  try {
    res.json(await portalService.getNetPayable(req.agentId));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function getRecruits(req, res) {
  try {
    res.json(await portalService.getRecruits(req.agentId));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

module.exports = { getMe, getLinks, getVisits, getHandoffs, getLedger, getNetPayable, getRecruits };
