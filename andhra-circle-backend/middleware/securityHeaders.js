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

  // Strict-Transport-Security in production only (at least 15552000s = 180 days)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=15552000; includeSubDomains"
    );
  }

  // Allow frontend origins (Vite dev server, localhost, and deployed domains)
  // to embed PDFs, preview frames, and proxy documents in iframes.
  const allowedFrameAncestors = [
    "'self'",
    "http://localhost:*",
    "http://127.0.0.1:*",
    "https://*.andhracircle.in",
    "https://*.vercel.app",
    "*"
  ].join(" ");

  // Dedicated endpoints for PDF streaming and uploads need permissive frame-ancestors
  if (req.path === "/api/notifications/proxy-pdf" || req.path.startsWith("/uploads")) {
    res.setHeader("Content-Security-Policy", "frame-ancestors *");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  } else if (req.path.startsWith("/api")) {
    res.setHeader(
      "Content-Security-Policy",
      `default-src 'none'; frame-ancestors ${allowedFrameAncestors}`
    );
  } else if (req.path === "/") {
    res.setHeader(
      "Content-Security-Policy",
      `frame-ancestors ${allowedFrameAncestors}`
    );
  }

  next();
}

module.exports = securityHeaders;
