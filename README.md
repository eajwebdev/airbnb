# EAJ Booking Platform

A single Laravel 12 application with React, TypeScript, Inertia, Vite, and Tailwind under `resources/js`. It is an in-progress Philippine hospitality booking SaaS. The core booking path, demo access, tenant-scoped operations, and subscription gating are implemented; see **Current scope** below before using it in production.

## Local setup

Requirements: PHP 8.2+, Composer, Node 22+, and MySQL 8+ or MariaDB. This checkout was verified on PHP 8.2 and Node 22.

```powershell
Copy-Item .env.example .env
composer install
npm install
php artisan key:generate
```

Create a MySQL database named `eaj_booking`, set `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` in `.env`, then run:

```powershell
php artisan migrate --seed
npm run build
php artisan serve
```

On Windows PowerShell with script execution disabled, use `npm.cmd` and `npx.cmd`. For a quick local trial without MySQL, set `DB_CONNECTION=sqlite` and create `database/database.sqlite` before migrating. The repository's `.env.example` targets MySQL; the local development `.env` used during implementation targets SQLite because this workstation's MySQL account requires credentials that were not supplied.

The Laravel scheduler should run every minute in deployment (`php artisan schedule:run` via cron or Task Scheduler). It expires booking holds and subscription access. Queue workers are needed as notification jobs are added.

## Demo

Set `DEMO=true` in `.env` and run `php artisan db:seed`. The seed is repeatable and fills two tenants, four published properties, seven rooms, five sample bookings, price snapshots, three payment records, and a maintenance block. With `DEMO=false`, a normal seed creates only the monthly and annual plans. Demo credentials are never seeded by `DatabaseSeeder` in production.

The login page offers one-click access for:

| Role | Email | Password for development |
| --- | --- | --- |
| Superadmin | `superadmin@example.com` | `Password123!` |
| Administrator | `admin@example.com` | `Password123!` |
| Staff | `staff@example.com` | `Password123!` |
| Guest | `guest@example.com` | `Password123!` |

The second tenant has `admin2@example.com` with the same development password for tenant isolation checks.

Change these passwords or omit the demo seed in a real deployment. `DEMO=false` hides the cards and makes `POST /demo/login` return 404. The demo endpoint accepts only the four approved role names and is rate limited.

## Current scope

The platform quotation is an in-app page at `/quotation` (also reachable by opening `/quote` in a browser). Its monthly base price, website options, and add-on prices are defined near the top of `resources/js/Pages/Public/Quotation.tsx` for later editing. The `/quote` endpoint still returns room price calculations to the stay page when called with booking parameters.

- Public landing page, stay search, property page, guest checkout, price snapshot, manual payment request, and mock payment confirmation.
- Guest registration and login, role dashboards, tenant-scoped property and room creation, manual bookings, booking status changes, manual payment records, and superadmin client onboarding, status, and plan assignment.
- Server-side availability with room quantity, date blocks, temporary holds, same-day turnover, row locking during booking creation, and subscription checks.
- Monthly plan at ₱3,499 and annual plan at ₱29,988 billed yearly (₱2,499 monthly equivalent, ₱12,000 annual savings). Subscription records snapshot billing values.
- Local Philippine defaults: PHP currency and Asia/Manila timezone.

The mock provider is a local test flow only and does not charge a card. Manual payments require staff verification. Public imagery currently uses remote placeholder photography; replace it with licensed property photos before launch. The supplied `eaj-primary.png` is used in platform branding. `eaj-watermark.png` was not found in the provided folder or local EAJ assets.

## Named route groups

`home`, `stays.index`, `stays.show`, `bookings.store`, `checkout.show`, `checkout.pay`, `booking.success`, `login`, `register`, `account.bookings`, `admin.*`, `superadmin.*`.

## Verification

```powershell
php artisan test
php artisan route:list
npx.cmd tsc --noEmit
npm.cmd run build
```

Tests cover repeatable seeding, the public catalog, authentication, role access, tenant isolation, booking overlap and turnover, blocked dates, pricing, mock and manual payments, booking transitions, plan price snapshots, client locking, and expiry commands.

## Remaining work before production

The master prompt calls for more than this initial critical path. Still needed: password reset and email verification, property image uploads and white-label public sites, promo and seasonal pricing, reviews, calendar, reports and CSV export, notification templates and subscription reminders, audit coverage for every sensitive action, custom subscription pricing, real payment provider integration, responsive visual QA in a browser, comprehensive MySQL integration testing, and deployment hardening. The in-app browser connection was unavailable during this build, so pages were verified by HTTP responses and frontend build rather than visual screenshots.
