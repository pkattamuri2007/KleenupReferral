const policyService = require("../services/policyService");

async function getPolicies(req, res) {
  try {
    res.json(await policyService.getPolicies());
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function createPolicy(req, res) {
  try {
    res.status(201).json(await policyService.createPolicy(req.body));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function getPolicyById(req, res) {
  try {
    res.json(await policyService.getPolicyById(req.params.policyId));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function addPolicyTier(req, res) {
  try {
    res.status(201).json(await policyService.addPolicyTier(req.params.policyId, req.body));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function computeProject(req, res) {
  try {
    res.json(await policyService.computeProject(req.params.masterProjectId));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function computePending(req, res) {
  try {
    res.json(await policyService.computePending());
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

module.exports = { getPolicies, createPolicy, getPolicyById, addPolicyTier, computeProject, computePending };
