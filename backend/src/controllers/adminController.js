const adminService = require("../services/adminService");

async function getProspects(req, res) {
  try {
    res.json(await adminService.getProspects());
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function createProspect(req, res) {
  try {
    res.status(201).json(await adminService.createProspect(req.body));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function bulkUploadProspects(req, res) {
  try {
    const prospects = Array.isArray(req.body) ? req.body : req.body.prospects;
    if (!Array.isArray(prospects)) {
      return res.status(400).json({ error: "Body must be an array of prospects" });
    }
    res.json(await adminService.bulkUploadProspects(prospects));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function promoteProspect(req, res) {
  try {
    res.json(await adminService.promoteProspect(req.params.agentId));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function updateAgentStatus(req, res) {
  try {
    res.json(await adminService.updateAgentStatus(req.params.agentId, req.body.status));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function assignPolicy(req, res) {
  try {
    res.json(await adminService.assignPolicy(req.params.agentId, req.body.policyId));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function getPendingSettlements(req, res) {
  try {
    res.json(await adminService.getPendingSettlements());
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function reviewSettlement(req, res) {
  try {
    res.json(await adminService.reviewSettlement(req.params.ledgerId, req.body));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function createReclaw(req, res) {
  try {
    res.status(201).json(await adminService.createReclaw(req.body));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function getAgentLedger(req, res) {
  try {
    res.json(await adminService.getAgentLedger(req.params.agentId));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function getAgentHandoffs(req, res) {
  try {
    res.json(await adminService.getAgentHandoffs(req.params.agentId));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function getThreatRules(req, res) {
  try {
    res.json(await adminService.getThreatRules());
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function createThreatRule(req, res) {
  try {
    res.status(201).json(await adminService.createThreatRule(req.body));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function updateThreatRule(req, res) {
  try {
    res.json(await adminService.updateThreatRule(req.params.ruleId, req.body));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

module.exports = {
  getProspects, createProspect, bulkUploadProspects, promoteProspect,
  updateAgentStatus, assignPolicy,
  getPendingSettlements, reviewSettlement, createReclaw,
  getAgentLedger, getAgentHandoffs,
  getThreatRules, createThreatRule, updateThreatRule,
};
