---
name: mealmate-ncr-app-builder
description: Build a secure, maintainable bachelor/PG daily tiffin marketplace in small, tested increments. Use for planning, coding, reviewing, testing, or modifying the customer app, admin panel, kitchen partner panel, subscriptions, meal orders, payments, and delivery workflows.
---

# MealMate NCR App Builder Skill

## Mission

Build a reliable daily-meal marketplace for bachelors, PG residents, students, and working professionals. The platform connects customers with verified tiffin kitchens and supports daily meals, weekly/monthly meal subscriptions, skip/pause rules, group orders, and order operations.

Priorities, in order:
1. Correct and safe business workflows.
2. Security and privacy.
3. Reliable order/subscription/payment data.
4. Accessible, responsive, understandable UX.
5. Automated tests and maintainable code.
6. Fast delivery without unnecessary complexity.

Never promise that an app is impossible to attack. Reduce risk using layered controls, secure defaults, testing, monitoring, and incident response.

## Product assumptions

Unless the project owner changes them:
- Launch with one tightly bounded locality, not all Delhi NCR at once.
- Start with a marketplace of existing kitchens; do not build an owned kitchen or fleet into MVP.
- Build the Admin Panel foundation first, then the Kitchen Partner Panel, then the Customer ordering flow. A basic customer order journey must be validated early; do not spend months building admin features before customer testing.
- Use a responsive web app/PWA for the lowest-cost pilot. If the owner chooses React Native/Expo, keep business rules and API contracts reusable.
- Use a managed backend such as Supabase/Postgres where appropriate. Do not hard-code a vendor if the existing repository already uses a different stack.
- Delivery assignment can be manual in the first pilot.
- Payment provider integration must use a reputable provider's hosted/official flow. Never store raw card details, UPI PINs, passwords, or payment credentials.

## Required working method

### Before changing code
1. Inspect the repository, README, package files, existing architecture, environment configuration, and current tests.
2. Identify the current framework, package manager, database, auth provider, and deployment target. Do not replace working technology without a clear reason.
3. Summarize the requested change, assumptions, affected modules, security implications, and acceptance criteria.
4. Break work into small, reviewable steps. Ask one concise question only when an unknown materially blocks safe implementation; otherwise state a conservative assumption and proceed.
5. Never claim code was run, tested, deployed, or verified unless it actually was.

### Implementation rules
- Prefer small changes over large rewrites.
- Keep UI, business logic, database access, and external-service integrations separated.
- Use strict types where the stack supports them. Avoid `any` and unsafe casts unless justified.
- Validate inputs on the server, even if the UI validates them too.
- Enforce authorization server-side on every protected operation. Hiding a button is not authorization.
- Use database constraints and transactions for critical invariants.
- Add loading, empty, error, retry, and success states.
- Add useful logs without passwords, access tokens, payment secrets, or unnecessary personal data.
- Use environment variables for secrets. Commit only `.env.example` with placeholder names, never real credentials.
- Keep migrations version-controlled. Never make undocumented production database changes.
- Do not add dependencies without explaining why and checking maintenance/security implications.
- Do not introduce mock data into production paths. Clearly label demo fixtures.
- Do not implement unrelated features while completing a task.

## Panel and delivery roadmap

### Phase 0 — Foundation and discovery
- Define MVP scope, target locality, delivery windows, meal cut-off times, refund/skip policies, and partner onboarding process.
- Inspect the repository and document the chosen architecture.
- Create environments for local development and staging; production must be separate.
- Define roles and data ownership before implementing screens.
- Create initial schema and migrations only after mapping workflows.
- Establish linting, formatting, type checks, unit tests, and CI if practical.

### Phase 1 — Admin Panel foundation (build first)
Implement only operationally necessary capabilities:
- Secure admin sign-in and session handling.
- Role-aware dashboard with operational counts.
- Kitchen partner review: pending, approved, rejected, suspended.
- Customer and partner list with safe search/filtering.
- Meal/menu review and availability status.
- View orders and order state history.
- Manage basic service areas, delivery slots, cut-off settings, and cancellation/refund requests.
- Complaint/support queue and audit log.
- Admin actions must be permission-checked and audited.

Do not start with charts, marketing automation, complex analytics, or a large configurable CMS. Build usable workflows first.

### Phase 2 — Kitchen Partner Panel
- Partner profile and business/contact details.
- Onboarding document/status workflow; restrict document visibility.
- Menu items, meal types, price, description, allergens where known, availability, daily capacity, and service area.
- Daily order list with totals by meal/slot.
- Order acceptance and preparation/ready status.
- Subscription fulfilment list and pause/skip visibility.
- Payout summary and dispute view; payout calculations must be traceable.
- Prevent partners from reading other partners' customers, orders, documents, or revenue.

### Phase 3 — Customer ordering MVP
- Browse serviceable kitchens and available menus.
- Filter by meal type, veg/non-veg, price, and relevant dietary tags.
- Customer profile, address/PG name, room/flat, landmark, and delivery instructions.
- One-time meal order.
- Weekly/monthly subscription with clear meal count, service dates, price, exclusions, and cancellation/skip cut-off.
- Skip/pause/resume according to explicit policy; server validates cut-off and remaining meal balance.
- Order status, order history, support/complaint entry, and ratings after completed orders.
- Display taxes, delivery fees, platform fees, cancellation terms, and total before confirmation.
- Accessible mobile-first layout.

### Phase 4 — Payments and operations
- Integrate the chosen payment gateway using its official server-side verification/webhook process.
- Treat the provider's verified server event as payment truth; do not trust a client success screen.
- Make payment callbacks/webhooks idempotent.
- Record payment attempts, provider reference, amount, currency, status, timestamps, and refunds without storing sensitive payment credentials.
- Keep order state and payment state separate.
- Handle duplicate callbacks, failed payments, delayed confirmations, partial refunds, and reconciliation.
- Start with manual delivery assignment and proof-of-delivery policy. Add live tracking only if validated by actual operational need.

### Phase 5 — Pilot and controlled growth
- Run internal tests with demo data, then a small real pilot in one locality.
- Measure repeat orders, on-time delivery, complaints, cancellations, contribution per order, and customer acquisition cost.
- Expand geography only when kitchen coverage, delivery reliability, and unit economics support it.

## Core domain model

Adapt to the existing schema; do not blindly create duplicate tables.

Likely entities:
- `profiles` / `users`
- `roles` or role claims managed securely
- `customer_addresses`
- `kitchen_partners`
- `partner_documents` (private storage)
- `service_areas`
- `menus`
- `menu_items`
- `meal_slots`
- `orders`
- `order_items`
- `subscriptions`
- `subscription_meals` or scheduled fulfilments
- `payments`
- `refunds`
- `delivery_tasks`
- `reviews`
- `support_tickets`
- `notifications`
- `audit_logs`

Important modelling rules:
- Store money as integer minor units (for INR, paise) or a well-defined decimal type; never use floating point for monetary calculations.
- Store timestamps consistently (UTC in database where practical) and render the agreed local time zone (`Asia/Kolkata`) in UI.
- Keep immutable order-time snapshots of item name, price, quantity, and relevant terms so later menu edits do not rewrite order history.
- Use explicit enums/state machines for order, payment, partner approval, and subscription states.
- Use foreign keys, uniqueness constraints, check constraints, and transactions where appropriate.
- Soft deletion is not a substitute for a retention policy.
- Do not store sensitive identity documents unless necessary; define access and retention rules.

## Authorization and security baseline

### Identity and roles
- Use a trusted authentication provider or securely implemented framework authentication.
- Never implement password storage from scratch.
- Roles should include at least `customer`, `kitchen_partner`, `admin`; delivery role can be added if needed.
- A user must not be able to grant themselves admin/partner status by changing a request body, local storage, JWT metadata they control, or a client-side flag.
- Enforce least privilege and deny access by default.
- Require MFA for admins where supported; use strong session handling and revoke sessions on sensitive account changes.
- Protect account recovery and login endpoints against abuse using provider-supported rate limits and abuse controls.

### Database and API
- Apply Row Level Security (RLS) or equivalent server-side authorization to every table exposed to clients.
- Test both allowed and denied access for every role.
- Customer can read only their own profile, addresses, orders, subscriptions, payments summary, and tickets.
- Kitchen partner can access only their own partner record, menu, assigned orders, fulfilments, and permitted payout data.
- Admin endpoints must verify trusted server-side role membership.
- Never expose service-role keys, database admin credentials, signing secrets, or private API keys in frontend bundles.
- Use parameterized queries/ORM protections. Never concatenate untrusted input into SQL.
- Validate schema, length, type, allowed enum values, ownership, price, quantities, serviceability, and state transitions on the server.
- Apply rate limits to login, OTP, order creation, coupon use, reviews, and support endpoints.
- Use pagination and bounded query limits; do not allow arbitrary bulk exports by default.
- Avoid exposing whether a phone number/account exists in ways that enable enumeration.
- Add CORS/CSRF protections appropriate to the authentication model.

### Orders, subscriptions, and money
- Calculate authoritative price, discounts, taxes, fees, delivery charges, and totals on the server.
- Never accept client-submitted totals as authoritative.
- Use idempotency keys or unique request references for order/payment creation.
- Make state transitions explicit and reject impossible transitions.
- Use transactions/locking or equivalent protection against duplicate subscription fulfilment and overbooking.
- Define time-zone-aware meal cut-offs on the server.
- Prevent double-spend of meal credits, duplicate refunds, duplicate orders, and replayed webhooks.
- Verify webhook signatures and amounts against the provider's server-side records.
- Keep audit history for admin changes, refunds, partner status, price changes, and subscription adjustments.
- Use least-privilege access to payment and payout records.

### Personal data and operations
- Collect only data needed to fulfil meals and support customers.
- Do not log OTPs, passwords, auth tokens, full addresses, private documents, or payment secrets.
- Restrict document storage to private buckets and short-lived signed access where needed.
- Define data retention, deletion, export, consent, privacy notice, and incident response processes.
- Use HTTPS in deployed environments; secure cookies and headers for web deployments.
- Keep dependencies updated and scan for known vulnerabilities.
- Back up the database and test restoration.
- Separate development, staging, and production credentials and data.
- Never use real customer data in development fixtures.
- Food allergy and dietary details may be sensitive; collect minimally, restrict access, and avoid making medical promises.

## Testing requirements

For every feature, add or update tests appropriate to the stack:
1. Unit tests for business rules, price calculations, subscription cut-offs, and state transitions.
2. Integration tests for database policies, APIs, transactions, payment verification, and webhooks.
3. Authorization tests for every role, including cross-user/cross-kitchen access attempts.
4. UI tests for loading, empty, error, validation, and successful flows.
5. Regression tests for affected features.
6. Accessibility checks: labels, focus, keyboard support, contrast, touch targets, and screen-reader semantics.
7. Abuse cases: malformed input, repeated requests, stale prices, duplicate callbacks, unauthorized ID changes, and boundary dates.
8. A test must fail if a customer can view another customer's order or a kitchen can view another kitchen's records.

Minimum order flow tests:
- Successful order with verified payment.
- Payment failure and retry.
- Duplicate submit and duplicate webhook.
- Menu becomes unavailable during checkout.
- Price changes between browse and checkout.
- Kitchen rejects/cancels an order.
- Customer cancellation before/after cut-off.
- Skip subscription meal before/after cut-off.
- Pause/resume subscription and verify remaining meal count.
- Refund requested, approved/rejected, and reconciled.
- Order delivered and complaint submitted.
- Service area and delivery slot unavailable.
- Cross-account and cross-partner authorization attempts.

## Definition of done

A task is not complete until:
- Acceptance criteria are met.
- Relevant tests, lint, and type checks are run where available.
- Authorization and validation are implemented server-side.
- Loading, empty, error, and success states are present.
- No secrets or sensitive personal data are committed or logged.
- Database changes have migrations and are documented.
- README/configuration is updated where needed.
- Limitations and any tests not run are stated honestly.
- No unrelated scope was silently added.

## AI coding tool behaviour

When asked to implement a feature:
1. Inspect before editing.
2. State a short plan and list files likely to change.
3. Implement one vertical slice at a time (UI + API + database policy + tests), not a fake UI disconnected from backend.
4. Show exact commands to run and required environment variable names, with placeholder values only.
5. Run available tests/checks; report the actual result.
6. Review the diff for security, data leakage, authorization gaps, and unnecessary complexity.
7. End with: what changed, how to test it, known gaps, and the next smallest step.

If asked to “build the whole app at once,” break it into phases and start with the smallest production-shaped slice. Do not generate a huge unreviewed code dump.

## First task for a new repository

Start with a discovery report, then propose:
- MVP scope and non-goals.
- Stack based on the existing repo and budget.
- Role/permission matrix.
- Order and subscription state diagrams.
- Database schema/migration plan.
- Admin Panel Phase 1 screens and acceptance criteria.
- Security threat checklist.
- Test plan.

Do not begin large-scale implementation until the owner approves the plan or the repository clearly establishes it.
