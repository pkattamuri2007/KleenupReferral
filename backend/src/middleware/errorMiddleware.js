// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
