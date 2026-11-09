const crypto = require("crypto");

// Avoid ambiguous characters (0 vs O, 1 vs I vs l)
const CHAR_SET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CAPTCHA_LENGTH = 6;
const CAPTCHA_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory replay prevention (nonces)
const usedNonces = new Set();

function getSecret() {
  return process.env.JWT_SECRET || "andhra_circle_secure_captcha_fallback_secret_key";
}

/**
 * Generate a random 6-character string from unambiguous charset
 */
function getRandomText(length = CAPTCHA_LENGTH) {
  let result = "";
  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, CHAR_SET.length);
    result += CHAR_SET[idx];
  }
  return result;
}

/**
 * Build an SVG with noise lines, dots, distortion, and high contrast characters
 */
function buildCaptchaSvg(text) {
  const width = 210;
  const height = 54;
  const colors = ["#ffb95f", "#a0d1b8", "#fcd34d", "#6ee7b7", "#93c5fd", "#f472b6"];

  // Random noise lines (bezier curves)
  const lines = [];
  for (let i = 0; i < 4; i++) {
    const x1 = crypto.randomInt(5, 40);
    const y1 = crypto.randomInt(10, 45);
    const cx1 = crypto.randomInt(50, 110);
    const cy1 = crypto.randomInt(5, 50);
    const cx2 = crypto.randomInt(120, 170);
    const cy2 = crypto.randomInt(5, 50);
    const x2 = crypto.randomInt(175, 205);
    const y2 = crypto.randomInt(10, 45);
    const strokeColor = colors[i % colors.length];
    const strokeWidth = (1.5 + Math.random() * 1).toFixed(1);
    lines.push(
      `<path d="M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none" opacity="0.4" />`
    );
  }

  // Noise dots
  const dots = [];
  for (let i = 0; i < 28; i++) {
    const cx = crypto.randomInt(5, width - 5);
    const cy = crypto.randomInt(5, height - 5);
    const r = (0.8 + Math.random() * 1.2).toFixed(1);
    const dotColor = colors[i % colors.length];
    dots.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${dotColor}" opacity="0.3" />`
    );
  }

  // Character elements with individual rotations and offsets
  const charElements = [];
  const charSpacing = (width - 40) / text.length;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const x = Math.round(24 + i * charSpacing + (Math.random() * 6 - 3));
    const y = Math.round(36 + (Math.random() * 6 - 3));
    const rot = Math.round(Math.random() * 32 - 16); // -16 deg to +16 deg
    const color = colors[(i + crypto.randomInt(0, 2)) % colors.length];

    charElements.push(
      `<text x="${x}" y="${y}" font-family="Consolas, 'Courier New', monospace" font-size="28" font-weight="800" fill="${color}" transform="rotate(${rot}, ${x}, ${y})" text-anchor="middle">${char}</text>`
    );
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background: #081813; border-radius: 10px; border: 1px solid rgba(160, 209, 184, 0.25); user-select: none;">
      <defs>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      ${lines.join("\n      ")}
      ${dots.join("\n      ")}
      ${charElements.join("\n      ")}
    </svg>
  `.trim();
}

/**
 * Creates a new CAPTCHA challenge with signed token
 */
function createCaptcha() {
  const text = getRandomText();
  const svg = buildCaptchaSvg(text);

  const nonce = crypto.randomBytes(12).toString("hex");
  const exp = Date.now() + CAPTCHA_TTL_MS;

  const payload = JSON.stringify({
    text: text.toLowerCase(),
    exp,
    nonce,
  });

  const secret = getSecret();
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const captchaToken = Buffer.from(JSON.stringify({ p: payload, s: sig })).toString("base64");

  return {
    captchaToken,
    captchaSvg: svg,
  };
}

/**
 * Verifies user input against the signed CAPTCHA token
 */
function verifyCaptcha(captchaToken, userInput) {
  if (typeof captchaToken !== "string" || !captchaToken.trim()) {
    return { ok: false, message: "Security CAPTCHA verification token is missing." };
  }

  if (typeof userInput !== "string" || !userInput.trim()) {
    return { ok: false, message: "Please enter the security CAPTCHA verification code." };
  }

  try {
    const raw = Buffer.from(captchaToken.trim(), "base64").toString("utf8");
    const { p, s } = JSON.parse(raw);

    if (!p || !s) {
      return { ok: false, message: "Malformed security CAPTCHA token." };
    }

    const secret = getSecret();
    const expectedSig = crypto.createHmac("sha256", secret).update(p).digest("hex");

    // Constant-time signature verification
    const sigBuf = Buffer.from(s, "hex");
    const expectedBuf = Buffer.from(expectedSig, "hex");
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return { ok: false, message: "Invalid security CAPTCHA signature. Please reload." };
    }

    const payload = JSON.parse(p);

    if (Date.now() > payload.exp) {
      return { ok: false, message: "Security CAPTCHA code has expired. Please refresh for a new code." };
    }

    if (usedNonces.has(payload.nonce)) {
      return { ok: false, message: "Security CAPTCHA code has already been used. Please refresh." };
    }

    const normalizedInput = userInput.trim().toLowerCase().replace(/[\s-_]+/g, "");
    if (normalizedInput !== payload.text) {
      return { ok: false, message: "Incorrect security CAPTCHA code. Please check the image and try again." };
    }

    // Invalidate nonce to prevent replay
    usedNonces.add(payload.nonce);
    setTimeout(() => {
      usedNonces.delete(payload.nonce);
    }, CAPTCHA_TTL_MS + 60000);

    // Safeguard cache growth
    if (usedNonces.size > 10000) {
      usedNonces.clear();
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, message: "Security CAPTCHA verification failed. Please try again." };
  }
}

module.exports = {
  createCaptcha,
  verifyCaptcha,
};

