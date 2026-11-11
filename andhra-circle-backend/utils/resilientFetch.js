const logger = require("./logger");

class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.cooldownMs = options.cooldownMs || 30000;
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.nextAttempt = Date.now();
  }

  isOpen() {
    if (this.state === "OPEN") {
      if (Date.now() >= this.nextAttempt) {
        this.state = "HALF_OPEN";
        logger.info(`Circuit breaker [${this.name}] entered HALF_OPEN state`);
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess() {
    if (this.state === "HALF_OPEN" || this.failureCount > 0) {
      logger.info(`Circuit breaker [${this.name}] recovered to CLOSED`);
    }
    this.state = "CLOSED";
    this.failureCount = 0;
  }

  recordFailure(err) {
    this.failureCount++;
    logger.warn(`Circuit breaker [${this.name}] recorded failure #${this.failureCount}`, {
      error: err?.message || String(err),
    });

    if (this.failureCount >= this.failureThreshold || this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.cooldownMs;
      logger.error(`Circuit breaker [${this.name}] is now OPEN until ${new Date(this.nextAttempt).toISOString()}`);
    }
  }
}

const breakers = new Map();

function getBreaker(name, options) {
  if (!breakers.has(name)) {
    breakers.set(name, new CircuitBreaker(name, options));
  }
  return breakers.get(name);
}

/**
 * Resilient fetch with timeout, jittered exponential backoff, and circuit breaker.
 * Retries ONLY on network errors, 429, 502, 503.
 * Only retries idempotent requests (GET, HEAD, OPTIONS, PUT, DELETE) unless explicitly allowed.
 */
async function resilientFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const maxRetries = options.maxRetries ?? 3;
  const timeoutMs = options.timeoutMs ?? 15000;
  const breakerName = options.breakerName || new URL(url).hostname;
  const breaker = getBreaker(breakerName, options.breakerOptions);

  if (breaker.isOpen()) {
    const err = new Error(`Circuit breaker is OPEN for ${breakerName}`);
    err.isCircuitBreakerOpen = true;
    err.status = 503;
    throw err;
  }

  const isIdempotent = ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"].includes(method);
  const allowRetry = options.retryNonIdempotent || isIdempotent;

  let attempt = 0;
  let lastError = null;

  while (attempt <= (allowRetry ? maxRetries : 0)) {
    attempt++;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const fetchOptions = {
        ...options,
        signal: controller.signal,
      };

      const res = await fetch(url, fetchOptions);
      clearTimeout(timeout);

      // Status codes eligible for retry: 429, 502, 503
      if ([429, 502, 503].includes(res.status) && attempt <= maxRetries && allowRetry) {
        lastError = new Error(`HTTP ${res.status} from ${breakerName}`);
        lastError.status = res.status;
        breaker.recordFailure(lastError);

        // Exponential backoff with jitter
        const baseDelay = 300 * Math.pow(2, attempt - 1);
        const jitter = Math.floor(Math.random() * 200);
        await new Promise((r) => setTimeout(r, baseDelay + jitter));
        continue;
      }

      if (!res.ok && res.status >= 500) {
        breaker.recordFailure(new Error(`Server error HTTP ${res.status}`));
      } else {
        breaker.recordSuccess();
      }

      return res;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      breaker.recordFailure(err);

      if (!allowRetry || attempt > maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const baseDelay = 300 * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, baseDelay + jitter));
    }
  }

  throw lastError;
}

module.exports = {
  resilientFetch,
  getBreaker,
  CircuitBreaker,
};

