# Infrastructure review and release checklist

No running containers, volumes, images or production data changed. Compose edits are source-only.

## Before release
- Resolve root storage (97%, 2.9 GB free); target at least 20 GB free before staging builds. Inspect Docker cache, unused images, journal and Ollama storage separately. No pruning or deletion authorized.
- Back up database to verified separate storage and test restore in staging. Record current image IDs, compose project name, volume identity and configuration securely. Never publish credentials.
- Confirm app DATABASE_URL uses postgres_prod:5432 on bridge, and backup/biometric/admin tooling does not require published database port. Verify host-only admin access from actual LAN workstations; current defaults do not enforce it.
- Validate app login health probe in staging; it checks HTTP responsiveness only, not database readiness. PostgreSQL retains existing pg_isready check.
- Build and test candidate image under a distinct tag, never overwrite rollback image. Existing single-stage Dockerfile retained because runtime Prisma/biometric dependencies and offline deployment need validation before multi-stage conversion.
- Verify .env is tracked in Git; review history and rotate any real exposed credentials with owner approval. Dockerfile.db contains a password-related ENV instruction; inspect securely and remove baked credentials in a separately tested release. No secret values recorded here.
- Validate database initialization SQL contains only intended seed data before distributing DB image.

## Rollback
Restore prior compose configuration from baseline commit 0d42f2b or saved deployment copy, preserving actual environment and named volume hms_pgdata_prod. Use previously recorded image ID/tag, not mutable latest. With explicit maintenance approval recreate only affected services using the original project name and configuration. Never use down -v, volume rm, or database reset. Verify login, DB health, all portals and backup access. No schema change in this phase.
