/**
 * Cloudflare Turnstile Verification Service
 * Handles server-side validation of Cloudflare Turnstile tokens.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const https = require("https");

/**
 * Verify Cloudflare Turnstile token with Cloudflare API
 * @param {string} turnstileToken The cf-turnstile-response token submitted by user
 * @param {string} remoteIp Optional client IP address
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
async function verifyTurnstileToken(turnstileToken, remoteIp) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET;

  if (!secretKey) {
    // If not configured in development, provide clear feedback
    if (process.env.NODE_ENV !== "production") {
      console.warn("[WARN] TURNSTILE_SECRET_KEY is not set in backend environment.");
      return { ok: false, message: "Cloudflare Turnstile secret key is not configured in backend." };
    }
    return { ok: false, message: "Security verification service is unavailable." };
  }

  if (!turnstileToken || typeof turnstileToken !== "string") {
    return { ok: false, message: "Please complete the Cloudflare security verification challenge." };
  }

  return new Promise((resolve) => {
    const postData = new URLSearchParams({
      secret: secretKey.trim(),
      response: turnstileToken.trim(),
      ...(remoteIp ? { remoteip: remoteIp } : {}),
    }).toString();

    const options = {
      hostname: "challenges.cloudflare.com",
      port: 443,
      path: "/turnstile/v0/siteverify",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
      timeout: 5000,
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const outcome = JSON.parse(body);
          if (outcome.success) {
            resolve({ ok: true });
          } else {
            console.warn("[Cloudflare Turnstile] Verification failed:", outcome["error-codes"]);
            resolve({
              ok: false,
              message: "Cloudflare security verification failed or expired. Please verify again.",
              errorCodes: outcome["error-codes"],
            });
          }
        } catch (err) {
          console.error("[Cloudflare Turnstile] Failed to parse response:", err);
          resolve({ ok: false, message: "Security verification check encountered an error." });
        }
      });
    });

    req.on("error", (err) => {
      console.error("[Cloudflare Turnstile] HTTP Request Error:", err);
      resolve({ ok: false, message: "Could not reach Cloudflare verification service." });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, message: "Cloudflare verification timed out." });
    });

    req.write(postData);
    req.end();
  });
}

module.exports = {
  verifyTurnstileToken,
};

