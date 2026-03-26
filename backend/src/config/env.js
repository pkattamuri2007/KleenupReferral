module.exports = {
  port: process.env.PORT || 4000,
  wpBaseUrl: process.env.WP_BASE_URL,
  wpUsername: process.env.WP_USERNAME,
  wpAppPassword: process.env.WP_APP_PASSWORD,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'KleenUpReferral',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  }
};