# FINAL MASTER PROMPT — EAJ Premium Booking SaaS
## Laravel Monolith + React/Inertia + MySQL

You are a senior Laravel architect, React/TypeScript engineer, SaaS product engineer, database designer, security engineer, and premium UI/UX designer.

Your task is to BUILD a complete, production-oriented, premium Philippine accommodation booking SaaS inside the CURRENT EMPTY FOLDER.

This project must be a **single Laravel application**.

Do **NOT** create separate `frontend/` and `backend/` applications.

The React frontend must live inside Laravel under `resources/js`.

Use Laravel as the only backend, routing layer, authentication layer, business-logic layer, and application server.

Actually:
- create all project files
- initialize Laravel in the current folder
- install Composer and npm dependencies
- configure React + TypeScript + Inertia
- configure MySQL
- create migrations
- create models
- create services
- create policies
- create controllers
- create Inertia pages
- create reusable UI components
- create seeders
- create tests
- run migrations
- run tests
- run frontend build
- fix all errors
- continue phase by phase until the critical MVP works

Do not stop after scaffolding.

---

# 1. PRODUCT GOAL

Build a premium online accommodation booking SaaS for Philippine businesses such as:

- hotels
- resorts
- transient houses
- villas
- apartments
- vacation rentals
- guest houses
- boutique accommodations

The platform owner is:

**EAJ WEB DEVELOPMENT SERVICES**

The system must support:

1. Public accommodation booking website
2. Guest accounts
3. Client/tenant admin dashboard
4. Staff dashboard
5. Superadmin platform dashboard
6. Multi-tenant architecture
7. Subscription management
8. Demo mode
9. One-click demo login
10. Property and room management
11. Availability engine
12. Booking engine
13. Payment architecture
14. Booking calendar
15. Reports
16. Notifications
17. Audit logs
18. White-label client branding
19. Premium responsive UI
20. Philippine Peso and Asia/Manila defaults

---

# 2. REQUIRED TECH STACK

## Application

Use a single Laravel application.

Use:

- Laravel latest stable
- PHP supported by current Laravel
- MySQL
- Laravel Eloquent ORM
- Laravel Breeze or equivalent Laravel-native authentication foundation where appropriate
- Laravel Sanctum only if needed for future API/mobile integrations
- Laravel Policies
- Laravel Gates
- Laravel Form Requests
- Laravel Events
- Laravel Listeners
- Laravel Notifications
- Laravel Mail
- Laravel Queues
- Laravel Scheduler
- Laravel Storage
- Laravel Cache
- Laravel Rate Limiting

## Frontend inside Laravel

Use:

- Inertia.js
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui or shadcn-compatible React components
- React Hook Form where beneficial
- Zod where beneficial
- date-fns
- Lucide icons
- Recharts
- Framer Motion only for tasteful micro-interactions

The React application MUST live under:

```text
resources/js/
```

Recommended structure:

```text
resources/js/
├── app.tsx
├── Pages/
│   ├── Public/
│   ├── Auth/
│   ├── Guest/
│   ├── Admin/
│   └── Superadmin/
├── Components/
│   ├── ui/
│   ├── booking/
│   ├── property/
│   ├── admin/
│   ├── superadmin/
│   └── shared/
├── Layouts/
├── Hooks/
├── Lib/
├── Types/
└── Utils/
```

Use Laravel routes and Inertia responses instead of a separate Next.js application.

## Do not use

Do NOT use:

- Next.js
- a separate React SPA repository
- separate `/frontend` and `/backend` folders
- Prisma
- Express
- Supabase as the primary database
- Firebase as the primary database
- MongoDB

---

# 3. REQUIRED PROJECT STRUCTURE

Initialize Laravel directly in the CURRENT EMPTY FOLDER.

The root should look similar to:

```text
app/
bootstrap/
config/
database/
public/
resources/
├── css/
├── js/
│   ├── app.tsx
│   ├── Pages/
│   ├── Components/
│   ├── Layouts/
│   ├── Hooks/
│   ├── Lib/
│   ├── Types/
│   └── Utils/
└── views/
routes/
storage/
tests/
.env.example
artisan
composer.json
package.json
vite.config.*
README.md
```

Do not create a second application inside the Laravel repository.

---

# 4. APPLICATION ARCHITECTURE

Use this architecture:

```text
Browser
   ↓
Laravel Routes
   ↓
Controllers / Form Requests / Policies
   ↓
Service Layer
   ↓
Eloquent ORM
   ↓
MySQL
   ↓
Inertia Responses
   ↓
React + TypeScript in resources/js
```

All critical business logic must remain in Laravel.

React must never perform direct database operations.

Use Inertia for normal application navigation and form workflows.

Use JSON endpoints only where asynchronous UI behavior genuinely benefits from them, such as:

- availability checks
- calendar data
- dependent selects
- lightweight search suggestions
- payment callbacks/webhooks
- future mobile/API integrations

Do not unnecessarily build the entire app as a REST API when Inertia can handle the workflow cleanly.

---

# 5. BACKEND CODE ORGANIZATION

Keep controllers thin.

Use service classes such as:

```text
app/Services/
├── AvailabilityService.php
├── BookingService.php
├── PricingService.php
├── PaymentService.php
├── PromoService.php
├── CancellationService.php
├── SubscriptionService.php
├── TenantService.php
└── AuditService.php
```

Use:

```text
app/Http/Controllers/
app/Http/Requests/
app/Models/
app/Policies/
app/Notifications/
app/Events/
app/Listeners/
app/Jobs/
```

Do not put large business workflows directly in controllers or React components.

---

# 6. EAJ BRANDING

Use the supplied EAJ logo assets.

Expected assets:

```text
eaj-primary.png
eaj-watermark.png
```

Do not redraw, regenerate, approximate, distort, or replace them.

Copy them into Laravel's public assets, for example:

```text
public/branding/eaj-primary.png
public/branding/eaj-watermark.png
```

Create reusable React logo components.

Use `eaj-primary.png` for:

- EAJ SaaS landing page
- platform login
- pricing page
- superadmin portal
- major platform branding

Use `eaj-watermark.png` for:

- compact sidebar branding
- subtle watermark
- loading state
- login decoration
- favicon/app-icon inspiration where appropriate

Maintain aspect ratio.

---

# 7. EAJ COLOR PALETTE

Use:

```text
Deep Navy:       #0A1134
EAJ Pink:        #F3176C
Steel Blue Gray: #6B7793
White:           #FDFDFD
Black:           #000000
```

Create CSS design tokens in the main stylesheet.

Example:

```css
--brand-navy: #0A1134;
--brand-pink: #F3176C;
--brand-slate: #6B7793;
--brand-white: #FDFDFD;
--brand-black: #000000;
```

Also define semantic tokens:

```css
--background
--foreground
--surface
--surface-muted
--border
--primary
--primary-hover
--accent
--success
--warning
--danger
```

Do not make the whole product pink.

Use EAJ pink strategically for:

- CTA buttons
- selected states
- active navigation
- highlights
- badges
- pricing emphasis
- hover/focus accents

Use navy, white, gray, and slate for most surfaces.

The result should feel premium, corporate, hospitality-focused, and commercial.

---

# 8. WHITE-LABEL STRATEGY

EAJ branding is the PLATFORM branding.

Tenant/client branding is the HOTEL/RESORT branding.

Each client should be able to configure:

- business name
- logo
- favicon
- primary color
- secondary color
- phone
- email
- address
- property images
- public website text

Do not hard-code EAJ as a hotel/resort name.

Prepare the system for future custom domains/subdomains.

---

# 9. USER ROLES

Implement:

```text
SUPERADMIN
ADMIN
STAFF
GUEST
```

## SUPERADMIN

EAJ/developer/platform owner.

Has all platform-wide permissions.

## ADMIN

Belongs to a tenant.

Manages only that tenant's business data.

## STAFF

Belongs to a tenant.

Operational permissions only.

## GUEST

Customer booking role.

Use server-side Policies/Gates.

Never rely only on frontend role checks.

---

# 10. TENANT ARCHITECTURE

Create:

```text
Tenant
```

Recommended fields:

```text
id
name
slug
business_name
business_email
business_phone
status
logo
favicon
primary_color
secondary_color
subscription_status
subscription_started_at
subscription_ends_at
trial_ends_at
locked_at
created_at
updated_at
```

ADMIN and STAFF belong to one tenant.

SUPERADMIN does not need a tenant.

All tenant-owned records must be securely scoped.

Tenant-owned examples:

- properties
- rooms
- bookings
- payments
- promo codes
- reviews
- business settings
- staff
- notifications

Do not trust a tenant ID from form input.

Determine tenant context on the server from the authenticated user or secure route context.

Prevent cross-tenant leakage in:

- controllers
- service classes
- policies
- query scopes
- exports
- calendar endpoints
- reports

Write tests specifically for tenant isolation.

---

# 11. DEMO MODE

Add to `.env.example`:

```env
DEMO=false
```

Support:

```env
DEMO=true
```

Map it through:

```text
config/platform.php
```

Example:

```php
'demo_mode' => env('DEMO', false),
```

Outside config files, use:

```php
config('platform.demo_mode')
```

When `DEMO=true`:

- show Quick Demo Access on login
- enable demo login route
- optionally display "Demo Environment"

When `DEMO=false`:

- hide demo login UI
- backend demo login route must reject access

Do not depend on JavaScript-only hiding.

---

# 12. ONE-CLICK DEMO LOGIN

When demo mode is enabled, show:

## Quick Demo Access

Options:

```text
Superadmin
Platform management

Administrator
Property management

Staff
Booking operations

Guest
Customer experience
```

A click should authenticate the chosen seeded demo account without typing a password.

Implement a Laravel POST route such as:

```text
POST /demo/login
```

Accept only an approved role identifier:

```text
superadmin
admin
staff
guest
```

Map internally to seeded accounts.

Do not accept arbitrary email, password, or user ID.

Rate-limit the route.

Redirect to the correct dashboard after login.

When demo mode is false, reject the route with 404 or 403.

---

# 13. DEMO USERS

Seed:

```text
superadmin@example.com
admin@example.com
staff@example.com
guest@example.com
```

Development password:

```text
Password123!
```

Document that it is development-only.

---

# 14. SUBSCRIPTION PRICING

Default platform plans:

## Monthly

```text
₱3,499/month
```

Billing interval:

```text
MONTHLY
```

Commitment:

```text
1 month
```

## Annual — Best Value

Marketing:

```text
₱2,499/month equivalent
```

Actual billing:

```text
₱29,988/year
```

Normal yearly value:

```text
₱3,499 × 12 = ₱41,988
```

Savings:

```text
₱12,000/year
```

Discount percentage:

```text
approximately 28.58%
```

Important:

The annual subscription is billed as:

```text
Billing interval: ANNUAL
Commitment: 12 months
Billing amount: ₱29,988
Effective monthly price: ₱2,499
```

Do not model it as a ₱2,499 cancellable monthly plan.

---

# 15. SUBSCRIPTION PLAN MODEL

Create:

```text
SubscriptionPlan
```

Suggested fields:

```text
id
name
code
description
billing_interval
base_monthly_price
effective_monthly_price
billing_price
commitment_months
discount_type
discount_value
active
featured
created_at
updated_at
```

Billing interval:

```text
MONTHLY
ANNUAL
CUSTOM
```

Discount type:

```text
NONE
FIXED
PERCENTAGE
```

---

# 16. SUBSCRIPTION MODEL

Create:

```text
Subscription
```

Suggested fields:

```text
id
tenant_id
subscription_plan_id
status
starts_at
ends_at
renewal_at
billing_interval
commitment_months
base_price
discount_type
discount_value
effective_price
billing_total
notes
created_by
created_at
updated_at
```

Snapshot pricing in the subscription record.

Future plan price changes must not silently modify existing client contracts.

---

# 17. CUSTOM SUBSCRIPTIONS

SUPERADMIN can configure:

- 1 month
- 3 months
- 6 months
- 12 months
- 24 months
- custom commitment if allowed

Superadmin can set:

- base monthly price
- fixed discount
- percentage discount
- effective monthly rate
- billing total
- start date
- end date
- renewal date
- notes

Example:

```text
Base monthly:      ₱3,499
Discount:          ₱500/month
Effective monthly: ₱2,999
Commitment:        12 months
```

Calculate totals automatically.

---

# 18. SUBSCRIPTION STATES

Support:

```text
ACTIVE
TRIAL
PAST_DUE
EXPIRED
LOCKED
SUSPENDED
CANCELLED
```

Contract commitment and account lock are separate concepts.

If tenant is locked/suspended/expired:

- block protected admin functions
- block staff protected functions
- preserve data
- SUPERADMIN still has access

Recommended public behavior:

- client public website remains viewable
- new bookings disabled
- show a neutral unavailable-booking message
- do not expose billing details publicly

Enforce server-side via middleware/service/policies.

---

# 19. SUBSCRIPTION REMINDERS

Use Laravel Scheduler and notifications.

Prepare reminders:

```text
30 days before expiry
14 days
7 days
3 days
1 day
Expired
```

Prevent duplicate reminders.

---

# 20. PLATFORM LANDING PAGE

Create a premium EAJ marketing page.

This is a major sales page.

Sections:

1. Premium navigation
2. Cinematic hero
3. Core value proposition
4. Booking platform preview
5. Features
6. Business types supported
7. Why EAJ
8. Pricing
9. Annual savings
10. FAQ
11. CTA
12. Premium footer

Use the supplied EAJ logo.

Suggested hero copy:

```text
Powering Better Stays.
Built for Modern Philippine Hospitality.
```

CTA examples:

```text
Explore the Platform
View Pricing
Try the Demo
```

Use premium imagery and sophisticated typography.

Avoid generic template appearance.

---

# 21. PUBLIC CLIENT BOOKING WEBSITE

Create public Inertia pages such as:

```text
/
stays
stays/{slug}
checkout/{booking}
booking/success/{reference}
login
register
forgot-password
account
account/bookings
account/bookings/{reference}
account/profile
contact
about
terms
privacy
```

Use Laravel named routes.

Keep all React pages under:

```text
resources/js/Pages/
```

---

# 22. PUBLIC HOMEPAGE DESIGN

Create:

## Navigation

- client logo
- Stays
- Offers
- About
- Contact
- Sign In
- Book a Stay

## Hero

- cinematic accommodation image
- premium headline
- description
- booking search

Search fields:

```text
Destination / Property
Check-in
Check-out
Guests
```

## Featured Stays

Premium cards with:

- image
- property name
- location
- rating
- reviews
- amenities
- capacity
- price
- CTA

## Explore Locations

Use examples:

- Boracay
- Palawan
- Siargao
- Cebu
- Bohol
- Bacolod
- Dumaguete
- Tagaytay

## Benefits

- Secure booking
- Verified stays
- Local support
- Flexible payments

## Promotions

## Testimonials

## CTA

## Footer

---

# 23. SEARCH PAGE

Create:

```text
/stays
```

Filters:

- location
- dates
- guests
- price
- property type
- amenities
- rating

Sorting:

```text
Recommended
Price Low to High
Price High to Low
Rating
Newest
```

Desktop:

- sidebar filters
- property results

Mobile:

- filter sheet/modal

Add:

- skeletons
- empty states
- validation
- responsive layout

---

# 24. PROPERTY DETAIL PAGE

Create:

```text
/stays/{slug}
```

Include:

- image gallery
- lightbox
- title
- location
- rating
- reviews
- amenities
- description
- rooms/units
- policies
- check-in/check-out
- map placeholder
- related stays

Desktop:

Use a sticky booking panel.

Booking panel:

- dates
- guests
- room
- nightly rate
- fees
- discount
- taxes
- total
- Reserve button

---

# 25. BOOKING FLOW

Implement:

```text
Search
→ Property
→ Room
→ Dates
→ Guest Details
→ Price Summary
→ Checkout
→ Payment
→ Confirmation
```

Support guest checkout if practical.

---

# 26. BOOKING STATUSES

Use:

```text
PENDING
AWAITING_PAYMENT
PAID
CONFIRMED
CHECKED_IN
CHECKED_OUT
COMPLETED
CANCELLED
NO_SHOW
EXPIRED
```

---

# 27. PAYMENT STATUSES

Use:

```text
UNPAID
PENDING
PARTIALLY_PAID
PAID
FAILED
REFUNDED
PARTIALLY_REFUNDED
```

---

# 28. PAYMENT METHODS

Prepare architecture for:

- GCash
- Maya
- Visa
- Mastercard
- Bank Transfer
- Cash
- Manual Payment

For MVP:

- implement Manual Payment
- implement Mock/Test Payment

Create a payment abstraction.

Example:

```text
PaymentServiceInterface
ManualPaymentService
MockPaymentService
```

Prepare the design for later PayMongo integration.

Never hard-code secrets.

---

# 29. PROPERTY MODEL

Suggested fields:

```text
id
tenant_id
name
slug
short_description
description
address
barangay
city
province
postal_code
country
latitude
longitude
phone
email
check_in_time
check_out_time
status
featured
created_at
updated_at
```

---

# 30. ROOM MODEL

Suggested fields:

```text
id
tenant_id
property_id
name
slug
room_type
description
base_occupancy
maximum_occupancy
adults
children
beds
bathrooms
quantity
base_rate
weekend_rate
cleaning_fee
extra_guest_fee
active
featured
created_at
updated_at
```

---

# 31. AMENITIES

Create reusable amenities:

- WiFi
- Air-conditioning
- Parking
- Pool
- Breakfast
- Kitchen
- TV
- Hot shower
- Beach access
- Pet friendly
- Workspace
- Balcony
- Sea view
- Mountain view

---

# 32. IMAGE MANAGEMENT

Support:

- property images
- room images
- upload
- remove
- reorder
- cover image

Use Laravel Storage.

Validate:

- MIME
- extension
- file size
- dimensions where needed

Generate unique filenames.

---

# 33. AVAILABILITY ENGINE

This is CRITICAL.

Create:

```text
AvailabilityService
```

Run availability checks server-side.

Check during:

1. search
2. room/property detail
3. booking creation
4. checkout
5. final confirmation/payment processing

Prevent double booking.

Blocking statuses:

```text
PENDING when hold active
AWAITING_PAYMENT when hold active
PAID
CONFIRMED
CHECKED_IN
```

Non-blocking:

```text
CANCELLED
EXPIRED
```

Support:

- blocked dates
- maintenance dates
- room inventory

Overlap rule:

```text
existing.check_in < requested.check_out
AND
existing.check_out > requested.check_in
```

Same-day turnover MUST work:

```text
Booking A: Oct 5 → Oct 7
Booking B: Oct 7 → Oct 9
Allowed
```

Overlap MUST fail:

```text
Booking A: Oct 5 → Oct 7
Booking B: Oct 6 → Oct 8
Rejected
```

Use database transactions and row-level locking where appropriate.

Write tests before moving forward.

---

# 34. TEMPORARY CHECKOUT HOLD

Create inventory hold support.

Default:

```text
15 minutes
```

Store:

```text
expires_at
```

Use Laravel Scheduler to expire old holds.

---

# 35. PRICING ENGINE

Create:

```text
PricingService
```

Support:

- base nightly rate
- weekend rate
- seasonal rate
- special-date rate
- extra guest fee
- cleaning fee
- service fee
- tax
- promotions
- minimum stay
- maximum stay

Formula:

```text
Accommodation subtotal
+ extra guest fee
+ cleaning fee
+ service fee
+ tax
- discount
= total
```

Store booking pricing snapshots.

Use DECIMAL fields for money.

Never use floats as authoritative monetary storage.

---

# 36. PROMO CODES

Create:

```text
PromoCode
```

Fields:

```text
tenant_id
code
name
description
discount_type
value
minimum_spend
maximum_discount
valid_from
valid_until
usage_limit
per_customer_limit
active
```

Support:

```text
FIXED
PERCENTAGE
```

Seed:

```text
WELCOME10
```

10% discount.

---

# 37. ADMIN AREA

Create route prefix:

```text
/admin
```

Use an Admin layout in:

```text
resources/js/Layouts/AdminLayout.tsx
```

Sidebar:

- Dashboard
- Bookings
- Calendar
- Properties
- Rooms
- Customers
- Payments
- Promotions
- Reviews
- Reports
- Users
- Settings

Make it polished and responsive.

---

# 38. ADMIN DASHBOARD

Show:

- today's bookings
- today's check-ins
- today's check-outs
- current guests
- monthly revenue
- occupancy
- pending payments
- cancellations

Charts:

- monthly revenue
- booking trend
- occupancy trend

Tables:

- recent bookings
- upcoming arrivals
- pending payments

---

# 39. ADMIN BOOKINGS

Create:

```text
/admin/bookings
```

Columns:

- Reference
- Guest
- Property
- Room
- Check-in
- Check-out
- Amount
- Payment
- Status
- Source
- Actions

Filters:

- booking status
- payment status
- property
- room
- source
- date range

Search:

- booking reference
- guest name
- phone
- email

---

# 40. BOOKING DETAIL PAGE

Create:

```text
/admin/bookings/{reference}
```

Show:

- booking reference
- guest
- contact
- property
- room
- dates
- nights
- guests
- pricing
- payments
- notes
- timeline
- audit activity

Actions:

- Confirm
- Cancel
- Check In
- Check Out
- No Show
- Record Payment
- Add Note
- Resend Confirmation

Use confirmation modals for destructive actions.

---

# 41. MANUAL BOOKINGS

Create:

```text
/admin/bookings/create
```

Sources:

```text
WEBSITE
WALK_IN
PHONE
FACEBOOK
MESSENGER
VIBER
WHATSAPP
REFERRAL
OTHER
```

Manual bookings must call the same AvailabilityService and PricingService.

---

# 42. ADMIN CALENDAR

Create:

```text
/admin/calendar
```

Display:

- rows = rooms
- columns = dates

Statuses:

- Available
- Pending
- Confirmed
- Checked In
- Blocked
- Maintenance

Support:

- month view
- week view
- property filter
- room filter
- click reservation
- click available date
- block date

Use React for rich interaction, but keep authoritative data and mutations in Laravel.

---

# 43. CHECK-IN / CHECK-OUT

Check-in:

```text
CONFIRMED → CHECKED_IN
```

Store:

```text
checked_in_at
checked_in_by
guest_count
id_verified
notes
```

Check-out:

```text
CHECKED_IN → CHECKED_OUT
```

Store:

```text
checked_out_at
checked_out_by
```

Optional completion:

```text
CHECKED_OUT → COMPLETED
```

---

# 44. CUSTOMERS

Create:

```text
/admin/customers
```

Show:

- name
- email
- phone
- total bookings
- total spend
- last stay
- status

Customer detail:

- profile
- booking history
- spend history
- internal notes

---

# 45. PHILIPPINE PHONE NUMBER SUPPORT

Accept common local input:

```text
09171234567
```

Normalize internally where appropriate to:

```text
+639171234567
```

---

# 46. REVIEWS

Only completed bookings can submit reviews.

Fields:

```text
booking_id
user_id
tenant_id
property_id
room_id
rating
comment
approved
created_at
```

Admin can moderate.

---

# 47. EMAILS

Create branded Laravel Mail/Notification templates for:

- welcome
- booking received
- booking confirmed
- payment received
- cancellation
- upcoming stay reminder
- check-in instructions
- checkout confirmation
- subscription expiry

Use log mail driver when no provider is configured in development.

---

# 48. NOTIFICATIONS

Admin:

- new booking
- payment received
- cancellation
- check-in today
- overdue checkout
- failed payment

Superadmin:

- new tenant
- trial ending
- subscription expiring
- subscription expired
- tenant locked/suspended
- important platform events

---

# 49. REPORTS

Create:

```text
/admin/reports
```

Reports:

- Revenue
- Bookings
- Occupancy
- Payments
- Cancellations
- Property Performance

Filters:

- today
- week
- month
- year
- custom range
- property
- room

Support CSV export.

---

# 50. SUPERADMIN AREA

Create route prefix:

```text
/superadmin
```

Use:

```text
resources/js/Layouts/SuperadminLayout.tsx
```

Sidebar:

- Overview
- Clients
- Subscriptions
- Plans
- Platform Revenue
- Properties
- Users
- Demo Accounts
- Audit Logs
- System Settings

Superadmin UI should feel platform-level and use deeper navy with restrained EAJ pink.

---

# 51. SUPERADMIN DASHBOARD

Show:

- active clients
- trial clients
- expiring subscriptions
- locked clients
- suspended clients
- MRR
- ARR
- new clients
- total platform bookings
- platform transaction value

Charts:

- client growth
- subscription revenue
- plan distribution
- renewals/expirations

Tables:

- expiring subscriptions
- recent clients
- recent subscription changes
- recent audit events

---

# 52. CLIENT MANAGEMENT

Create:

```text
/superadmin/clients
```

Columns:

- Client
- Business
- Plan
- Billing Cycle
- Subscription Price
- Subscription Status
- Start Date
- Expiry Date
- Properties
- Status
- Actions

Filters:

- Active
- Trial
- Expired
- Locked
- Suspended
- Monthly
- Annual

---

# 53. CLIENT DETAIL

Create:

```text
/superadmin/clients/{tenant}
```

Show:

- business profile
- contact details
- subscription
- admins
- staff
- properties
- booking summary
- revenue summary
- account status
- audit history

Actions:

- Edit Subscription
- Extend Subscription
- Apply Discount
- Lock
- Unlock
- Suspend
- Reactivate
- Open Admin View
- Start Impersonation

Audit all platform-sensitive actions.

---

# 54. PRICING PAGE

Create premium EAJ SaaS pricing.

Monthly:

```text
₱3,499/month
```

Annual:

```text
₱2,499/month equivalent
₱29,988 billed annually
Save ₱12,000/year
12-month commitment
```

Highlight:

```text
Best Value
```

Be transparent about annual billing.

---

# 55. AUTHENTICATION

Use Laravel-native session authentication for the Inertia web app.

Use secure:

- password hashing
- session cookies
- CSRF protection
- login throttling
- password reset
- email verification where appropriate

Use Sanctum only when useful for external API/mobile support.

Do not force token authentication for normal Inertia browser navigation.

---

# 56. ROUTING

Use Laravel named routes.

Example public routes:

```php
Route::get('/', ...)->name('home');
Route::get('/stays', ...)->name('stays.index');
Route::get('/stays/{property:slug}', ...)->name('stays.show');
Route::get('/checkout/{booking}', ...)->name('checkout.show');
```

Group admin routes:

```php
Route::middleware(['auth', 'role:ADMIN,STAFF'])->prefix('admin')->name('admin.')->group(...);
```

Group superadmin routes:

```php
Route::middleware(['auth', 'role:SUPERADMIN'])->prefix('superadmin')->name('superadmin.')->group(...);
```

Use appropriate custom middleware/policies rather than blindly copying this example.

---

# 57. JSON/AJAX ENDPOINTS

Only create JSON endpoints where they improve interactivity.

Examples:

```text
GET  /availability
GET  /calendar/data
POST /demo/login
POST /bookings/{booking}/hold
```

All mutations must validate and authorize in Laravel.

Do not create a redundant full REST API for pages already handled cleanly by Inertia.

---

# 58. DATABASE MODELS

Create at least:

```text
User
Tenant
Property
PropertyImage
Room
RoomImage
Amenity
AmenityRoom
Booking
BookingGuest
BookingPrice
Payment
PromoCode
PromoUsage
BlockedDate
SpecialRate
Review
Notification
BusinessSetting
SubscriptionPlan
Subscription
AuditLog
```

Add useful indexes for:

- tenant IDs
- property IDs
- room IDs
- booking dates
- booking reference
- email
- phone
- statuses
- payment reference
- subscription dates

---

# 59. BOOKING REFERENCES

Generate readable references.

Example:

```text
EAJ-2026-000001
```

or a tenant-specific variant.

Do not expose raw auto-increment IDs as the main public booking identifier.

---

# 60. AUDIT LOG

Track:

- booking created
- booking edited
- booking cancelled
- booking status changed
- payment recorded
- refund
- property change
- rate change
- role change
- subscription created
- subscription modified
- discount changed
- contract extended
- tenant locked/unlocked
- tenant suspended/reactivated
- impersonation started/ended

Store:

```text
actor_user_id
tenant_id
action
entity_type
entity_id
before_values
after_values
metadata
ip_address
user_agent
created_at
```

---

# 61. BUSINESS SETTINGS

Create:

```text
/admin/settings
```

Sections:

- General
- Branding
- Booking
- Payments
- Email
- Policies

Fields:

- business name
- logo
- favicon
- email
- phone
- address
- currency
- timezone
- check-in time
- check-out time
- tax rate
- service fee
- booking hold minutes
- cancellation policy
- terms
- privacy

Defaults:

```text
Currency: PHP
Timezone: Asia/Manila
```

---

# 62. PREMIUM LOGIN PAGE

Create a highly polished login page using React/Inertia.

Desktop:

Left:
- EAJ logo
- premium hospitality image
- tagline
- subtle branding

Right:
- login card
- email
- password
- remember me
- forgot password
- demo login cards when enabled

When `DEMO=true`, show:

```text
Quick Demo Access
```

with:

- Superadmin
- Administrator
- Staff
- Guest

Mobile:
- stack elegantly
- preserve strong branding
- avoid overflow

---

# 63. RESPONSIVE DESIGN

Test approximately:

```text
375px
430px
768px
1024px
1440px
```

No accidental horizontal overflow.

Public booking experience must be mobile-first.

Admin and superadmin must remain practical on tablets and phones.

---

# 64. PREMIUM UI STANDARD

Use:

- strong typography hierarchy
- refined spacing
- subtle shadows
- consistent radii
- premium card proportions
- polished tables
- clear status badges
- skeleton loaders
- empty states
- error states
- confirmation dialogs
- toast notifications
- accessible focus states
- subtle motion

Avoid:

- generic Bootstrap look
- clutter
- excessive gradients
- neon colors
- giant unnecessary cards/buttons
- obvious AI-generated layouts

The system must look like a real commercial SaaS product.

---

# 65. ACCESSIBILITY

Use:

- semantic HTML
- labels
- keyboard navigation
- focus indicators
- accessible dialogs
- contrast-safe colors
- alt text

---

# 66. SEO

For public pages, implement:

- title
- description
- OpenGraph
- structured data where useful
- sitemap
- robots.txt

Use Blade head integration / Inertia Head appropriately.

---

# 67. ENVIRONMENT FILE

Create `.env.example` with relevant values.

Include:

```env
APP_NAME="EAJ Booking Platform"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

DEMO=false

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eaj_booking
DB_USERNAME=
DB_PASSWORD=

MAIL_MAILER=log
MAIL_HOST=
MAIL_PORT=
MAIL_USERNAME=
MAIL_PASSWORD=

PAYMENT_PROVIDER=mock
PAYMENT_SECRET=
PAYMENT_PUBLIC_KEY=
```

Add any other Laravel-required values.

Never include real production secrets.

---

# 68. SEED DATA

Seed:

```text
superadmin@example.com
admin@example.com
staff@example.com
guest@example.com
```

Password:

```text
Password123!
```

Seed one or more demo tenants.

Seed realistic Philippine properties:

```text
Azure Coast Villas
Panglao, Bohol

Sierra Haven
Valencia, Negros Oriental

Island House Siargao
General Luna, Siargao
```

Seed:

- properties
- rooms
- amenities
- property images/placeholders
- bookings
- payments
- reviews
- promo
- monthly plan
- annual plan
- active subscription

---

# 69. TESTING REQUIREMENTS

Use Laravel's testing tools.

Critical tests:

- successful booking
- overlapping booking rejected
- same-day turnover allowed
- blocked date rejected
- cancelled booking does not block room
- expired hold does not block room
- correct pricing
- promo calculations
- unauthorized admin rejected
- unauthorized superadmin rejected
- cross-tenant access rejected
- booking state transitions
- demo login works when enabled
- demo login fails when disabled
- expired subscription restrictions
- locked tenant restrictions
- superadmin access preserved
- annual pricing math

Verify:

```text
3499 × 12 = 41988
2499 × 12 = 29988
Savings = 12000
```

Where practical, add frontend/component tests for critical React interactions.

---

# 70. SECURITY

Implement:

- password hashing
- CSRF protection
- secure session auth
- server-side authorization
- policies/gates
- tenant isolation
- rate limiting
- login throttling
- demo login throttling
- validated file uploads
- secure storage paths
- no secrets in source
- server-side subscription enforcement
- safe redirects
- mass-assignment protection
- explicit validation
- safe impersonation with audit logging

---

# 71. STEP-BY-STEP IMPLEMENTATION PLAN

Follow these phases in order.

Do not try to generate everything blindly in one step.

At the end of every phase:
1. run relevant commands
2. fix errors
3. summarize what changed
4. only then continue

## PHASE 1 — Initialize Laravel Monolith

1. Initialize Laravel in the CURRENT folder.
2. Install Inertia.js.
3. Install React + TypeScript.
4. Configure Vite.
5. Install Tailwind CSS.
6. Install shadcn/ui dependencies/components.
7. Install date-fns, Lucide, Recharts, React Hook Form, Zod as needed.
8. Create the `resources/js` structure.
9. Confirm default Inertia page renders.
10. Confirm:
   - `php artisan serve` works
   - `npm run dev` works

Do not create separate frontend/backend directories.

## PHASE 2 — Branding Foundation

1. Copy supplied logos to `public/branding`.
2. Create EAJ design tokens.
3. Create reusable logo components.
4. Create shared Button, Card, Badge, Input, Modal, Dropdown, Table components.
5. Set typography and spacing rules.
6. Create main public layout.
7. Create admin layout.
8. Create superadmin layout.

Verify responsive behavior.

## PHASE 3 — MySQL and Core Config

1. Configure `.env.example`.
2. Configure MySQL.
3. Create `config/platform.php`.
4. Add `DEMO` support.
5. Configure mail log driver.
6. Configure storage.
7. Configure queues.
8. Configure scheduler structure.

Run application config checks.

## PHASE 4 — Database Foundation

Create migrations/models for:

- users
- tenants
- subscription plans
- subscriptions
- properties
- rooms
- amenities
- bookings
- booking guests
- booking prices
- payments
- promo codes
- promo usage
- blocked dates
- special rates
- reviews
- settings
- audit logs

Run migrations.

Fix all issues before continuing.

## PHASE 5 — Authentication and Authorization

Implement:

- register
- login
- logout
- forgot password
- reset password
- email verification if practical
- user roles
- tenant relation
- policies
- gates
- middleware

Test all roles.

## PHASE 6 — Demo Mode

Implement:

- config-based DEMO mode
- demo seed users
- one-click login route
- one-click login React UI
- role redirects
- rate limiting

Test:

```text
DEMO=true  → works
DEMO=false → blocked
```

## PHASE 7 — Multi-Tenancy

Implement:

- tenant creation
- tenant scoping
- tenant-aware models
- tenant policies
- cross-tenant protection
- tenant context helpers/services

Write tests proving one ADMIN cannot access another tenant.

## PHASE 8 — Subscription System

Implement:

- monthly plan
- annual plan
- custom plan support
- discounts
- commitment months
- start/end
- lock/suspend/expire
- subscription middleware/service
- renewal reminders

Verify annual math exactly.

## PHASE 9 — Superadmin Portal

Create:

- overview
- clients
- client detail
- subscriptions
- plans
- revenue overview
- platform users
- audit logs
- settings

Add subscription editing and tenant locking.

Apply premium EAJ design.

## PHASE 10 — Property Management

Implement:

- property CRUD
- room CRUD
- amenities
- image upload
- ordering
- cover image
- tenant branding
- validation

Create admin React pages under:

```text
resources/js/Pages/Admin/
```

## PHASE 11 — Availability Engine

Implement:

- date overlap
- status rules
- blocks
- maintenance
- holds
- same-day turnover
- transaction safety
- locking where appropriate

Write tests first-class.

Do not proceed until availability tests pass.

## PHASE 12 — Pricing Engine

Implement:

- base rates
- weekend rates
- special rates
- seasonal rules
- extra guests
- cleaning fee
- service fee
- tax
- promo discounts
- pricing snapshot

Test all calculations.

## PHASE 13 — Booking Engine

Implement:

- booking creation
- reference generation
- guest details
- hold expiration
- state transitions
- cancellation
- confirmation
- check-in/out
- booking history

Use the AvailabilityService and PricingService rather than duplicating logic.

## PHASE 14 — Payments

Implement:

- manual payments
- mock/test payment provider
- partial payments
- payment status
- refunds status support
- payment history

Prepare provider architecture for PayMongo later.

## PHASE 15 — Premium Public Booking Website

Build:

- home
- stays search
- property detail
- checkout
- confirmation
- account
- booking history
- profile

Make it visually outstanding.

Use client branding appropriately.

## PHASE 16 — Admin Portal

Build:

- dashboard
- bookings
- booking detail
- new manual booking
- properties
- rooms
- customers
- payments
- promos
- reviews
- reports
- settings

## PHASE 17 — Booking Calendar

Build a premium React calendar UI.

Support:

- month view
- week view
- room rows
- date columns
- status indicators
- filters
- click booking
- create booking
- block date

Keep source of truth in Laravel.

## PHASE 18 — Emails and Notifications

Implement:

- booking emails
- payment emails
- cancellation emails
- reminders
- admin notifications
- subscription reminders

Use queues when appropriate.

## PHASE 19 — Reports

Build:

- booking reports
- revenue
- occupancy
- payments
- cancellations
- property performance
- platform subscription metrics

Add CSV exports.

## PHASE 20 — EAJ SaaS Landing & Pricing

Build a visually striking EAJ landing page.

Use supplied branding.

Highlight:

```text
₱3,499/month
```

and:

```text
₱2,499/month equivalent
₱29,988/year
Save ₱12,000/year
12-month commitment
```

Annual should be "Best Value".

## PHASE 21 — Premium UI Audit

Review all pages at:

```text
375px
430px
768px
1024px
1440px
```

Improve:

- typography
- spacing
- images
- cards
- buttons
- forms
- tables
- calendar
- charts
- mobile nav
- loading states
- empty states
- errors
- toasts
- dialogs
- focus states

Remove anything that looks like a developer prototype.

## PHASE 22 — Final QA

Run:

```bash
php artisan test
php artisan route:list
npm run build
```

Also run any configured lint/type-check commands.

Fix every critical error.

Verify:

- migrations
- seeders
- demo mode
- tenant isolation
- subscriptions
- double-booking protection
- admin flows
- superadmin flows
- mobile layouts
- production frontend build

Do not suppress TypeScript errors with careless `any`.

---

# 72. FINAL ACCEPTANCE CHECKLIST

Before declaring completion verify:

## Architecture

- single Laravel app
- React is under `resources/js`
- Inertia.js is used
- MySQL is used
- no Next.js
- no separate frontend/backend projects

## Branding

- EAJ logo assets are used
- EAJ palette is used
- landing page looks premium
- login looks premium
- superadmin looks premium

## Demo

- `DEMO=true` shows one-click demo login
- `DEMO=false` removes and blocks it
- all four demo roles work

## Roles

- SUPERADMIN platform-wide
- ADMIN tenant-only
- STAFF limited tenant access
- GUEST customer access

## Subscription

- monthly = ₱3,499
- annual = ₱29,988
- effective annual monthly = ₱2,499
- savings = ₱12,000
- custom lock-in works
- custom discounts work
- expiration works
- lock/suspend works

## Booking

- availability works
- overlap blocked
- same-day turnover works
- hold expiration works
- checkout works
- confirmation works
- manual booking works
- admin booking works

## Security

- server-side policies
- tenant isolation
- CSRF protection
- rate limiting
- no secret exposure
- safe uploads
- subscription enforcement

## UI

- mobile polished
- desktop polished
- admin polished
- superadmin polished
- public website polished
- booking calendar usable

---

# 73. FINAL RESPONSE AFTER BUILD

When implementation is complete, report:

1. Architecture summary
2. Important directory tree
3. Installation steps
4. MySQL setup
5. `.env` configuration
6. Commands to run locally
7. Demo credentials
8. Important named routes
9. Features implemented
10. Subscription rules implemented
11. Demo-mode behavior
12. Security controls
13. Tests executed and results
14. Build result
15. Deferred features
16. Production deployment recommendations
17. Known limitations

Most importantly:

**Do not create a separate frontend.**

The final product must be one Laravel application with React + TypeScript + Inertia pages inside:

```text
resources/js
```

Build it step by step, verify each phase, fix failures before proceeding, and do not stop until the critical MVP works and the production frontend build succeeds.
