// Lightweight in-memory rate limiter to prevent spam and denial of service
const requestCounts = new Map();

export function rateLimiter({ windowMs = 15 * 60 * 1000, max = 150, message = "Too many requests. Please try again later." } = {}) {
  // Cleanup stale windows periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
      if (now - record.startTime > windowMs) {
        requestCounts.delete(key);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();

    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, { count: 1, startTime: now });
      return next();
    }

    const record = requestCounts.get(ip);

    if (now - record.startTime > windowMs) {
      record.count = 1;
      record.startTime = now;
      return next();
    }

    record.count++;

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        message
      });
    }

    next();
  };
}
