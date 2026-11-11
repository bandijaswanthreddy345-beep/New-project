# Changelog

All notable changes to the JNTU Circle platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-11-11

### Added
- **Structured JSON Logging**: Standardized zero-dependency JSON logs with automatic credential scrubbing.
- **Request ID Tracking**: Correlation IDs (`X-Request-ID`) attached to all incoming and outbound requests.
- **Health Endpoints**: Added `/healthz` (process liveness) and `/readyz` (MongoDB readiness with 2s timeout).
- **Graceful Shutdown**: Intercepts `SIGTERM` and `SIGINT`, drains active HTTP connections, and closes Mongoose connections cleanly.
- **Resilient Outbound Call Helper**: Exponential backoff, jitter, network retry filters, and circuit breaker for OpenRouter and JNTUA sync.
- **Persistent Shared State**: Migrated failed login counters, captcha nonces, and AI daily quotas to MongoDB TTL collections (`SecurityState`).
- **Atomic Counters**: Converted likes, views, and downloads to atomic `$inc` operations to eliminate lost updates.
- **Soft Deletes**: Non-destructive deletion with `deletedAt` and `deletedBy` across all academic collections.
- **Database Migrations**: Standalone migration runner (`npm run migrate`) and migration `001_soft_delete_and_token_version`.
- **Compound Query Indexes**: High-performance indexes for branch/semester catalog queries (`branch + semester + deletedAt + createdAt`).
- **Cache Invalidation**: Content version counter in MongoDB invalidates stale chatbot and catalog answers on write.
- **Test Suites**: Integration tests with Node built-in test runner (`node --test`) and frontend tests with Vitest.
- **CI Pipeline**: Zero-secrets GitHub Actions workflow (`.github/workflows/ci.yml`).
- **Docker Support**: Multi-stage production Dockerfiles and local `docker-compose.yml`.
- **API Versioning**: Aliased `/api/v1` routes with complete OpenAPI 3.0 specification.

### Fixed
- Fixed duplicate key race condition returning `500` on concurrent registrations; now returns `409 Conflict`.
- Fixed lost updates in likes and counter tallies.
- Fixed Slowloris vulnerability with explicit server header, request, and keep-alive socket timeouts.

