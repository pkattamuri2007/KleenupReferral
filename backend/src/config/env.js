module.exports = {
  port: process.env.PORT || 4000,
  wpBaseUrl: process.env.WP_BASE_URL,
  wpUsername: process.env.WP_USERNAME,
  wpAppPassword: process.env.WP_APP_PASSWORD,
  databaseUrl: process.env.DATABASE_URL,
  hmacSharedSecret: process.env.HMAC_SHARED_SECRET,
  internalApiToken: process.env.INTERNAL_API_TOKEN,
  agentJwtSecret: process.env.AGENT_JWT_SECRET,
  adminApiToken: process.env.ADMIN_API_TOKEN,
};