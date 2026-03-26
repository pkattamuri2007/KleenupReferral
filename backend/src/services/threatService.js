const threatRepository = require("../repositories/threatRepository");

async function categorizeThreat(ip) {
  if (!ip) return "CLEAN";

  const match = await threatRepository.matchIp(ip);
  if (!match) return "CLEAN";

  return match.category; // 'GREY' or 'BLACK'
}

module.exports = { categorizeThreat };
