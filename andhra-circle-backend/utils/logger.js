const crypto = require("crypto");

const LEVEL_WEIGHT = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const MIN_LEVEL = process.env.LOG_LEVEL && LEVEL_WEIGHT[process.env.LOG_LEVEL.toLowerCase()]
  ? process.env.LOG_LEVEL.toLowerCase()
  : (process.env.NODE_ENV === "production" ? "info" : "debug");

function formatLine(level, message, meta = {}) {
  const line = {
    level,
    time: new Date().toISOString(),
    message: typeof message === "string" ? message : (message?.message || String(message)),
  };

  // Attach metadata safely, ensuring no sensitive keys are serialized
  for (const [key, val] of Object.entries(meta)) {
    if (val === undefined || val === null) continue;
    // Scrub sensitive keys if they accidentally appear
    const k = key.toLowerCase();
    if (
      k.includes("password") ||
      k.includes("token") ||
      k.includes("secret") ||
      k.includes("email") ||
      k.includes("body") ||
      k.includes("question") ||
      k.includes("auth")
    ) {
      continue;
    }
    line[key] = val;
  }

  return JSON.stringify(line);
}

function write(level, message, meta) {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[MIN_LEVEL]) return;
  const line = formatLine(level, message, meta);
  if (level === "error") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

const logger = {
  debug: (msg, meta) => write("debug", msg, meta),
  info: (msg, meta) => write("info", msg, meta),
  warn: (msg, meta) => write("warn", msg, meta),
  error: (msg, meta) => write("error", msg, meta),
};

module.exports = logger;

