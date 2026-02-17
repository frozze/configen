# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- New lint docs/API coverage for rules:
	- `security-ssl-enabled-missing-certs`
	- `correctness-proxy-enabled-without-backend`
- New analytics endpoint: `/api/analytics/event` to prevent 404 client events.

### Changed
- Linter auto-fix workflow is now core-driven and idempotent (`applyLintFix`, `applyAllLintFixes`).
- Linter page now uses syntax-highlighted editor for config input.
- Parser now ignores generated static-caching regex locations during import to prevent repeated location duplication after fix cycles.
- Generator now:
	- uses `$host` for HTTP→HTTPS redirects,
	- respects `listen443` when SSL is enabled,
	- emits valid `client_max_body_size` units (`m`/`g`),
	- generates default proxy location when reverse proxy mode is enabled and no custom locations are defined.

### Tests
- Added regression tests for linter fix idempotency.
- Added regression tests for parser static-caching import handling.
- Extended generator tests for SSL port selection, redirect host, body-size units, and default reverse-proxy location.

## [1.0.0] - 2025-02-13

### Added
- Core visual Nginx config generator with 8 sections
- 5 presets: Static Site, Reverse Proxy, WordPress, SPA, Load Balancer
- 100% client-side generation
- Live preview with syntax highlighting
- Copy & Download functionality
- Dark/Light mode
- Docker & Docker Compose support
- Comprehensive unit tests for generator and validator
