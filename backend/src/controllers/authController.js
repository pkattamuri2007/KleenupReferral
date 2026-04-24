const jwt = require("jsonwebtoken");
const agentRepository = require("../repositories/agentRepository");

async function agentLogin(req, res) {
  const { agentId } = req.body;
  if (!agentId) {
    return res.status(400).json({ error: "agentId is required" });
  }

  const agent = await agentRepository.findById(agentId);
  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  const token = jwt.sign({ agentId: agent.agent_id }, process.env.AGENT_JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({ token, agentId: agent.agent_id, status: agent.status });
}

module.exports = { agentLogin };
