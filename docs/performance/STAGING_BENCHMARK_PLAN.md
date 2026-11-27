# Phase 7 — Staging benchmark and release gates

Baseline: master 0d42f2b. Candidate: performance/hms-optimization (uncommitted).
No production writes, builds, restarts or migrations performed.

## Executed
Six mocked route tests passed; TypeScript noEmit, both Compose config --quiet and git diff --check passed. One existing production login HTTP 200, TTFB 5.817 ms, total 5.863 ms; not a candidate benchmark. Existing 18 TS tests and eight JS verification scripts reviewed for side effects; not executed because they use database or live HTTP/auth. Reset and seed scripts excluded.

## Release blockers
- Checkout accepts unvalidated client quantity, price, discount and batch/medicine association; negative quantity could increase stock. Validate positive integer quantity, finite allowed price/discount and batch association/approval against documented pricing rules.
- Sale and return numbering outside transaction may collide; return eligibility outside transaction and duplicate medicine lines may allow excess returns. Test concurrent requests, design atomic allocation/validation and idempotency.
- Audit log after checkout commit may fail and report failure despite completed sale; verify audit helper behavior and retry semantics.
- Restock submit handler lacks loading/error guard; disable submit and guard handler while catalogue unavailable.
- COGS first batch unordered and floating-point aggregation parity unverified.
- Catalogue snapshots consistent per request only; page drift across requests possible. Test stock changes, stable ordering and empty/out-of-range pages.
- Existing tracked .env, DB image credential instruction, admin IP defaults and published live DB port require secure review. Compose changes not deployed.
- Root 97% full, 2.9 GB available; no build until recovery.

## Isolated staging
Recover at least 20 GB root space or provision separate staging host. Use separate compose project, unique container/network/volume names (existing compose has explicit names), distinct ports, synthetic database and credentials, no production volume mounts or network. Confirm DATABASE_URL points to staging before any test. Existing scripts with hardcoded localhost ports must be adapted or run in isolated environment. Never run reset scripts against production.
Compare baseline and candidate with identical hardware, PostgreSQL version, synthetic fixture and browser. Use 350/5000 medicines, 10000 patients, 50000 visits/invoices/sales as scaled scenarios; use deterministic seed. Measure cold and warm runs separately, 30+ samples per endpoint and 5/20/50 concurrent users for 5 minutes each; checkout writes only staging. Record p50/p95/p99, errors, request counts, payload bytes, DB plans/buffers, CPU/RAM and bundle sizes. Compare before/after indexes separately using staging EXPLAIN ANALYZE.
Targets (proposed): LAN dashboard usable <1s, search p95 <200ms excluding debounce, stats p95 <300ms, checkout p95 <500ms, no unexpected errors or stock/financial discrepancies. Record browser end-to-end search including debounce separately.
Test all four roles: login/RBAC/IP restrictions, patient registration/search/biometric/OPD, doctor notes/history, pharmacy FEFO/discount/cart/checkout/returns/restock, admin approvals/reports/payroll, receipt printing, shift closing, offline LAN, backup restore. Compare financial totals to baseline on same fixture, including rounding and multi-batch COGS. Simultaneous checkout, duplicate submissions, returns, transaction rollback and audit failures must be tested.
Release only after blockers resolved, tests passed, backup restore verified and explicit approval. Retain original image and volume; follow INFRASTRUCTURE_ROLLBACK.md.
