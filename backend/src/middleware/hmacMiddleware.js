const crypto = require("crypto");

// Accepts either HMAC-SHA256 signature (X-Signature header) or Bearer token fallback.
function verifyInternalRequest(req, res, next) {
  const signature = req.headers["x-signature"];

  if (signature) {
    const secret = process.env.HMAC_SHARED_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "HMAC secret not configured" });
    }

    const body = JSON.stringify(req.body);
    const expected = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );

    if (!valid) {
      return res.status(401).json({ error: "Invalid HMAC signature" });
    }

    return next();
  }

  // Fallback: static Bearer token
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token || token !== process.env.INTERNAL_API_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

module.exports = { verifyInternalRequest };
