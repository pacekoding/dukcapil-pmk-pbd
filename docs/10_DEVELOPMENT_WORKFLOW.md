# Development Workflow

## Purpose

Menetapkan workflow pengembangan agar perubahan FE, BE, dan DB tetap aman dan mudah direview.

## Scope

Berlaku untuk local development, branch/PR, migration, build, Docker, dan release.

## Rules

### Local Setup

Services:

- PostgreSQL via Docker Compose.
- Go backend.
- Next.js frontend.

Commands:

```bash
docker compose up -d dukcapil-pbd-db
cd apps/dukcapil-pbd-be && go run ./cmd/api
cd apps/dukcapil-pbd-fe && npm run dev
```

### Change Workflow

1. Read related docs in `/docs`.
2. Inspect existing patterns.
3. Update DB migration first if schema changes.
4. Update backend model/repository/controller/router.
5. Update frontend types/API/UI.
6. Run checks.
7. Document behavior changes.

### Migration Workflow

- Never rely only on editing `000001` for existing DB.
- Add new numbered migration for every schema change after first local/prod use.
- Include both `.up.sql` and `.down.sql`.
- Down migration may be no-op if reversing would destroy production data; explain in comments.

### API Workflow

- Update backend contract.
- Update frontend type.
- Update API client.
- Verify with build and manual request.

### UI Workflow

- Use existing components first.
- Keep page focus clear.
- Validate mobile layout.
- Do not introduce new component library without ADR.

### Verification Commands

```bash
cd apps/dukcapil-pbd-be
go test ./...
```

```bash
cd apps/dukcapil-pbd-fe
npm run lint
npm run build
```

### Docker Workflow

After migration changes:

```bash
docker compose up -d --build dukcapil-pbd-be
```

After frontend changes:

```bash
docker compose up -d --build dukcapil-pbd-fe
```

## Implementation Examples

Adding a filter:

```txt
DB index -> API query param -> repository filter -> FE type -> FE control -> QA case
```

Adding a document field:

```txt
migration -> model -> repository scan/select -> API JSON -> TS type -> UI column/form
```

## Checklist

- [ ] Existing code pattern checked.
- [ ] Migration added if schema changed.
- [ ] Backend tests pass.
- [ ] Frontend lint/build pass.
- [ ] API types synced.
- [ ] UI states covered.
- [ ] Docker rebuild instructions known.

## Anti-patterns

- Editing DB schema without migration.
- Updating frontend type without backend response.
- Adding route but not menu/topbar.
- Adding menu to feature that was intentionally removed.
- Skipping build because lint passes.

## Acceptance Criteria

- A developer can run the project locally from this workflow.
- A PR can be reviewed by checking commands and docs.
- Schema changes work on both fresh and existing DB.
