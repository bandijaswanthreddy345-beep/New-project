# Cloudflare Security Readiness & Infrastructure Audit

**Project:** Andhra Circle / JNTU Circle Academic Resource Platform  
**Target Architecture:**
- **Frontend:** Single Page Application (React + Vite) hosted on Vercel / Cloudflare Pages
- **Backend:** Node.js Express 5 + Mongoose API hosted on independent cloud compute (e.g. VPS, Render, Railway)
- **Database:** MongoDB Atlas (Cluster0 replica set)
- **Edge Reverse Proxy & CDN:** Cloudflare (Free Plan)
- **Audit Date:** November 12, 2026

---

## 1. Executive Summary & Status Matrix

| Audit Area | Item | Status | Location / Implementation Details |
| :--- | :--- | :--- | :--- |
| **Client IP Resolution** | `TRUST_PROXY` + Cloudflare IP Range Validator | `DONE IN CODE` | `server.js` + `middleware/cloudflareIp.js` validates against Cloudflare official IPv4 & IPv6 CIDRs. Ignores forged `CF-Connecting-IP` headers. |
| **Origin Protection** | Cloudflare-only ingress & IP leak prevention | `NEEDS DASHBOARD` | Must configure cloud firewall / security groups to allow only Cloudflare IP ranges or deploy Authenticated Origin Pulls (mTLS). |
| **Bot Challenge / Captcha** | Cloudflare Turnstile Roadmap | `NEEDS DASHBOARD` | Server-side validation architectural blueprint designed; env var `TURNSTILE_SECRET` specified. |
| **Edge Caching** | Static assets cached, `/api/*` bypass | `DONE IN CODE & DASHBOARD` | Cache headers configured in Express; Cloudflare Cache Rules must enforce bypass on `/api/*`. |
| **SSL / TLS & HSTS** | Full (Strict) SSL, HTTPS Redirection, HSTS | `DONE IN CODE & DASHBOARD` | `server.js` enforces HTTPS redirect & HSTS header (`Strict-Transport-Security`). Cloudflare SSL must be set to "Full (strict)". |
| **WAF & Security Rules** | Endpoint protection for `/api/auth/*` & `/api/chat` | `NEEDS DASHBOARD` | Cloudflare Rate Limiting Rules & Bot Fight Mode configuration checklist provided. |

---

## 2. Real Client IP Resolution & Anti-Spoofing

### Problem Statement
When an application sits behind a reverse proxy like Cloudflare, `req.socket.remoteAddress` reports Cloudflare's edge proxy node address. If `req.ip` is used naively or if `trust proxy` is enabled globally without verification:
1. All users worldwide share Cloudflare's edge IP addresses, causing shared rate-limit bans (e.g., one user failing 5 logins locks out entire regions).
2. Attackers sending direct requests to the origin with a fake `CF-Connecting-IP: 1.2.3.4` header can spoof any IP address to bypass security restrictions.

### Implemented Solution (`middleware/cloudflareIp.js`)
The backend now inspects the true TCP socket remote address against **Cloudflare's published CIDR blocks**:
- **IPv4:** `173.245.48.0/20`, `103.21.244.0/22`, `103.22.200.0/22`, `103.31.4.0/22`, `141.101.64.0/18`, `108.162.192.0/18`, `190.93.240.0/20`, `188.114.96.0/20`, `197.234.240.0/22`, `198.41.128.0/17`, `162.158.0.0/15`, `104.16.0.0/13`, `104.24.0.0/14`, `172.64.0.0/13`, `131.0.72.0/22`
- **IPv6:** `2400:cb00::/32`, `2606:4700::/32`, `2803:f800::/32`, `2405:b500::/32`, `2405:8100::/32`, `2a06:98c0::/29`, `2c0f:f248::/32`

**Verification Behavior:**
- If the socket remote address belongs to Cloudflare, `CF-Connecting-IP` is trusted and assigned to `req.realClientIp`.
- If a direct client or attacker connects directly and provides a spoofed `CF-Connecting-IP`, the header is **ignored**, and the raw socket IP is used.
- Rate limiters and login brute-force trackers now track `req.realClientIp`.

---

## 3. Protecting the Origin Server

To prevent attackers from bypassing Cloudflare WAF, DDoS protection, and rate limiting by sending traffic directly to your backend's public IP:

1. **Firewall / Ingress Allowlisting:**
   - On the backend cloud host (e.g., AWS Security Groups, DigitalOcean Cloud Firewall, or iptables), configure inbound TCP port 443 / 80 to **only allow traffic originating from Cloudflare's IP list**.
2. **Authenticated Origin Pulls (mTLS):**
   - In Cloudflare Dashboard: **SSL/TLS** -> **Origin Server** -> **Authenticated Origin Pulls** -> Enable.
   - Upload Cloudflare's Origin CA certificate to your backend web server (e.g. Nginx reverse proxy) so direct non-Cloudflare HTTPS requests are dropped at the TLS handshake.
3. **Prevent Origin IP Leakage:**
   - Do not send outbound emails directly from the origin server (transactional email services like EmailJS or SendGrid keep the server IP hidden).
   - Ensure DNS A/AAAA records for your apex domain and subdomains are set to **Proxied (Orange Cloud)** in Cloudflare DNS.
   - Never expose internal hostnames or direct IP addresses in error stack traces or client-facing configuration.

---

## 4. Cloudflare Turnstile Roadmap

Cloudflare Turnstile provides a privacy-preserving, non-interactive alternative or enhancement to image CAPTCHA challenges:

### Verification Flow:
1. **Frontend:**
   Embed Turnstile widget script (`https://challenges.cloudflare.com/turnstile/v0/api.js`). On challenge completion, Turnstile provides a `cf-turnstile-response` token.
2. **Backend Verification (`/api/auth/register`, `/api/auth/login`):**
   ```javascript
   const verifyTurnstile = async (token, clientIp) => {
     const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
       method: "POST",
       headers: { "Content-Type": "application/x-www-form-urlencoded" },
       body: new URLSearchParams({
         secret: process.env.TURNSTILE_SECRET,
         response: token,
         remoteip: clientIp,
       }),
     });
     const data = await res.json();
     return data.success;
   };
   ```
3. **Required Environment Variable:**
   - `TURNSTILE_SECRET`: Secret key generated from Cloudflare Turnstile Dashboard.

---

## 5. Edge Caching & HTTP Headers Policy

### Rules:
1. **Never Cache API Routes (`/api/*`):**
   - Dynamic endpoints must have `Cache-Control: private, no-cache, no-store, must-revalidate`.
   - In Cloudflare Dashboard -> **Caching** -> **Cache Rules**:
     - *Expression:* `http.request.uri.path starts_with "/api/"`
     - *Action:* **Bypass Cache**.
2. **Static Uploads Caching (`/uploads/*`):**
   - Uploaded PDF notes, syllabus copies, and lab program files are immutable once uploaded.
   - Set Cloudflare Edge Cache TTL to 7 days or 1 month for `/uploads/*`.
3. **SSL / TLS Encryption:**
   - In Cloudflare Dashboard -> **SSL/TLS**: Select **Full (strict)** mode.
   - In **Edge Certificates**: Enable **Always Use HTTPS** and **HTTP Strict Transport Security (HSTS)** (max-age 31536000 with subdomains).

---

## 6. Actionable Cloudflare Dashboard Checklist for Owner

1. **DNS Settings:**
   - [ ] Point `jntucircle.com` and `api.jntucircle.com` to your frontend and backend hosts. Ensure the proxy status toggle is set to **Proxied (Orange Cloud)**.
2. **SSL / TLS Settings:**
   - [ ] Mode: **Full (strict)**.
   - [ ] Enable **Always Use HTTPS**.
   - [ ] Enable **Minimum TLS Version: 1.2**.
   - [ ] Enable **TLS 1.3**.
3. **Security & WAF Settings:**
   - [ ] **Bot Fight Mode**: Enable (in Security -> Bots) to challenge malicious automated bot nets.
   - [ ] **Rate Limiting Rule**:
     - Path: `/api/auth/*`
     - Condition: Greater than 15 requests per 10 minutes per IP
     - Action: Managed Challenge or Block.
   - [ ] **Rate Limiting Rule for Chat:**
     - Path: `/api/chat`
     - Condition: Greater than 30 requests per minute per IP
     - Action: Managed Challenge.
4. **Caching Rules:**
   - [ ] Create rule: If URI path starts with `/api/`, then **Bypass Cache**.
   - [ ] Create rule: If URI path starts with `/uploads/`, then **Cache Everything** (Edge TTL: 7 days).
5. **Audit Logs:**
   - [ ] Regularly monitor **Security** -> **Events** to inspect blocked DDoS attempts, rate-limit triggers, and geographic traffic distributions.
