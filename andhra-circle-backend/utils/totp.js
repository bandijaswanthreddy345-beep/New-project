/**
 * Minimal zero-dependency RFC 6238 TOTP (Time-Based One-Time Password) implementation
 * Compatible with Google Authenticator, Microsoft Authenticator, and standard 2FA apps.
 */

const crypto = require("crypto");

// Base32 alphabet for TOTP secrets
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function generateBase32Secret(length = 20) {
  const randomBytes = crypto.randomBytes(length);
  let secret = "";
  for (let i = 0; i < randomBytes.length; i++) {
    secret += BASE32_CHARS[randomBytes[i] % BASE32_CHARS.length];
  }
  return secret;
}

function base32ToBuffer(str) {
  const cleanStr = str.toUpperCase().replace(/=+$/, "");
  let bits = "";
  for (let i = 0; i < cleanStr.length; i++) {
    const val = BASE32_CHARS.indexOf(cleanStr[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTOTP(secret, timeStep = 30, digits = 6, forTime = Date.now()) {
  const counter = Math.floor(forTime / 1000 / timeStep);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigInt64BE(BigInt(counter), 0);

  const key = base32ToBuffer(secret);
  const hmac = crypto.createHmac("sha1", key).update(counterBuf).digest();

  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % Math.pow(10, digits)).toString().padStart(digits, "0");
}

function verifyTOTP(token, secret, window = 1) {
  if (!token || !secret) return false;
  const cleanToken = String(token).trim();
  const now = Date.now();

  for (let i = -window; i <= window; i++) {
    const checkTime = now + i * 30 * 1000;
    if (generateTOTP(secret, 30, 6, checkTime) === cleanToken) {
      return true;
    }
  }
  return false;
}

function generateRecoveryCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

module.exports = {
  generateBase32Secret,
  generateTOTP,
  verifyTOTP,
  generateRecoveryCodes,
};

