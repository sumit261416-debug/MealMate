---
name: secure-vibe-coding
version: 2.0.0
description: Mandatory security-first workflow for AI-assisted changes to Flutter, React/Next.js, Node.js and PostgreSQL applications. Use for planning, coding, debugging, reviewing, testing, dependency changes, authentication, data handling, CI/CD, infrastructure, and release decisions.
---

# Secure Vibe Coding Skill — Security-First Engineering Standard

## 0. Purpose, authority, and honest limits

Use this skill for every task in this repository, not only tasks explicitly described as security work. Security requirements apply to features, bug fixes, refactors, configuration, tests, dependencies, migrations, and deployment.

**No software can be guaranteed to be unhackable.** The goal is to reduce risk, apply layered controls, detect regressions, and document remaining uncertainty. Never promise that an attack can never happen. Never say a test, scan, deployment, backup, or control succeeded unless you actually ran or verified it. Mark unverified items `NOT VERIFIED`.

If repository instructions conflict, follow the most security-preserving approach and explain the conflict. Do not silently weaken a control to make a test pass. Ask the user before material architecture choices, production-impacting operations, paid services, destructive changes, or relaxing a release gate.

## 1. Default project context

- Mobile client: Flutter / Dart
- Web client: React / Next.js
- Backend: Node.js (identify the actual framework and supported runtime from the repository)
- Database: PostgreSQL
- Hosting: not yet selected
- Data: user accounts and personal information

Do not assume a provider, framework, authentication system, route structure, deployment process, or compliance obligation without evidence. Inspect the repository and ask concise questions when a missing decision materially affects security.

## 2. Non-negotiable security principles

1. **Treat clients as untrusted.** The browser, mobile app, local storage, headers, request bodies, query parameters, device state, and client-side validation can be manipulated.
2. **Enforce controls server-side.** Authentication, authorization, ownership, pricing, roles, state transitions, and sensitive business rules must be verified by the backend.
3. **Default deny; fail closed.** If identity, permission, validation, signature, or policy cannot be verified, reject the operation safely.
4. **Least privilege everywhere.** Apply to end users, service accounts, database roles, CI/CD identities, cloud IAM, logs, and third-party integrations.
5. **Layer defenses.** No single scanner, framework, WAF, token, or security header is sufficient.
6. **Minimize data.** Collect, return, log, retain, and share only what is needed.
7. **No secrets in clients or source.** Never hardcode passwords, private keys, signing keys, production credentials, database URLs, bearer tokens, or API secrets in code, fixtures, screenshots, documentation, build artifacts, mobile assets, or client-visible environment variables.
8. **No insecure bypasses.** Never disable TLS/certificate checks, authentication, authorization, CSRF protections, input validation, dependency checks, security headers, or failing tests merely to make a feature work.
9. **Small, reviewable changes.** Prefer minimal changes, inspect diffs, and avoid unrelated refactors.
10. **Evidence over confidence.** Use actual test/scan output; distinguish `PASS`, `FAIL`, `NOT RUN`, and `NOT VERIFIED`.
11. **Authorized testing only.** Use local/staging systems and synthetic data. Do not run active scans, load tests, destructive tests, or exploit attempts against production without explicit scope approval, a safe window, and recovery plan.
12. **Security is continuous.** Include patching, monitoring, incident response, backup restoration, and periodic reassessment.

## 3. Mandatory workflow for every task

### Step A — Inspect before editing

1. Read repository guidance (`AGENTS.md`, `README`, security docs), manifests, lockfiles, build scripts, tests, migrations, and deployment configuration relevant to the task.
2. Identify language/framework/runtime versions and actual commands for linting, tests, build, and security scans.
3. Map the affected routes, trust boundaries, data stores, identity flows, third-party services, and sensitive data.
4. Review current working-tree changes before editing. Do not overwrite, discard, or reformat unrelated user changes.
5. Look for accidental secrets without printing their values. If found, report file/location and secret type, redact the value, and recommend revocation/rotation.
6. Do not assume a file, test, environment, or tool exists; verify it.

### Step B — Threat-model the change

For security-relevant changes, briefly list:
- Assets: accounts, personal data, sessions/tokens, privileged actions, database, files, keys.
- Threat actors: unauthenticated attacker, ordinary user, another user/tenant, compromised account, malicious insider, automated bot.
- Entry points: route, API, form, file upload, webhook, deep link, scheduled job, database query, external URL fetch.
- Abuse cases: unauthorized read/write, privilege escalation, account takeover, injection, data leakage, replay, abuse of expensive operations, denial of service.
- Controls and negative tests that address these cases.

For a trivial non-sensitive UI-only change, keep the threat model short. Do not skip it if trust boundaries or security-sensitive behavior change.

### Step C — Implement secure behavior

- Validate route params, query params, headers, and bodies using strict schemas, explicit allowlists, type/range checks, and length/size limits.
- Authenticate each protected request and authorize every sensitive action and every object access.
- Check ownership and tenant membership on reads, updates, exports, downloads, and deletes; unpredictable IDs alone are not authorization.
- Use parameterized SQL or correctly used ORM APIs. Do not concatenate untrusted data into SQL, shell commands, templates, or filesystem paths.
- Allowlist writable fields; never blindly spread client request bodies into models.
- Use safe framework output encoding. Avoid raw HTML; if required, use a maintained sanitizer with a restrictive allowlist.
- Apply timeouts, body-size limits, pagination caps, concurrency limits, rate limits, and cost controls appropriate to the endpoint.
- Use transactions and database constraints to protect critical invariants and prevent race conditions.
- Return safe, generic client errors; do not reveal stack traces, SQL details, file paths, secrets, or internal configuration.
- Add tests for permitted behavior and denied behavior.
- Avoid adding dependencies when built-in or already-approved functionality is sufficient. Review maintenance, provenance, advisories, license, and transitive dependencies before adding a package.

### Step D — Security-focused diff review

Inspect the complete diff for:
- New or changed endpoints without correct authentication/authorization.
- Broken object-level/function-level authorization (IDOR/BOLA).
- Client-controlled role, owner, tenant, status, price, or approval fields.
- SQL, command, template, LDAP, or other injection where applicable.
- XSS, CSRF, SSRF, open redirects, path traversal, unsafe deserialization, request smuggling, prototype pollution, or unsafe file handling where relevant.
- Missing rate limits, timeouts, pagination caps, abuse controls, or idempotency for sensitive operations.
- Sensitive information in API responses, logs, analytics, URLs, caches, crash reports, local storage, screenshots, or client bundles.
- Weak or custom cryptography; insecure random numbers; disabled TLS verification.
- Misconfigured CORS, cookies, CSP, headers, proxies, cache, storage, IAM, firewall, or database access.
- Dependency, lockfile, build, container, CI/CD, migration, and infrastructure changes that increase risk.
- Tests that are missing, weakened, skipped, or changed to hide a failure.
- Any newly introduced default, debug endpoint, test credential, permissive fallback, or temporary bypass.

### Step E — Verify honestly

1. Run targeted tests, then relevant broader tests, lint/type checks, and build.
2. Run package-manager dependency audit, secret scan, SAST, and applicable container/infrastructure scans when available.
3. Test authenticated and unauthenticated API behavior, ownership/role boundaries, and abuse limits.
4. Use DAST only on an authorized local/staging environment, with scope and safe settings.
5. Inspect migration safety, backup/recovery implications, and rollback path for data/schema/deployment changes.
6. Record exact commands and meaningful results. A scanner with no findings is not proof of no vulnerabilities.
7. If tools are unavailable or tests cannot run, report `NOT RUN` or `NOT VERIFIED`; do not infer success.

Do not install new tools, update major dependencies, run migrations, alter production settings, deploy, delete data, rotate live credentials, or perform destructive actions without understanding the impact and getting confirmation when material.

### Step F — Final report

Every task ends with:
- Summary of changes.
- Security controls added or preserved.
- Tests/scans actually run, commands, and results.
- Known risks, assumptions, and `NOT VERIFIED` items.
- Manual configuration/deployment steps.
- Release recommendation: `READY FOR REVIEW`, `BLOCKED`, or `NOT VERIFIED`.

Never label the whole app “secure,” “fully protected,” or “unhackable” because a few tests passed.

## 4. Authentication, passwords, sessions, and account recovery

- Prefer a maintained, well-supported authentication library or identity provider. Do not invent password protocols or cryptographic designs.
- Store passwords only with a modern password-hashing scheme such as Argon2id, or an appropriate maintained alternative supported by the chosen auth system. Never store plaintext or reversibly encrypted passwords.
- Use generic login and password-reset responses to reduce account enumeration.
- Rate-limit login, registration, password reset, OTP delivery/verification, and recovery attempts; add monitoring and risk-based protections.
- Password-reset tokens must be cryptographically random, short-lived, single-use, and preferably stored as hashes. Invalidate them after use or password change.
- Require MFA for administrators and privileged users; consider MFA for all accounts based on risk.
- Rotate/revoke sessions and refresh tokens on logout, password change, account recovery, suspected compromise, and relevant privilege changes.
- Design refresh-token rotation and replay detection deliberately. Do not leave long-lived tokens in URLs.
- For JWTs, verify signature, explicitly allowed algorithm, issuer, audience, expiry, and relevant claims. Decoding is not verification. Plan key rotation and revocation.
- Use secure cookie attributes for browser sessions; apply CSRF protection to cookie-authenticated state-changing requests.
- Avoid revealing whether an account exists, and protect account recovery from takeover.
- Define secure email/phone change flows and notify users about important account changes.
- Log security events without logging credentials, full tokens, OTPs, or unnecessary personal data.

## 5. Authorization, privacy, and business logic

- Enforce access rules on the server for every read, create, update, export, download, and delete.
- Check record ownership/tenant membership on every request, including nested resources and bulk operations.
- Enforce privileged functions and role transitions server-side. Never rely on hiding UI controls.
- Allowlist mutable fields and reject unexpected privileged fields.
- Return only fields the caller needs; prevent mass data exposure.
- Test race conditions and state transitions for sensitive operations.
- Define data classification, purpose, retention, deletion, export, and access-audit requirements.
- Use synthetic data in development/test. If real data use is specifically authorized, minimize it and apply equivalent safeguards.
- Avoid exposing personal data in URLs, analytics, telemetry, notifications, error messages, or support tools.

## 6. Flutter-specific controls

- Store sensitive session material only in platform-backed secure storage (iOS Keychain / Android Keystore-backed solution, such as a suitable maintained secure-storage package after checking its behavior and maintenance).
- Never store credentials or private secrets in Dart source, assets, ordinary preferences, plain files, or client bundle configuration.
- Use HTTPS with normal certificate and hostname validation. Never accept all certificates or bypass validation in release builds.
- Assume keys embedded in the app can be extracted; never put server secrets in the app.
- Redact tokens, personal data, request bodies, and sensitive responses from logs and crash reports.
- Validate deep links and route parameters, but always authorize data access on the server.
- Review Android exported components, intent filters, app links, permissions, and backup rules; review iOS URL schemes, universal links, entitlements, Keychain sharing, and data protection.
- Avoid storing sensitive data in clipboard, notifications, screenshots, app-switcher previews, or offline caches where inappropriate.
- Disable debug features and development endpoints in release builds.
- Obfuscation is defense-in-depth only. Root/jailbreak checks are signals, not substitutes for server-side controls.
- Use certificate pinning only if threat-model justified and certificate rotation/recovery are planned and tested.
- Test supported OS versions and inspect release artifacts for accidental secrets.

## 7. React / Next.js-specific controls

- Treat all browser state and input as attacker-controlled.
- Keep server-only secrets server-side. Anything exposed through `NEXT_PUBLIC_*` or client bundles must be treated as public.
- Protect route handlers, server actions, middleware, and server components that expose private data with correct server-side authentication and authorization.
- Do not assume middleware alone is sufficient for every sensitive data operation; enforce checks near the data access/action.
- Use `HttpOnly`, `Secure`, and appropriate `SameSite` session cookies. Rotate sessions on login and privilege changes.
- Protect cookie-authenticated mutations against CSRF with an appropriate strategy.
- Prefer normal React escaping; avoid `dangerouslySetInnerHTML`. If unavoidable, sanitize untrusted HTML with a maintained, restrictive sanitizer.
- Configure a suitable CSP and security headers, including frame restrictions, MIME-sniffing protection, and referrer policy. Test policy compatibility instead of blindly allowing unsafe directives.
- Configure CORS to explicit trusted origins only when cross-origin access is required. CORS is not authentication and does not protect mobile clients.
- Prevent open redirects by allowlisting destinations or accepting only safe relative paths.
- Defend server-side URL fetching against SSRF: allowlist destinations when feasible, block private/loopback/link-local/cloud-metadata ranges, and revalidate redirects and DNS resolution.
- Avoid caching personalized/private responses in shared caches; review framework caching and revalidation behavior carefully.
- Validate image, file, and remote-content sources. Do not leak server-side exception details to client components.

## 8. Node.js API controls

- Use a supported Node.js LTS release and maintained framework/dependencies.
- Apply strict schema validation to route params, query strings, headers where applicable, and request bodies.
- Centralize authentication, authorization, error handling, request correlation IDs, rate limiting, and audit events.
- Set body-size limits, timeouts, concurrency/resource limits, and pagination caps.
- Configure security headers (for example Helmet in Express where appropriate), exact CORS origins, and secure cookie settings.
- Avoid detailed errors in production; never return stack traces or database errors to clients.
- Do not trust `Host`, `X-Forwarded-*`, client IP, user ID, role, price, ownership, or status from a request without a trusted server-side source and correctly configured proxy handling.
- Verify webhook signatures, use timestamp/replay protections where supported, and make processing idempotent where appropriate.
- Restrict outbound requests to defend against SSRF and internal network probing.
- Use cryptographically secure randomness for tokens and nonces. Do not write custom crypto.
- Ensure asynchronous errors are handled and sensitive operations have clear transaction/rollback behavior.
- Use graceful shutdown and safe health/readiness endpoints that disclose no sensitive configuration.

## 9. PostgreSQL controls

- Keep the database on private networking by default; do not expose it publicly without a reviewed, explicit need.
- Require TLS for database connections where supported and validate certificates.
- Use separate migration/admin and application runtime roles. Runtime must not be superuser and should have only required schema/table/sequence/function permissions.
- Use parameterized queries or safe ORM APIs; strictly allowlist dynamic identifiers.
- Apply constraints, foreign keys, transactions, indexes, and uniqueness rules for critical invariants.
- Review database roles, `search_path`, function privileges, extensions, and migration scripts.
- Consider row-level security only when correctly designed, tested, and paired with safe role/session configuration. It is not automatic protection.
- Encrypt backups, restrict access, define retention, and regularly restore-test them.
- Never place credentials in migrations, SQL dumps checked into source, logs, or checked-in configuration.
- Avoid production data in developer laptops and CI. Mask or synthesize data when possible.
- Define how deletion requests affect replicas, backups, logs, and derived data.

## 10. Secrets, dependencies, CI/CD, and hosting

- Use a managed secret store or protected deployment secret facility; separate credentials per environment.
- Keep `.env` files out of source control. Commit only placeholder examples such as `.env.example`.
- If a secret is exposed, revoke/rotate it, investigate usage, and review history/build artifacts; deleting the latest copy is insufficient.
- Commit lockfiles and review dependency changes for maintenance, advisories, provenance, license, and transitive dependencies.
- Run dependency and secret scanning on pull requests and scheduled builds.
- Use least-privilege CI credentials, protected branches/environments, reviewed changes, and approval gates for production.
- Pin build actions/images where practical; update through a reviewed process.
- If containers are used, use minimal maintained base images, non-root users, no embedded secrets, and image scanning.
- If cloud infrastructure is used, review IAM, firewall/security groups, private database connectivity, object-storage exposure, audit logs, encryption, and backup policies.
- Separate development, staging, and production with distinct credentials, data, access, and configuration.
- Avoid production deploys from unreviewed branches or untrusted pull-request code with privileged secrets.
- Define rollback and recovery procedures before high-impact releases.

## 11. Logging, monitoring, and incident response

- Monitor repeated login failures, suspicious account recovery, unusual API access, authorization denials, unexpected admin changes, traffic spikes, service errors, and database/security events.
- Keep logs access-controlled, tamper-resistant where feasible, and governed by a documented retention policy.
- Never log passwords, OTPs, full access/refresh tokens, private keys, database credentials, or unnecessary sensitive personal data.
- Alert on exposed secrets, critical dependency advisories, unusual privilege changes, and backup failures where tooling supports it.
- Maintain an incident owner, contact path, containment steps, credential/session revocation procedure, evidence-preservation plan, and recovery procedure.
- For suspected compromise: preserve evidence, contain safely, revoke sessions/rotate affected secrets, assess scope, restore from known-good backups if needed, meet applicable notification obligations with the responsible owner, patch root cause, add regression tests, and monitor.
- Do not claim legal/regulatory compliance without a scoped assessment by responsible qualified parties.

## 12. Security QA test matrix

For each new/changed endpoint or sensitive feature, consider and document applicable tests:

### Authentication
- Missing, invalid, expired, and revoked credentials.
- Password reset expiry, one-time use, replay, and account enumeration.
- Login/reset/OTP rate limits and session invalidation.
- MFA enforcement on privileged paths.

### Authorization
- User A attempting to read/update/delete/export User B's data.
- Normal user invoking admin functions.
- Forged owner, tenant, role, approval, price, and status fields.
- Nested resource, bulk operation, download, and background-job access checks.

### Input and application security
- Missing, malformed, oversized, unexpected, and boundary values.
- Injection payloads in relevant fields, handled safely.
- XSS payloads rendered as text or safely sanitized.
- CSRF behavior for cookie-authenticated mutations.
- SSRF, open redirects, path traversal, unsafe file upload, and webhook replay where applicable.
- Safe error responses without stack traces or secrets.

### Data and infrastructure
- No sensitive data in responses, logs, URLs, analytics, caches, or client artifacts.
- CORS, cookie attributes, CSP, HTTPS, and certificate validation.
- Rate limits, pagination caps, request timeouts, and resource-exhaustion protections.
- Database least privilege, migration behavior, backup restoration, and rollback.
- Dependency/SAST/secret/configuration scan gates.

Use synthetic accounts and data. Do not run destructive tests against production without explicit authorization, defined scope, maintenance window, and recovery plan. A passing automated scan does not prove absence of vulnerabilities.

## 13. Release gates

Recommend blocking production release when:
- A confirmed critical vulnerability remains unresolved.
- Protected routes lack authentication or resource-level authorization.
- A leaked credential/secret has not been revoked or rotated.
- TLS verification is disabled or an insecure certificate bypass is present.
- The production database is exposed or overprivileged without an approved, reviewed exception.
- Security tests fail and the cause is not understood.
- High-impact changes have no verified backup/recovery or rollback plan.
- A security-sensitive feature has not been tested in an appropriate environment.

High-severity findings should normally be resolved before release. An exception requires documented risk acceptance, compensating controls, a named owner, and a deadline. Do not silently waive gates.

## 14. Definition of done

A task is not complete until:
- The requested behavior is implemented without weakening security.
- Relevant positive and negative tests exist or the reason for omission is documented.
- Applicable tests and scans were run, or marked `NOT RUN`.
- The diff and configuration impact were reviewed.
- No secrets or sensitive data were introduced into code/logs/client bundles.
- Remaining risks and manual actions are clearly reported.

## 15. Required completion response

### Summary
- ...

### Security review
- Trust boundaries and abuse cases considered: ...
- Controls added/preserved: ...
- Diff risks: ...

### Verification
- Commands actually run: ...
- Results: `PASS` / `FAIL` / `NOT RUN` / `NOT VERIFIED`, with concise evidence.

### Remaining risks and manual actions
- ...

### Release recommendation
- `READY FOR REVIEW`, `BLOCKED`, or `NOT VERIFIED`.

Never say “100% secure,” “unhackable,” “attack-proof,” or “all vulnerabilities eliminated.” State what was tested, what was not tested, and what residual risk remains.
