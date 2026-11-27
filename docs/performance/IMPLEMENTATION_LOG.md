# HMS performance optimization

Baseline commit: 0d42f2b. Branch: performance/hms-optimization.

## Implemented
- Pharmacy and doctor search: 350 ms debounce, abort obsolete requests, guard stale responses.
- Pharmacy: separate unrelated statistics and service requests from search.
- Admin: defer daily reports and report overview until their tabs open; isolate effect dependencies; retain initial approvals.
- Admin and receptionist: aggregate paid invoice revenue in PostgreSQL rather than loading invoice rows.

## Verification
TypeScript check (tsc --noEmit --incremental false) passed; git diff --check passed.
No authenticated benchmark or workflow regression test has been performed. SQL floating-point aggregation may differ in rounding order; verify financial parity on synthetic data before release.

## Remaining work
Validate live indexes and query plans in authorized staging; preserve pharmacy FEFO, COGS and stock rules. Evaluate catalogue pagination, dashboard component splitting, bundle profiling, production Docker networking and storage cleanup. Root partition was 97% full; avoid production builds until storage is resolved. No production migration, restart, cleanup or deployment performed.

## Rollback
Original master commit remains 0d42f2b. Review git diff before committing. To discard only these changes, after explicit approval restore the five edited source files from the baseline and remove this new document. Do not reset unrelated changes. No database rollback is needed.

## Phase 2
- Reduced admin sales, stock and medicine projections; approved inventory filtering moved to database.
- Receptionist visits select serviceType only.
- Doctor patient selection uses functional state update.
- Added tests/performance-safe.test.cjs: three mocked route tests passed; TypeScript and diff checks passed.
- Read-only pg_indexes inspection confirmed missing candidate indexes on Invoice, Visit, StockBatch, PharmacySaleItem, PharmacySale, ApprovalRequest, AuditLog, ShiftClosing and DrawerAdjustment. No DDL executed.
- Existing pharmacy verification script writes transactions; do not run against production.
- Remaining: staging SQL plans, real financial rounding parity, browser search tests, catalogue pagination and build. COGS first-batch selection is unordered in original code; projection could change database row ordering, so verify before deployment.

## Phase 3
Read-only EXPLAIN confirmed sequential scans on Invoice, Visit, StockBatch (plus sort), PharmacySaleItem. Estimated live rows: 3, 3, 344, 22 respectively; Medicine 346. Small tables may favor scans. No EXPLAIN ANALYZE or DDL executed.
Prepared five candidate concurrent indexes and matching rollback SQL in docs/performance/index-migration. Repository has no prisma/migrations directory; these are review-only SQL drafts, not Prisma migration history. Before applying, reconcile Prisma schema, verify index definitions and invalid indexes, backup and test in staging.
Medicine endpoint now supports optional page/pageSize (max 100), preserving legacy response and summary, FEFO, discounts and low-stock filtering. Pagination is applied after calculation, reducing response size only, not DB workload. Existing UI remains unchanged because the restock selector shares the full catalogue; separate picker data and stable ordering are required before enabling pagination in UI.
Four mocked route tests passed, TypeScript and diff checks passed. No production data or schema changed.

## Phase 4
- POS requests 3 initial items or 50 search matches per page; previous/next navigation and full matching count.
- Restock selector independently loads full catalogue on modal open with abort and error handling; no search-page dependency.
- Paginated endpoint projects matching stock quantities then retrieves full details for page IDs only; stable medicine ID tie-breaker for paginated callers. Legacy callers unchanged. Two reads can observe concurrent stock changes; no snapshot guarantee. Full matching stock scan remains.
- Dynamic imports for ten admin/pharmacy tab component import sites; actual bundle savings not measured.
- Four mocked route tests and TypeScript passed; browser and real database integration tests pending. No production changes.

## Phase 5
- Catalogue reads now use one PostgreSQL RepeatableRead transaction and private/no-store response headers. Consistency applies within a request, not across separate page requests.
- Checkout conditional updateMany checks available quantity atomically; failure throws inside existing transaction, preventing sale creation. Existing price and discount formulas unchanged.
- Ultrasound service requests deferred until services tab opens; no shared cache introduced for live prices, stock or patient data.
- Six mocked route tests passed, including conditional deduction failure and successful checkout totals. TypeScript and diff checks passed. Real concurrent transactions and rollback require staging integration tests.
- Remaining risks: sale and return number allocation outside transaction; return eligibility concurrency; client-supplied prices and quantities require separate validation review; ultrasound GET auto-seeds defaults, so not safe to invoke in production audit. No changes to these business rules. Root 97% full. No production data, schema or containers modified.

## Phase 6
- Production compose source removes host DB port publication, adds HTTP application healthcheck; existing production log rotation retained. Development compose adds bounded logs.
- Docker ignore expanded for environment variants, key and backup artifacts.
- Both compose config --quiet validations, six mocked tests and diff check passed.
- Existing image 1.58 GB; single-stage Dockerfile unchanged pending runtime dependency validation and storage recovery. Root 97%, 2.9 GB available; no cleanup or build.
- Tracked .env and password-related DB image ENV require secure review. No credentials printed intentionally. Rollback and release checklist in INFRASTRUCTURE_ROLLBACK.md.
- No running containers restarted or modified; no resources deleted.

## Phase 7
Six mocked tests, TypeScript, both Compose validations and diff check passed. Existing database/HTTP verification scripts excluded from live execution. Reviewed cumulative changes and documented remaining defects and staging protocol in STAGING_BENCHMARK_PLAN.md. No source changes in this review phase; no builds or production writes.

## Phase 8
- Checkout rejects invalid quantities, nonfinite/negative prices and discounts; verifies approved batch association in read and atomic deduction. Existing valid numeric financial formulas retained.
- Sale and return numbering moved inside transactions with separate PostgreSQL transaction advisory locks (724001/724002). Return eligibility aggregates duplicate requested and sold lines, includes pending returns and validates supplied batch association. Pending closing workflow unchanged.
- Synchronous UI guards for checkout, return and restock; restock disabled during catalogue load/error.
- Nine mocked tests and TypeScript/diff checks passed after correcting Map iteration for existing compiler target. No real lock/concurrency test performed.
- Remaining: durable server idempotency, authoritative price/discount and item type policy, direct return eligibility, audit reliability, lock contention and rollback tests in isolated PostgreSQL. Existing audit helper catches errors, so audit failure does not normally propagate after commit. Advisory locks protect cooperating routes only; validate isolation and all writers in staging.
- No production writes, migrations, builds or restarts.
