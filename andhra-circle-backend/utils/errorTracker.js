/**
 * Optional error tracking helper (e.g. Sentry)
 * Enabled only when SENTRY_DSN is configured. Off by default.
 * Always scrubs sensitive keys and headers before capturing.
 */

const logger = require("./logger");

const SENTRY_DSN = process.env.SENTRY_DSN;
let isInitialized = false;

function initErrorTracker(app) {
  if (!SENTRY_DSN) {
    logger.info("Error tracking (Sentry) disabled: SENTRY_DSN not set");
    return;
  }

  try {
    // If sentry is installed as an optional module
    const Sentry = require("@sentry/node");
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      beforeSend(event) {
        // Scrub sensitive headers & breadcrumbs
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        if (event.request?.data) {
          event.request.data = "[Scrubbed]";
        }
        return event;
      },
    });
    isInitialized = true;
    logger.info("Error tracking (Sentry) initialized successfully");
  } catch (err) {
    logger.warn("Sentry requested via SENTRY_DSN but @sentry/node is not installed or failed to init");
  }
}

function captureException(error, context = {}) {
  if (!isInitialized) return;
  try {
    const Sentry = require("@sentry/node");
    Sentry.withScope((scope) => {
      if (context.requestId) scope.setTag("requestId", context.requestId);
      if (context.route) scope.setTag("route", context.route);
      Sentry.captureException(error);
    });
  } catch {
    // Fail closed without crashing
  }
}

module.exports = {
  initErrorTracker,
  captureException,
};

