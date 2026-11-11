# Multi-stage production Dockerfile for andhra-circle-backend
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner

WORKDIR /usr/src/app
ENV NODE_ENV=production

# Install dumb-init to properly handle PID 1 signals (SIGTERM/SIGINT)
RUN apk add --no-cache dumb-init curl

# Create non-root user
USER node

COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .

# Ensure uploads directory exists and is writable
RUN mkdir -p uploads

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/healthz || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]

