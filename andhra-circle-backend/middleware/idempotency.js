/**
 * Optional Idempotency-Key support stored in MongoDB SecurityState (TTL)
 * Protects admin create and upload operations from duplicate requests.
 */

const SecurityState = require("../models/SecurityState");
const logger = require("../utils/logger");

const IDEMPOTENCY_TTL_SECONDS = 3600; // 1 hour TTL for stored idempotent responses

function idempotency() {
  return async (req, res, next) => {
    // Only applies to mutating methods
    if (!["POST", "PUT", "PATCH"].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey || typeof idempotencyKey !== "string" || !idempotencyKey.trim()) {
      return next(); // Optional: if key is omitted, proceed normally
    }

    const trimmedKey = idempotencyKey.trim().slice(0, 128);
    const dbKey = `idempotency:${req.originalUrl}:${trimmedKey}`;
    const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_SECONDS * 1000);

    try {
      // 1. Try to acquire lock / check previous record
      const existing = await SecurityState.findOne({ key: dbKey, type: "idempotency_key" }).lean();

      if (existing) {
        if (existing.status === "in_flight") {
          // Request is currently running
          return res.status(409).json({
            success: false,
            message: "A request with this Idempotency-Key is currently in progress",
          });
        }

        if (existing.status === "completed" && existing.response) {
          // Replay cached response
          logger.info("Idempotency key hit: returning cached response", {
            key: trimmedKey,
            route: req.originalUrl,
          });
          return res.status(existing.response.status || 200).json(existing.response.body);
        }
      }

      // 2. Mark as in_flight
      await SecurityState.findOneAndUpdate(
        { key: dbKey, type: "idempotency_key" },
        {
          $setOnInsert: {
            key: dbKey,
            type: "idempotency_key",
            status: "in_flight",
            createdAt: new Date(),
          },
          $set: { expiresAt },
        },
        { upsert: true, new: true }
      );

      // 3. Intercept res.json to cache response upon completion
      const originalJson = res.json.bind(res);
      res.json = function (body) {
        // Cache if successful (2xx or 4xx, but usually non-500)
        if (res.statusCode < 500) {
          SecurityState.updateOne(
            { key: dbKey, type: "idempotency_key" },
            {
              $set: {
                status: "completed",
                response: {
                  status: res.statusCode,
                  body,
                },
                expiresAt,
              },
            }
          ).catch((err) => {
            logger.warn("Failed to update idempotency cache", { error: err.message });
          });
        } else {
          // If 500, delete record so client can retry
          SecurityState.deleteOne({ key: dbKey, type: "idempotency_key" }).catch(() => {});
        }

        return originalJson(body);
      };

      next();
    } catch (err) {
      logger.warn("Idempotency middleware error, proceeding without cache", { error: err.message });
      next();
    }
  };
}

module.exports = idempotency;
