# MealMate NCR — Phase 0 Discovery Report

**Status:** Draft for owner approval  
**Date:** 2026-10-27  
**Skills applied:** `mealmate-ncr-app-builder`, `secure-vibe-coding` v2  
**Release recommendation for this phase:** `READY FOR REVIEW` (planning only; no production code yet)

---

## 1. Product summary

MealMate is a daily-meal marketplace for bachelors, PG residents, students, and working professionals. It connects customers with verified tiffin kitchens and supports one-time meals, weekly/monthly subscriptions, skip/pause rules, and operational workflows for admin and kitchen partners.

**Pilot posture:** one tightly bounded locality first — not all of Delhi NCR.

---

## 2. Locked stack decisions

| Layer | Choice | Notes |
|-------|--------|--------|
| Customer mobile | Flutter | Primary customer app |
| Kitchen Partner mobile | Flutter | Partner ops on phone |
| Admin panel | Next.js (React) | Desktop-first ops |
| Public / customer web | Next.js (React) | Browse + light journeys; PWA later if needed |
| API | Node.js (LTS) | Shared business rules for all clients |
| Database | PostgreSQL | Private network in deploy; TLS where supported |
| Auth | Email/password + Phone OTP | MFA for admins (target from Phase 1) |
| Payments | TBD reputable Indian gateway | Hosted/official flow; webhook = payment truth |
| Hosting | Not selected | Decide before staging deploy |

**Money:** store as integer paise (INR).  
**Time:** store UTC in DB; display `Asia/Kolkata` in UI.  
**Delivery (MVP):** manual assignment only.

### Conservative pilot assumptions (changeable)

| Item | Assumption |
|------|------------|
| Locality | Single service area placeholder: `Noida Sector 62` (rename before pilot) |
| Meal slots | `breakfast`, `lunch`, `dinner` |
| Cut-offs (server, Asia/Kolkata) | Breakfast 21:00 previous day · Lunch 09:00 · Dinner 15:00 |
| Skip/pause | Allowed only before slot cut-off; remaining meal balance server-validated |
| Currency | INR |

---

## 3. MVP scope and non-goals

### In scope (pilot)

- Secure auth: email/password + phone OTP; roles `customer`, `kitchen_partner`, `admin`
- Admin: partner review, menus, orders, service areas/slots/cut-offs, support queue, audit log
- Kitchen Partner (Flutter): profile, menu/capacity, daily orders, accept/prep/ready, subscription fulfilment visibility
- Customer (Flutter + Next web browse): browse serviceable kitchens/menus, one-time order, weekly/monthly subscription, skip/pause/resume, order history, basic support ticket, post-delivery rating
- Server-authoritative pricing, taxes, delivery/platform fees, totals
- Payment integration with idempotent webhooks (Phase 4; stub interfaces earlier)
- Manual delivery assignment + proof-of-delivery policy (basic)
- Environments: local + staging separate from production; `.env.example` only in git

### Non-goals (not in MVP)

- Full Delhi NCR coverage / multi-city
- Owned kitchen or owned delivery fleet
- Live GPS tracking
- Heavy analytics, marketing automation, configurable CMS
- Group orders (post-pilot unless explicitly pulled forward)
- Storing raw card details, UPI PINs, or payment credentials
- DIY cryptography or custom password protocols
- Claiming the app is “unhackable”

---

## 4. Proposed repository layout

```
Mealmate/
├── apps/
│   ├── api/                 # Node.js + PostgreSQL API
│   ├── web/                 # Next.js — admin + public/customer web
│   ├── customer_app/        # Flutter — customer
│   └── partner_app/         # Flutter — kitchen partner
├── packages/                # Optional shared OpenAPI types / constants later
├── docs/
│   └── PHASE0_DISCOVERY.md  # this document
├── .env.example
├── .gitignore
└── README.md
```

Monorepo keeps API contracts and security rules in one place. Clients never embed server secrets.

---

## 5. Roles and permission matrix

### Roles

| Role | Surfaces |
|------|----------|
| `customer` | Flutter customer app, Next customer web |
| `kitchen_partner` | Flutter partner app |
| `admin` | Next.js admin panel |
| `delivery` | Out of MVP (schema-ready optional) |

### Permission matrix (server-enforced)

| Action | Customer | Kitchen Partner | Admin |
|--------|----------|-----------------|-------|
| Read own profile / addresses | Yes | Own partner profile | Any (audited) |
| Read other users’ PII | No | No | Yes (least fields needed) |
| Browse kitchens/menus in service area | Yes | Own menu only for edit | Yes |
| Create order / subscription | Yes (self) | No | No (ops adjust via audited tools only if needed later) |
| Accept / prep / ready order | No | Own kitchen’s orders | Override + audit |
| Skip / pause / resume subscription | Own, before cut-off | View only | Override + audit |
| Approve / suspend partner | No | No | Yes + audit |
| Manage service areas / slots / cut-offs | No | No | Yes + audit |
| View payments summary | Own | Own payout summary | Yes |
| Refund approve/reject | No | No | Yes + audit |
| Support tickets | Own create/read | Own-related | Queue manage |
| Audit logs | No | No | Yes |
| Grant self admin/partner | **Never** | **Never** | Admin role only via controlled provisioning |

**Rule:** hiding a UI control is not authorization. Every read/write checks identity + ownership/tenant + role on the server.

---

## 6. State machines

### 6.1 Partner approval

```
draft → submitted → under_review → approved
                              ↘ rejected
approved → suspended → approved (reactivate)
```

### 6.2 Order

```
draft → pending_payment → placed → accepted → preparing → ready → out_for_delivery → delivered
                      ↘ payment_failed
placed / accepted / preparing → cancelled (policy + cut-off)
delivered → (optional) complaint_open
```

Impossible transitions must be rejected server-side.

### 6.3 Payment (separate from order)

```
created → requires_action → succeeded
                        ↘ failed
succeeded → refund_pending → partially_refunded | refunded
```

Client “success screen” is never payment truth. Provider webhook / server verify is truth. Webhooks must be idempotent.

### 6.4 Subscription

```
pending_payment → active → paused → active
active → cancelled
active → expired (meal balance / end date)
```

Per scheduled meal fulfilment (conceptual):

```
scheduled → skipped | paused_day | locked_for_kitchen → fulfilled | failed_delivery | cancelled
```

Cut-off and remaining balance validated on server before skip/pause.

---

## 7. Core domain model / schema plan

Adapt names to migrations; do not duplicate tables later.

### 7.1 Entities

| Entity | Purpose |
|--------|---------|
| `users` / `profiles` | Identity link, contact, status |
| `auth_identities` | email + phone links; no plaintext passwords |
| `roles` / `user_roles` | server-managed role membership |
| `customer_addresses` | PG/flat, landmark, instructions, service area |
| `kitchen_partners` | business profile, approval status, service areas |
| `partner_documents` | private storage references only |
| `service_areas` | pilot locality polygons or pin-code/sector lists |
| `meal_slots` | breakfast/lunch/dinner + cut-off rules |
| `menus` / `menu_items` | items, veg flag, price_paise, allergens, capacity, availability |
| `orders` / `order_items` | immutable price/name snapshots at order time |
| `subscriptions` / `subscription_meals` | plan, dates, balance, skip/pause |
| `payments` / `refunds` | provider refs, amounts, status; no card/UPI secrets |
| `delivery_tasks` | manual assignment, PoD notes |
| `reviews` | after delivered |
| `support_tickets` | customer/partner/admin queue |
| `notifications` | delivery status / account events |
| `audit_logs` | admin/partner-sensitive actions |

### 7.2 Modelling rules

- Money: `INTEGER` paise (or `NUMERIC` with explicit scale — prefer integer paise)
- Timestamps: `TIMESTAMPTZ` UTC
- Enums / check constraints for statuses
- FKs, uniqueness (e.g. idempotency keys), transactions for order+payment+stock/capacity
- Soft delete ≠ retention policy; define retention separately
- Partner documents: private bucket + short-lived signed URLs; minimize ID document retention
- Allergy/dietary: collect minimally; no medical claims in UI copy

### 7.3 Migration plan (order)

1. Users, auth identities, roles  
2. Service areas, meal slots, cut-off settings  
3. Kitchen partners, documents metadata, menus/items  
4. Addresses, orders/items, subscriptions/meals  
5. Payments/refunds  
6. Delivery tasks, reviews, support tickets, notifications  
7. Audit logs  

No undocumented production DB changes. Migrations version-controlled.

---

## 8. Auth flows

### 8.1 Email / password

- Maintained auth library / well-supported hashing (e.g. Argon2id via chosen stack) — **no custom crypto**
- Generic responses on login/reset (reduce enumeration)
- Rate-limit login, register, reset
- Reset tokens: random, short-lived, single-use, stored hashed
- Session/refresh rotation on login, logout, password change, recovery

### 8.2 Phone OTP

- OTP via reputable SMS provider; rate-limit send + verify
- Short TTL; attempt caps; do not log OTP codes
- Link verified phone to user; conflict handling if phone already bound

### 8.3 Sessions (clients)

| Client | Approach |
|--------|----------|
| Next.js admin / web | Prefer HttpOnly + Secure + appropriate SameSite cookies; CSRF strategy for cookie mutations |
| Flutter apps | Access/refresh in platform secure storage (Keychain / Keystore-backed); HTTPS with normal cert validation |

### 8.4 Admin

- Provision admin roles only via controlled process (not self-signup to admin)
- MFA required for admins where supported (Phase 1 target)
- All privileged actions audited

JWTs (if used): verify signature, alg allowlist, iss, aud, exp; decoding ≠ verification; plan rotation/revocation.

---

## 9. Admin Panel Phase 1 — screens and acceptance criteria

Build operational workflows first — not charts/CMS.

| Screen | Purpose | Acceptance criteria |
|--------|---------|---------------------|
| Admin sign-in | Email (and/or OTP) session | Unauthenticated users blocked from all admin routes; failed auth rate-limited; no stack traces to client |
| Dashboard | Operational counts | Shows pending partners, open orders by slot, open tickets; counts from authorized API only |
| Partner review | pending / approved / rejected / suspended | Status change permission-checked + audit row; partner cannot self-approve |
| Customers list | Safe search/filter | Pagination caps; no bulk export by default; PII minimized in list |
| Partners list | Safe search/filter | Same as above |
| Menu review | Availability / approval | Cannot publish another kitchen’s item as different partner; price shown in paise→INR correctly |
| Orders | List + state history | Cross-kitchen visible to admin only; state history immutable append |
| Service config | Areas, slots, cut-offs, cancel/refund policy knobs | Changes audited; clients read effective config from server |
| Support queue | Complaints/tickets | Assign/resolve with audit; customer sees only own tickets |
| Audit log | Sensitive actions | Filterable; append-only from app’s perspective |

**Phase 1 exit:** admin can onboard one test kitchen, configure one service area + slots, see a synthetic order lifecycle end-to-end against API (customer path may still be incomplete UI).

---

## 10. Security threat checklist (baseline)

### Assets

Accounts, PII/addresses, sessions/tokens, orders/subscriptions, payments/refunds, partner documents, admin privileges, DB.

### Actors

Unauthenticated attacker, normal customer, other customer, kitchen partner, malicious/compromised account, automated bot, insider admin misuse.

### Abuse cases to design against

| Abuse | Control direction |
|-------|-------------------|
| IDOR on orders/addresses | Ownership checks every read/write |
| Partner reads another kitchen | Tenant scoping on all partner queries |
| Self-grant admin/partner | Roles only server-side; reject client role fields |
| Client-submitted totals/prices | Server recalculates; ignore client totals |
| Skip after cut-off | Server cut-off + timezone |
| Duplicate order / webhook replay | Idempotency keys; webhook signature + dedupe |
| OTP/password stuffing | Rate limits, lockouts/monitoring |
| XSS / injection | Parameterized SQL; React escaping; no raw HTML |
| Secret leakage in apps | No service keys in Flutter/Next public env |
| SSRF via webhooks/URLs | Allowlists; no blind outbound fetch |
| Enumeration | Generic auth messages |

### Release blockers (from secure skill)

- Protected routes without authz  
- Unrotated leaked secrets  
- TLS verification disabled  
- Public overprivileged DB  
- Critical vuln unresolved  
- No rollback/backup plan for high-impact data changes  

Never label the product “fully secure” after a few tests.

---

## 11. Test plan (Phase 0 → ongoing)

### Always

- Unit: pricing, cut-offs, state transitions, meal balance  
- Integration: API + DB constraints + authz  
- Authorization: User A ↛ User B; Kitchen A ↛ Kitchen B; customer ↛ admin  
- Abuse: malformed input, duplicate submit, stale price, replayed webhook  
- Clients: loading / empty / error / success states  

### Minimum order/subscription cases (implement with features)

1. Successful order + verified payment  
2. Payment failure + retry  
3. Duplicate submit + duplicate webhook  
4. Menu unavailable during checkout  
5. Price change between browse and checkout  
6. Kitchen reject/cancel  
7. Cancel before/after cut-off  
8. Skip before/after cut-off  
9. Pause/resume + remaining meal count  
10. Refund request approve/reject + reconcile  
11. Delivered + complaint  
12. Service area / slot unavailable  
13. Cross-account and cross-partner access attempts (must fail)  

Record results as `PASS` / `FAIL` / `NOT RUN` / `NOT VERIFIED`.

---

## 12. Phase roadmap (post-approval)

| Phase | Focus | Primary surfaces |
|-------|--------|------------------|
| **0** | This discovery + repo skeleton + initial migrations after approval | docs + scaffolding |
| **1** | Admin foundation | Next.js + API |
| **2** | Kitchen Partner | Flutter partner + API |
| **3** | Customer MVP | Flutter customer + Next browse |
| **4** | Payments + manual delivery ops | API + clients |
| **5** | Pilot one locality → measure → expand | ops |

Working method: small vertical slices (UI + API + DB rules + tests). No giant unreviewed dump.

---

## 13. Environments and secrets

| Env | Data | Credentials |
|-----|------|-------------|
| Local | Synthetic only | Developer secrets, not production |
| Staging | Synthetic / anonymized | Separate from prod |
| Production | Real | Separate store; least privilege |

- Commit `.env.example` placeholders only  
- Never commit `.env`, keys, dumps with PII  
- If a secret leaks: revoke/rotate, do not only delete the file  

Hosting, SMS OTP provider, and payment gateway brands: **owner decision before Phase 4 / staging**.

---

## 14. Open questions for owner

1. Confirm or rename pilot locality (`Noida Sector 62` placeholder).  
2. Confirm cut-off times for B/L/D.  
3. Preferred Node framework: **NestJS** (structure) vs **Fastify** (lean) vs **Express** — recommend **NestJS** or **Fastify + strict schema validation** for maintainability.  
4. Payment gateway preference (Razorpay / Cashfree / other).  
5. SMS OTP provider preference.  
6. Hosting preference (when ready): single VPS vs managed (Railway/Fly/Render) + managed Postgres.  
7. Should Next customer web support full checkout in MVP, or browse + “continue in app” only?

---

## 15. Recommended Node API shape (proposal)

- Versioned HTTP API: `/v1/...`  
- Strict request validation (e.g. Zod / class-validator)  
- Central authn/authz middleware  
- Helmet (or equivalent), explicit CORS allowlist for web origins; mobile apps are not protected by CORS  
- Body size limits, timeouts, pagination caps, rate limits on auth/order/OTP  
- Correlation IDs; safe error messages in production  
- Health endpoints without sensitive config  

---

## 16. Definition of done — Phase 0

Phase 0 is done when:

- [x] Discovery report written (this doc)  
- [ ] Owner approves MVP scope, stack, assumptions (or records changes)  
- [ ] Open questions answered or explicitly deferred  
- [ ] Repo scaffolding + `.gitignore` + `.env.example` + README started (**after approval**)  
- [ ] Initial migration set authored only after workflow mapping sign-off  

**This document alone does not implement the app.** No tests/scans run (`NOT RUN`). No hosting verified (`NOT VERIFIED`).

---

## 17. Next smallest step after approval

1. Answer open questions §14 (or accept recommendations).  
2. Scaffold monorepo: `apps/api`, `apps/web`, `apps/customer_app`, `apps/partner_app`.  
3. Implement auth + roles schema migration + admin sign-in vertical slice (Phase 1 start).  
4. Add CI: lint, typecheck, unit tests, dependency audit placeholders.

---

### Verification (honesty)

| Item | Result |
|------|--------|
| Code implemented | N/A — discovery only |
| Tests / scans | `NOT RUN` |
| Hosting / providers | `NOT VERIFIED` |
| Security of running system | `NOT VERIFIED` (nothing deployed) |

### Release recommendation

**READY FOR REVIEW** — approve or amend this plan before scaffolding and migrations.
