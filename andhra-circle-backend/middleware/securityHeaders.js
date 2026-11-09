// ==========================================
// Basic security headers (dependency-free subset of what helmet sets)
//
// Deliberately NOT set, because the frontend runs on a different origin and
// embeds PDFs / images from this server:
//   - X-Frame-Options / frame-ancestors  (would break the PDF iframes)
//   - Cross-Origin-Resource-Policy       (would break cross-origin images)
// ==========================================

function securityHeaders(req, res, next) {
  // Stop browsers from guessing file types (blocks "upload .html as .pdf" tricks)
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  next();
}

module.exports = securityHeaders;
