const crypto = require("crypto");
const logger = require("../utils/logger");

module.exports = function requestIdMiddleware(req, res, next) {
  // Respect incoming X-Request-ID or generate a clean random UUID
  const reqId = (typeof req.headers["x-request-id"] === "string" && req.headers["x-request-id"].trim())
    ? req.headers["x-request-id"].trim().slice(0, 64)
    : crypto.randomUUID();

  req.id = reqId;
  res.setHeader("X-Request-ID", reqId);

  const start = process.hrtime.bigint();

  // Log on finish
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number((end - start) / 1000000n);

    // Skip verbose noise for static uploads if desired or keep standard
    const route = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
    const status = res.statusCode;

    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

    logger[level]("HTTP request completed", {
      requestId: reqId,
      method: req.method,
      route,
      status,
      durationMs,
    });
  });

  next();
};

