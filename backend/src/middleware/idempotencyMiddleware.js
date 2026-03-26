// In-memory store for dev. Replace with Redis/DB for production.
const responseCache = new Map();

function ensureIdempotent(req, res, next) {
  const key = req.headers["idempotency-key"] || req.body?.idempotencyKey;

  if (!key) {
    return next();
  }

  if (responseCache.has(key)) {
    const cached = responseCache.get(key);
    return res.status(cached.status).json(cached.body);
  }

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    responseCache.set(key, { status: res.statusCode, body });
    return originalJson(body);
  };

  next();
}

module.exports = { ensureIdempotent };
