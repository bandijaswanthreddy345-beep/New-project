# Environment Configuration Matrix

This document defines the separation of environments for the JNTU Circle architecture. No actual credentials or secrets are committed here.

| Variable | Development (Local) | Staging | Production |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `development` | `staging` | `production` |
| `PORT` | `5000` | `5000` | `5000` (or assigned by PaaS) |
| `MONGO_URI` | `mongodb://localhost:27017/jntu_circle_dev` | Atlas Staging Cluster | Atlas Production Cluster (Dedicated VPC) |
| `JWT_SECRET` | 32+ character random dev secret | 48-byte cryptographically random hex | 48-byte cryptographically random hex |
| `CAPTCHA_SECRET` | Ephemeral / random dev secret | 32-byte cryptographically random hex | 32-byte cryptographically random hex |
| `CORS_ORIGINS` | Empty (permits localhost) | `https://staging.jntucircle.com` | `https://jntucircle.com` |
| `TRUST_PROXY` | `false` | `1` (or reverse proxy hop count) | `1` (Cloudflare / Load Balancer) |
| `SENTRY_DSN` | Empty (disabled) | Staging DSN | Production DSN |
| `OPENROUTER_API_KEY`| Dev key | Staging key | Production key with strict spend limits |
| `CHAT_DAILY_CAP` | `500` | `500` | `2000` |

