# MealMate deployment hardening checklist

Hosting is not selected yet. Use this before any staging/production release.

## Environments

- Separate `local`, `staging`, and `production` credentials and databases.
- Never reuse production `JWT_SECRET`, DB passwords, or payment keys in lower envs.
- Commit only `.env.example`. Real `.env` / `.env.local` stay off git.

## Required secrets

| Name | Notes |
|------|--------|
| `DATABASE_URL` | Private network Postgres; TLS where supported |
| `JWT_SECRET` | ≥ 32 random chars; rotate on suspected leak |
| `CORS_ORIGINS` | Exact web origins only |
| `ADMIN_BOOTSTRAP_*` | Seed/bootstrap only; change after first login |
| `PRIVATE_STORAGE_DIR` | Outside public web root |

## Release gates

- [ ] Protected `/v1/admin/*` requires admin role (`PASS` with automated tests)
- [ ] No secrets in client bundles / Flutter assets
- [ ] Dependency audit reviewed (`npm audit`)
- [ ] DB backups configured and restore-tested
- [ ] Rollback plan documented for migrations
- [ ] TLS enabled end-to-end
- [ ] Rate limits active on login
- [ ] Document signed URLs expire (5m) and are audited

## Not yet production-complete

- Admin MFA and phone OTP
- Live payment gateway webhooks
- Managed object storage for partner documents (local private disk is for pilot/dev)

## Honest status labels

Record verification as `PASS` / `FAIL` / `NOT RUN` / `NOT VERIFIED`. Do not call the system unhackable.
