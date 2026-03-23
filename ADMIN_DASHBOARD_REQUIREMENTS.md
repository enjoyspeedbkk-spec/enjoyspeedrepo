# EN-JOY SPEED Admin Dashboard — Complete Requirements & Design

**Document Date:** March 22, 2026
**Project:** En-Joy Speed (Guided Cycling Booking Platform)
**Target Users:** Pailin & Udorn (non-technical admins, Excel/Google Drive background)
**Core Constraint:** Zero code deployment for business changes

---

## PART 1: Exhaustive Change Requirements

### 1.1 Ride Configuration (CRITICAL)

These changes directly prevent bookings from working and affect revenue immediately.

| What | Current | Frequency | Impact | Priority |
|------|---------|-----------|--------|----------|
| **Time slot start/end times** | A1: 06:15-08:15, A2: 06:30-08:30, B: 16:15-18:15, C: 16:45-18:45, D: 17:15-19:15 | Monthly (seasonal shifts) | Affects availability calendar UI, booking validation, and marketing materials | [CRITICAL] |
| **Time slot names** | "Early Bird", "Energy Booster", "Light Chaser", "Golden Hour", "Twilight Finish" | Rarely, but needed for marketing | Displays to customers on website | [CRITICAL] |
| **Time slot overlaps** | A1↔A2, B↔C↔D | Only if changing structure | Validates that riders can't book multiple overlapping slots | [CRITICAL] |
| **Ride package types** | Duo (2pp), Squad (3-5pp), Peloton (6-8pp) | Quarterly or when testing new formats | **Future case:** "Solo Traveller" format (1 person), "Corporate Team" (10-15), "Pro Peloton" (8-12, different pace) | [CRITICAL] |
| **Package names** | "Duo", "The Squad", "The Peloton" | When marketing changes | Displays on website, booking flow, invoices | [CRITICAL] |
| **Min/max riders per package** | Duo 2/2, Squad 3/5, Peloton 6/8 | Quarterly | Validation logic | [CRITICAL] |
| **Price per person** | Duo 2500, Squad 2100, Peloton 2000 THB | **Monthly** (seasonal, promotions, costs) | Revenue impact; displayed to customers; affects payment collection | [CRITICAL] |
| **Leaders needed per package** | Duo 1, Squad 1, Peloton 2 | Rarely | Scheduling staff assignments | [IMPORTANT] |
| **Support riders needed** | Duo 0, Squad 1, Peloton 2 | Rarely | Scheduling staff assignments | [IMPORTANT] |
| **Route distance & description** | 23.5 km, Skylane (Happy and Healthy Bike Lane), Suvarnabhumi | Only if new location | Website, booking confirmation, waiver | [CRITICAL] |
| **Bathroom stops** | km 5, 11, 16 | If route changes | Customer expectation setting | [IMPORTANT] |
| **Lane options** | Blue (slow), Purple (fast) | If adding new pace types | Booking selection, pace communication | [IMPORTANT] |

### 1.2 Bike Rental Pricing (CRITICAL)

| What | Current | Frequency | Impact | Priority |
|------|---------|-----------|--------|----------|
| **Hybrid bike rental** | 420 THB | Monthly (demand-based) | Revenue; displayed during booking; needs to sync to website | [CRITICAL] |
| **Road bike rental** | 700 THB | Monthly (demand-based) | Revenue; affects package pricing strategy | [CRITICAL] |
| **Own bike option cost** | 0 THB | Never (but needs to exist) | Offered to customers who bring own bike | [CRITICAL] |
| **Bike availability per type** | Not currently tracked | Daily | **MISSING:** Should track inventory — 20 hybrids, 15 roads | [IMPORTANT] |
| **Bike servicing/maintenance notes** | None currently | Before ride days | Mark bikes as unavailable for maintenance | [IMPORTANT] |

### 1.3 Starter Kit (IMPORTANT)

| What | Current | Frequency | Impact | Priority |
|------|---------|-----------|--------|----------|
| **Kit items** | Padded shorts, energy gel, eco bag | Only if changing inclusions | Displayed to customers; affects cost structure | [IMPORTANT] |
| **Shorts sizes offered** | XS, S, M, L, XL, XXL | Rarely | Inventory management; customer communication | [IMPORTANT] |
| **Energy gel brand** | Korona WATT | Quarterly (if sponsor changes) | Customer satisfaction; could become upsell point | [NICE] |
| **Eco bag design/supplier** | Reusable mesh bag | Yearly | Branding; could be co-branded with sponsor | [NICE] |
| **Item substitutions** | Not tracked | When items run out | Replace gel with sports drink, shorts with arm sleeve, etc. | [IMPORTANT] |

### 1.4 Required Rider Info (IMPORTANT)

| What | Current | Frequency | Impact | Priority |
|------|---------|-----------|--------|----------|
| **Required fields** | Name, bike preference, experience level | Monthly (regulatory or safety changes) | Validation; affects booking form length | [IMPORTANT] |
| **Optional fields** | Nickname, height, clothing size, emergency contact | Never (but collect now) | Improves operations and safety | [IMPORTANT] |
| **Waiver terms** | Standard cycling waiver | Yearly or if legal/insurance changes | Must update if policy changes | [CRITICAL] |
| **Height/weight bike fit ranges** | Not configured | Once (if adding) | For better bike matching | [NICE] |

### 1.5 Availability & Blackouts (CRITICAL)

| What | Current | Frequency | Impact | Priority |
|------|---------|-----------|--------|----------|
| **Which dates are bookable** | Admin creates per ride_sessions rows | Daily | Blocks bookings on unavailable dates | [CRITICAL] |
| **Max groups per session** | Stored in ride_sessions table | Daily | Capacity management; prevents overbooking | [CRITICAL] |
| **Weather cancellations** | Admin can set weather_status: 'cancelled' | Real-time (during season) | Notifies booked riders, prevents new bookings | [CRITICAL] |
| **Blackout reasons** | Stored in blackout_reason field | Weekly | Internal tracking; customer-facing message | [IMPORTANT] |
| **Recurring availability rules** | Not implemented | Weekly | E.g., "always available Mon/Wed/Fri, never on public holidays" | [IMPORTANT] |
| **Lead athlete assignments** | Manual per session | Weekly | Staff scheduling | [CRITICAL] |
| **Rain season dates** | Hardcoded: June-October | Yearly | Affects promotions, messaging, refund policies | [IMPORTANT] |
| **Booking advance hours** | Hardcoded: 24 hours | Rarely | Affects "last-minute booking" window | [NICE] |

### 1.6 Pricing & Promotions (CRITICAL)

| What | Current | Frequency | Impact | Priority |
|------|---------|-----------|--------|----------|
| **Base prices** | Duo 2500, Squad 2100, Peloton 2000 | Monthly | Revenue | [CRITICAL] |
| **Discount codes** | Not implemented | Monthly | Marketing, seasonal sales, partnerships | [CRITICAL] |
| **Early-bird discounts** | Not implemented | Weekly (for upcoming sessions) | Can incentivize bookings in low-demand slots | [IMPORTANT] |
| **Group discounts** | Not implemented | Quarterly | E.g., "5+ riders get 10% off" | [IMPORTANT] |
| **Loyalty discounts** | Not implemented | Monthly | E.g., "repeat customers get 5% off" | [IMPORTANT] |
| **Referral rewards** | Not implemented | Monthly | E.g., "refer a friend, both get 500 THB credit" | [NICE] |
| **Corporate rates** | Not implemented | When corporate inquiries arrive | B2B pricing; can be significant revenue | [IMPORTANT] |
| **Seasonal pricing** | Not implemented | Quarterly | Higher prices in peak season, lower in rain season | [IMPORTANT] |
| **Promo period dates** | N/A | Per promotion | When does discount apply? Date ranges? | [CRITICAL] |
| **Promo code caps** | N/A | Per promotion | Max discount per booking? Max uses? | [IMPORTANT] |
| **Rain credit policies** | Partial implementation (in payment table) | Per event | 90-day validity; how to apply; how to track | [IMPORTANT] |

### 1.7 Payment & Finance (CRITICAL)

| What | Current | Frequency | Impact | Priority |
|------|---------|-----------|--------|----------|
| **PromptPay QR code** | Static (in code or env) | Never (per account) | Payment instructions; needs to link to business account | [CRITICAL] |
| **Bank transfer details** | Not shown anywhere | Never | Backup payment method; needs to be displayed | [IMPORTANT] |
| **Payment deadline** | Implicit (when?) | Per booking | When must payment arrive after booking? | [CRITICAL] |
| **Refund policy** | Not documented in system | If changed | Affects customer disputes and cancellations | [CRITICAL] |
| **Cancellation window** | Not specified | If changed | E.g., "free cancellation 48h before ride" | [CRITICAL] |
| **No-show policy** | Not specified | If changed | E.g., "no refund, but rain credit issued" | [IMPORTANT] |
| **Currency display** | Hardcoded THB | Never (unless expanding regionally) | Payment collection, invoicing | [CRITICAL] |

### 1.8 Communication & Notifications (IMPORTANT)

| What | Current | Frequency | Impact | Priority |
|------|---------|-----------|--------|----------|
| **LINE OA account** | @EnjoySpeed | Never (per business) | Customer communication; needs to be configurable for testing | [IMPORTANT] |
| **Email from address** | Probably default Supabase | Monthly | Branding; may need to match business email | [IMPORTANT] |
| **Confirmation email template** | Not built yet | Quarterly (if changing) | Customer communication; affects perception | [IMPORTANT] |
| **Rider checklist email** | Not built yet | Quarterly | Sent 24h before ride; preparation instructions | [IMPORTANT] |
| **Weather cancellation message** | Ad-hoc per event | Real-time | Template for LINE/email notification | [CRITICAL] |
| **Booking reminder SMS/LINE** | Not implemented | Before each ride | Reduces no-shows | [IMPORTANT] |
| **Custom messages to groups** | Not implemented | Per booking | E.g., send special instructions to a group | [NICE] |

### 1.9 Staff Management (IMPORTANT)

| What | Current | Frequency | Impact | Priority |
|------|---------|-----------|--------|----------|
| **Leaders list** | Manual per session | Weekly | Who can lead rides | [CRITICAL] |
| **Support riders list** | Manual per session | Weekly | Who can support | [CRITICAL] |
| **Staff roles** | 'admin', 'leader' (not 'support_rider' yet) | Never (but design choice) | Need to distinguish roles | [IMPORTANT] |
| **Staff availability calendar** | Not in system | Weekly | When is each leader available? | [IMPORTANT] |
| **Staff contact details** | In profiles table | Monthly | Phone/LINE for coordination | [IMPORTANT] |
| **Shift assignments** | Manual per ride_sessions | Weekly | Who leads which session? | [CRITICAL] |
| **Rider performance/feedback** | Not tracked | After each ride | Track which leaders get best reviews | [NICE] |

### 1.10 Customer Management (IMPORTANT)

| What | Current | Frequency | Impact | Priority |
|------|---------|-----------|--------|----------|
| **Customer list** | In profiles & bookings tables | Real-time | Who has booked? | [IMPORTANT] |
| **Repeat customer tracking** | Not calculated | Monthly | Identify loyalty candidates | [IMPORTANT] |
| **Customer communication history** | Not logged | Real-time | What have we told each customer? | [IMPORTANT] |
| **Customer disputes/complaints** | Not tracked | Per incident | Where to record and resolve issues? | [IMPORTANT] |
| **Customer feedback/reviews** | Not collected yet | After each ride | Affects marketing and service quality | [IMPORTANT] |
| **Blacklist/VIP status** | Not in system | Per customer | Mark problem customers or VIPs | [NICE] |
| **Language preference** | In profiles (en/th) | Per customer | Affects email/LINE notifications | [IMPORTANT] |

### 1.11 Reporting & Analytics (IMPORTANT)

| What | Current | Frequency | Impact | Priority |
|------|---------|-----------|--------|----------|
| **Daily revenue** | Not calculated | Daily | Need to know how much money came in | [CRITICAL] |
| **Bookings by package** | Not calculated | Weekly | Which packages are popular? | [IMPORTANT] |
| **Occupancy by slot** | Partially (daily_dashboard view) | Daily | Are we filling sessions? | [IMPORTANT] |
| **No-show rate** | Not calculated | Weekly | Impacts pricing strategy | [IMPORTANT] |
| **Cancellation rate** | Not calculated | Weekly | Are customers unhappy? | [IMPORTANT] |
| **Revenue by source** | Not calculated | Monthly | Which channels bring customers? | [IMPORTANT] |
| **Weather impact analysis** | Not calculated | Quarterly | How many cancellations in rain season? | [NICE] |
| **Staff performance** | Not calculated | Quarterly | Which leaders get best reviews? | [NICE] |
| **Customer satisfaction trends** | Not collected | Monthly | Are we improving? | [IMPORTANT] |

### 1.12 Website Content (IMPORTANT)

| What | Current | Frequency | Impact | Priority |
|------|---------|-----------|--------|----------|
| **Hero headline** | Hardcoded in component | Quarterly | Marketing refresh; seasonal messaging | [IMPORTANT] |
| **Route description** | Hardcoded | Yearly | If route changes | [IMPORTANT] |
| **FAQ content** | Hardcoded in FAQ component | Monthly | Customers keep asking same questions | [IMPORTANT] |
| **Terms & conditions** | Not in system | Yearly | Legal updates | [CRITICAL] |
| **Privacy policy** | Not in system | Yearly | Legal/GDPR changes | [CRITICAL] |
| **Home page images** | Hardcoded URLs | Seasonally | Weather, seasons, marketing campaigns | [IMPORTANT] |
| **Blog/news posts** | Not implemented | Weekly (ideally) | Share tips, updates, stories | [NICE] |
| **Social media links** | Not in system | If changing | Instagram, TikTok, Facebook links | [NICE] |

### 1.13 Error Handling & Troubleshooting (CRITICAL)

| What | Current | Frequency | Impact | Priority |
|------|---------|-----------|--------|----------|
| **Manual payment verification** | In payments table, needs UI | Per payment | Mark PromptPay slip as verified (or rejected) | [CRITICAL] |
| **Booking cancellation** | In bookings table | Per cancellation | Cancel a booking, issue refund/rain credit | [CRITICAL] |
| **Refund processing** | Payment table has refund fields | Per refund | Issue money back or rain credit | [CRITICAL] |
| **No-show marking** | In booking status | Per ride day | Mark rider as no-show instead of completed | [CRITICAL] |
| **Rider detail correction** | Rider table exists | If customer makes mistake | Fix name, height, bike preference | [IMPORTANT] |
| **Duplicate booking detection** | Not implemented | Per booking | Warn if customer tries to book same slot twice | [IMPORTANT] |
| **Overbooking safeguards** | Partial (max_groups field) | Per session | Prevent booking if session full | [CRITICAL] |
| **Payment amount correction** | Payment table editable by admin | If price changes | Adjust amount if error made | [IMPORTANT] |
| **Customer data correction** | Can edit profiles | If customer provides wrong info | Fix email, phone, LINE ID | [IMPORTANT] |
| **Session deletion** | Should be blocked if bookings exist | If created by mistake | Can't delete if riders booked | [IMPORTANT] |

### 1.14 Growth & Expansion (IMPORTANT)

| What | Current | Frequency | Impact | Priority |
|------|---------|-----------|--------|----------|
| **New ride types** | Hardcoded in constants | When business expands | "Evening + Dinner", "Multi-day tour", "Private corporate ride" | [IMPORTANT] |
| **New locations** | Hardcoded route | Yearly (if expanding to new city) | Suvarnabhumi only now; could expand to other parks/cities | [IMPORTANT] |
| **New services/upsells** | Not implemented | Quarterly | e.g., "Pro bike", "Photo package", "Post-ride meal" | [NICE] |
| **Partner/sponsor integrations** | Not in system | Monthly | Energy gel brand changes, bike shop partnerships, hotel bookings | [IMPORTANT] |
| **Franchise/multi-location** | Not in system | If scaling | Can current system handle 2+ locations with different pricing? | [NICE] |

---

## PART 2: Frictionless Admin UX — Patterns & Implementation

### 2.1 Core UX Design Principles

These non-technical admins (Pailin & Udorn) need:

1. **Zero code knowledge required** — Changes happen through UI, not spreadsheets/code files
2. **Excel-like familiarity** — They know spreadsheets; use patterns they recognize
3. **Mobile-first for busy ride days** — They manage from the track on their phones
4. **Instant feedback** — See changes reflected immediately (no "wait for deployment")
5. **Mistake prevention** — Safeguards against accidental deletion or wrong pricing
6. **Offline possibility** — They lose connection at the track; cache recent data
7. **Clear consequences** — Show what will happen before confirming a change ("This affects X bookings")

### 2.2 Admin UX Pattern Recommendations

#### **Pattern 1: Inline Editing (for "always changing" values)**

**Use for:** Prices, availability, weather status, staff assignments

**Why:** Single click, change value, save. No modal dialogs. Excel-like experience.

**Example:**

```
Date: March 22, 2026
Time Slot: A1 (Early Bird)
┌─────────────────────────────────────────────┐
│ Max Groups:    [1]  (click to edit)         │
│ Status:        ⬤ AVAILABLE  [dropdown ▼]    │
│ Weather:       ⬤ CLEAR      [dropdown ▼]    │
│ Lead Athlete:  Somchai      [change]        │
│ Max Riders:    8            (read-only)      │
└─────────────────────────────────────────────┘
Changes save on blur (when clicking away).
Green checkmark = saved; red X = error.
```

**Implementation:**
- Use contentEditable divs or input fields that appear on click
- Auto-save on blur (after 1 second debounce)
- Show loading spinner during save
- Toast notification if error ("Can't change: 2 riders already booked")
- Never require modal confirmation for simple edits

---

#### **Pattern 2: Spreadsheet-Style Tables (for multi-row configuration)**

**Use for:** Time slots, ride packages, bike prices, promotions, staff

**Why:** They understand spreadsheets. Multiple rows visible at once. Familiar column headers.

**Example: Ride Package Table**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Ride Packages                                                 [+ Add]│
├──────────────────────────────────────────────────────────────────────┤
│ Name           Min  Max  Price/pp  Leaders  Heroes  Active  [Delete] │
├──────────────────────────────────────────────────────────────────────┤
│ Duo            2    2    2500      1        0       ☑      [×]     │
│ The Squad      3    5    2100      1        1       ☑      [×]     │
│ The Peloton    6    8    2000      2        2       ☑      [×]     │
│ [new row]      -    -    -         -        -       -              │
└──────────────────────────────────────────────────────────────────────┘

Click a cell to edit inline.
```

**Implementation:**
- TanStack Table library (headless, flexible)
- Cells are inputs that validate on change
- Row hover shows delete button
- Add new row button at bottom
- Drag to reorder if needed (not critical)

---

#### **Pattern 3: Card-Based Forms (for "occasional" changes)**

**Use for:** Terms & conditions, cancellation policy, FAQ, promotional messaging

**Why:** Longer form content needs more space; cards feel less intimidating than a form

**Example: Website Content**

```
┌──────────────────────────────────────────┐
│ Website Content Manager                   │
├──────────────────────────────────────────┤
│                                           │
│ ┌────────────────────────────────────┐   │
│ │ Hero Headline                       │   │
│ │ ────────────────────────────────    │   │
│ │ "Cycle Bangkok's Fastest Route"    │   │
│ │ [Edit]                    [Save]   │   │
│ └────────────────────────────────────┘   │
│                                           │
│ ┌────────────────────────────────────┐   │
│ │ Home Page Call-to-Action            │   │
│ │ ────────────────────────────────    │   │
│ │ "Book Your Ride Today"              │   │
│ │ [Edit]                    [Save]   │   │
│ └────────────────────────────────────┘   │
│                                           │
└──────────────────────────────────────────┘
```

---

#### **Pattern 4: Calendar View (for availability management)**

**Use for:** Marking blackout dates, weather cancellations, special events

**Why:** Visual, intuitive. They think in "which days are we open?"

**Example:**

```
┌───────────────────────────────────────┐
│ April 2026 Availability                │
├───────────────────────────────────────┤
│ Mon    Tue    Wed    Thu    Fri    Sat │
│  1      2      3      4      5      6  │
│ ✓       ✓      ✓      ✓      ✓      ✗  │
│  7      8      9     10     11     12  │
│ ✓       ✗      ✓      ✓      ✓      ✗  │ (8 = public holiday)
│ 14     15     16     17     18     19  │
│ ✓       ✓      ✓      ✓      ✓      ✗  │
│                                         │
│ Legend: ✓ Available  ✗ Blackout       │
│ Click date to toggle or set blackout  │
│ reason (holiday, maintenance, etc.)   │
└───────────────────────────────────────┘
```

---

#### **Pattern 5: Real-Time Dashboard (what they see daily)**

**Use for:** Today's bookings, revenue, upcoming rides, pending actions

**Why:** Pailin and Udorn live here. Shows at a glance what needs attention.

**Example:**

```
┌─────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ TODAY'S RIDES (March 22)                             │
│ ┌──────────────────────────────────────────────┐    │
│ │ 06:15 A1 "Early Bird"     [3/3 groups full] │    │
│ │ • 7 riders confirmed                         │    │
│ │ • 2 riders pending waiver ⚠️                  │    │
│ │ • Lead: Somchai, Support: Niran              │    │
│ │ • Weather: ✓ Clear                           │    │
│ │ • Revenue so far: 29,500 THB                 │    │
│ │ [View Bookings]  [Check In]  [Edit]         │    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
│ ┌──────────────────────────────────────────────┐    │
│ │ 16:45 C "Golden Hour"     [1/2 groups full] │    │
│ │ • 3 riders confirmed                         │    │
│ │ • Payment pending ⚠️  (Slip received)        │    │
│ │ • Lead: Pim, Support: [Not assigned] 🔴     │    │
│ │ • Weather: ✓ Clear                           │    │
│ │ • Revenue so far: 7,050 THB                  │    │
│ │ [View Bookings]  [Verify Payment]  [Edit]   │    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
│ PENDING ACTIONS                                      │
│ ⚠️ 2 PromptPay slips waiting for verification      │
│ ⚠️ 1 support rider not assigned                     │
│ ✓ Weather forecast: Clear next 3 days              │
│                                                      │
│ TODAY'S REVENUE: 36,550 THB                         │
└─────────────────────────────────────────────────────┘
```

---

### 2.3 "Site Configuration" vs "Operational Data" — The Critical Divide

This determines what lives in the database vs. where it displays:

#### **CONFIGURATION (Admin controls via dashboard)**
- **Time slots** (A1-D: times, names, overlaps)
- **Ride packages** (Duo/Squad/Peloton: min/max riders, prices, staff needs)
- **Bike rental prices** (Hybrid, Road)
- **Policies** (cancellation window, no-show handling, refund policy)
- **Payment methods** (PromptPay QR, bank details)
- **Website text** (hero headline, FAQ, terms & conditions)
- **Staff availability** (which leaders can lead which dates)
- **Promotional codes** (discount rules, date ranges)
- **Communication templates** (email subjects, LINE message templates)

**Location:** `site_config` table in Supabase
**Who edits:** Admins via dashboard UI
**How website reads it:** Query Supabase at page load or cache with short TTL

#### **OPERATIONAL DATA (Admin manages daily, website reads)**
- **Ride sessions** (which slots are open on which dates)
- **Bookings** (who booked what, payment status)
- **Riders** (per-person info in a booking)
- **Payments** (verification status, refunds)
- **Weather cancellations** (this slot is cancelled due to rain)

**Location:** `ride_sessions`, `bookings`, `riders`, `payments` tables
**Who edits:** Admins via dashboard
**How website reads it:** Real-time queries

#### **DESIGN (Code only, not in dashboard)**
- **Color scheme** (tailwind classes, CSS)
- **Layout structure** (where things go on the page)
- **Component behavior** (how booking flow works)

**Location:** Code (Next.js components)
**Who edits:** Developer (deployment required)
**Why separate:** Changing these every day would be chaotic; business doesn't need this flexibility

---

### 2.4 Mistake Prevention Safeguards

#### **Deletion Protection**

```
User clicks [Delete] on a ride package:

1. MODAL APPEARS:
   ┌───────────────────────────────────────┐
   │ Delete "The Squad"?                    │
   │                                        │
   │ ⚠️  WARNING: 5 active bookings use     │
   │    this package:                       │
   │    • March 23 A1 (3 riders)            │
   │    • March 24 B (5 riders)             │
   │    • March 25 C (4 riders)             │
   │                                        │
   │ You must cancel those bookings first   │
   │ or change them to "Duo".               │
   │                                        │
   │ [Cancel]  [Force Delete] (red, scary) │
   └───────────────────────────────────────┘

2. IF FORCE DELETE:
   • Bookings stay but package is "deleted"
   • Admins see a warning: "Squad no longer available"
   • Can restore from "Deleted Items" for 30 days
```

#### **Price Change Confirmation**

```
User edits Squad price from 2100 → 2500:

1. CONFIRMATION SHOWS:
   "This affects 12 pending bookings.
    • Customers already paid: 25,200 THB
    • New rate would require: 30,000 THB
    • Difference per group: +1,200 THB

    NEW BOOKINGS will use 2500/pp.
    EXISTING BOOKINGS keep 2100/pp."

2. OPTIONS:
   [Apply to new only]  [Apply to all]  [Cancel]
```

#### **Accidental Time Slot Change**

```
User tries to change A1 start time from 06:15 → 07:00:

SYSTEM CHECKS:
• 3 riders booked for March 23 A1
• Last booking is March 25
• 48-hour notice is required

ERROR: "Can't change start time: riders booked
       in next 7 days. Changing violates 48-hour
       notice rule. Create a new time slot instead."

SUGGESTION: "Copy A1 as 'A1 Late' with new time,
            apply to March 26+ only."
```

#### **Overbooking Prevention**

```
Current: 3 groups booked, max is 3

Admin clicks [Add] to allow 4th group:

DIALOG:
"Max Groups for A1 is currently 3.
 You have 3 groups booked (8 riders).

 If you increase to 4 groups, you allow
 up to 12 more riders on this date.

 PromptPay payment limit: 60,000 THB per day?

 [Keep at 3]  [Increase to 4]"
```

---

### 2.5 Mobile Admin Experience

**Constraint:** Pailin & Udorn use their phones at the track. Unreliable connection.

#### **Must-Have Mobile Features**

1. **Offline-first view of today's rides**
   - Cache today's bookings on load
   - Show rider names, bike prefs, emergency contacts
   - Works without internet

2. **Quick actions (minimal scrolling)**
   - Check in riders: ☑ Mark arrived
   - Verify payment: Tap to mark as verified
   - Note issues: "Broken spoke" → saves as note

3. **Simple modal dialogs (no complex forms)**
   - Never require more than 3 inputs per modal
   - Use dropdowns, not multi-step forms

4. **Large touch targets**
   - Buttons: 48px minimum
   - Text: 16px minimum (readable in sun)

5. **Dark mode for bright outdoors**
   - White text on dark background
   - Reduces eye strain

#### **Layout Pattern: Mobile-First**

```
DESKTOP (1024px+):
┌────────────┬──────────────────────────────┐
│ Nav        │ Main Content                  │
├────────────┼──────────────────────────────┤
│ • Rides    │ Today's Rides (4 columns)    │
│ • Config   │ Bookings (table view)        │
│ • Reports  │ Revenue chart                │
│ • Staff    │                              │
└────────────┴──────────────────────────────┘

MOBILE (375px):
┌──────────────────────────────┐
│ [≡] EN-JOY SPEED             │
├──────────────────────────────┤
│ TODAY'S RIDES (1 per screen)  │
│                               │
│ ┌────────────────────────────┐│
│ │ 06:15 A1                   ││
│ │ 3/3 groups, 7 riders       ││
│ │ 2 waivers pending ⚠        ││
│ │ [VIEW] [CHECK IN] [...] │││
│ └────────────────────────────┘│
│                               │
│ ┌────────────────────────────┐│
│ │ 16:45 C                    ││
│ │ 1/2 groups, 3 riders       ││
│ │ Payment pending ⚠          ││
│ │ [VIEW] [VERIFY] [...]      ││
│ └────────────────────────────┘│
│                               │
│ [MORE RIDES]                  │
│                               │
│ ┌────────────────────────────┐│
│ │ TODAY'S REVENUE             │
│ │ 36,550 THB                 ││
│ └────────────────────────────┘│
└──────────────────────────────┘
```

---

### 2.6 The "Solo Traveller" Example — Adding a Completely New Format

**Scenario:** Market research shows solo cyclists want to join; currently must find partner to book Duo.

**Goal:** Add "Solo" format (1 rider) at 2800/pp (premium over Duo).

#### **Current State**
- `RIDE_PACKAGES` constant in code has only Duo/Squad/Peloton
- Website only shows 3 options
- Booking form hardcoded for these 3

#### **With New Admin Dashboard — Admin Can Do This Themselves**

**Step 1: Add package via dashboard**

```
[Ride Packages] → [+ Add Package]

Form:
┌─────────────────────────────────────┐
│ Package Name:     [Solo             │
│ Min Riders:       [1                │
│ Max Riders:       [1                │
│ Price per Person: [2800             │
│ Leaders:          [1                │
│ Support Riders:   [0                │
│ Active:           [✓]               │
│ Description:      [Perfect for      │
│                    experienced      │
│                    cyclists...]     │
│                                     │
│ [Save]            [Cancel]          │
└─────────────────────────────────────┘
```

**Happens instantly:**
- `site_config` table gets new row
- Website queries this table at page load
- Next visitor sees "Solo" as option
- Booking form accepts 1 rider
- Payment calculation updates automatically

**Step 2: Set availability**

```
[Availability] → Select dates → [Time Slots]

"Which time slots can Solo riders book?"
☑ A1 (Early Bird)
☑ A2 (Energy Booster)
☑ B (Light Chaser)
☑ C (Golden Hour)
☑ D (Twilight Finish)

[Save]
```

**Step 3: Test on website (optional)**

```
Go to website → "Book Now" → See "Solo" option
No developer needed.
```

**Step 4: Monitor initial bookings**

```
Dashboard → Reports → "Solo bookings this week"
See: 2 solo riders booked (revenue: 5,600 THB)
If popular, Pailin & Udorn can adjust pricing/availability
```

#### **What Still Requires a Developer**

- Changing the UI of the booking form (e.g., adding a "Solo perks" callout)
- Changing the home page messaging for solo riders
- Adding a "Solo leaderboard" or badge system

**Key insight:** Database changes ≠ code changes. Business changes are 99% database.

---

### 2.7 Preventing Mistakes: Smart Defaults & Validation

#### **Field-Level Validation**

```javascript
// Example: Price field
pricePerPerson: {
  type: "number",
  min: 500,        // "Price seems too low"
  max: 10000,      // "Price seems very high"
  step: 100,       // Only 100-baht increments (clean)
  validation: (val) => {
    if (val < previousPrice * 0.8) {
      return "Price dropped >20%. Are you sure?"
    }
  }
}
```

#### **Smart Defaults**

```
When adding a new ride package:

"New Package"
Min Riders:  [1]      (not 0)
Max Riders:  [8]      (based on largest existing)
Price/pp:    [2100]   (average of others)
Leaders:     [1]      (minimum safe)
Support:     [0]      (can increase if needed)
```

#### **Conflict Detection**

```
Admin tries to create A1 at 06:15 with 2-hour duration:
• Overlaps with A2 (which they already created)
• Shows warning with "Overlaps" field populated

Admin tries to set Duo at 5 max riders:
• Conflicts with business logic (Duo is 2 only)
• Can't save; shows error

Admin tries to mark a slot as "Cancelled" with active bookings:
• Shows: "3 riders will be affected. Issue refund/rain credit?"
• Auto-generate refund transactions
```

---

## PART 3: Technical Approach

### 3.1 Database Architecture — The Critical Move

#### **Current Problem**
- Time slots, packages, prices hardcoded in `src/lib/constants.ts`
- Changing anything requires code edit + deployment
- Non-technical admins can't touch this

#### **Solution: Configuration Tables**

Add these tables to Supabase alongside existing schema:

```sql
-- CONFIGURATION TABLES (new)
create table public.site_config (
  id text primary key,  -- 'booking_advance_hours', 'currency', etc.
  value text not null,  -- JSON stringified value
  type text,            -- 'string', 'number', 'json', 'boolean'
  description text,     -- "Min hours before a booking can be made"
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

create table public.time_slots (
  id text primary key,  -- 'A1', 'A2', 'B', 'C', 'D'
  label text not null,  -- 'Early Bird', 'Energy Booster', etc.
  start_time text not null,  -- '06:15' (HH:MM)
  end_time text not null,    -- '08:15'
  period text not null,      -- 'morning' or 'evening'
  display_order smallint,    -- for ordering on website
  is_active boolean default true,
  created_at timestamptz,
  updated_at timestamptz,
  updated_by uuid references public.profiles(id)
);

create table public.ride_packages (
  id text primary key,  -- 'duo', 'squad', 'peloton', 'solo'
  name text not null,   -- 'Duo', 'The Squad', etc.
  description text,     -- "Perfect for 2 cyclists"
  min_riders smallint not null,
  max_riders smallint not null,
  price_per_person integer not null,  -- in THB
  leader_count smallint default 1,
  support_rider_count smallint default 0,
  is_active boolean default true,
  display_order smallint,
  created_at timestamptz,
  updated_at timestamptz,
  updated_by uuid references public.profiles(id)
);

create table public.bike_types (
  id text primary key,  -- 'hybrid', 'road', 'own'
  name text not null,
  rental_price integer not null,  -- 0 for 'own'
  total_available smallint,        -- bike count (optional)
  description text,
  is_active boolean default true,
  created_at timestamptz,
  updated_at timestamptz,
  updated_by uuid references public.profiles(id)
);

create table public.starter_kit_items (
  id uuid primary key,
  item_name text not null,  -- 'Padded Shorts', 'Energy Gel', etc.
  quantity integer default 1,
  is_active boolean default true,
  display_order smallint,
  description text,
  created_at timestamptz,
  updated_at timestamptz,
  updated_by uuid references public.profiles(id)
);

create table public.promotional_codes (
  id uuid primary key,
  code text unique not null,  -- 'SPRING20', 'REFERRAL'
  description text,
  discount_type text not null,  -- 'percentage', 'fixed_amount'
  discount_value integer not null,  -- 20 (for 20%) or 500 (THB)
  max_uses integer,  -- null = unlimited
  max_uses_per_customer integer default 1,
  valid_from timestamptz,
  valid_until timestamptz,
  applies_to_packages text[],  -- null = all, or ['duo', 'squad']
  is_active boolean default true,
  uses_count integer default 0,
  created_at timestamptz,
  updated_at timestamptz,
  updated_by uuid references public.profiles(id)
);

create table public.policies (
  id text primary key,  -- 'cancellation', 'refund', 'no_show', 'rain_credit'
  title text not null,
  content text not null,  -- Can be markdown or HTML
  effective_date date,    -- When this policy goes live
  version integer default 1,
  is_active boolean default true,
  created_at timestamptz,
  updated_at timestamptz,
  updated_by uuid references public.profiles(id)
);

create table public.website_content (
  id text primary key,  -- 'hero_headline', 'faq_question_1', etc.
  section text,         -- 'hero', 'faq', 'about', 'footer'
  title text,
  content text,         -- HTML/markdown
  image_url text,
  button_text text,
  button_link text,
  is_published boolean default true,
  display_order smallint,
  created_at timestamptz,
  updated_at timestamptz,
  updated_by uuid references public.profiles(id)
);

create table public.time_slot_overlaps (
  id uuid primary key,
  time_slot_id_a text not null references public.time_slots(id),
  time_slot_id_b text not null references public.time_slots(id),
  unique(time_slot_id_a, time_slot_id_b)
);
```

#### **Migration Strategy**

1. **Create new tables** (doesn't break anything)
2. **Backfill with current constants**
   ```sql
   INSERT INTO public.time_slots (id, label, start_time, end_time, period)
   VALUES ('A1', 'Early Bird', '06:15', '08:15', 'morning');
   -- etc.
   ```

3. **Update code to read from Supabase instead of constants**
   ```typescript
   // OLD:
   import { TIME_SLOTS } from '@/lib/constants'

   // NEW:
   import { getTimeSlots } from '@/lib/actions/config'
   const timeSlots = await getTimeSlots()
   ```

4. **Add RLS policies** so only admins can edit
   ```sql
   create policy "Admins can manage time slots"
   on public.time_slots
   for all
   using (public.is_admin());
   ```

5. **Deprecate old constants** (don't delete yet; use as fallback)

---

### 3.2 Admin Dashboard Structure

#### **Tech Stack**

```
Frontend:
- Next.js 16 (already in use)
- React 19 (already in use)
- TanStack Table for table UI
- React Hook Form + Zod for validation
- Tailwind CSS (already in use)
- Framer Motion for transitions

Backend:
- Supabase (already set up)
- Existing TypeScript actions layer

No new major dependencies needed.
```

#### **Directory Structure**

```
/src/app/admin/
├── layout.tsx                 # Admin shell (sidebar, header)
├── page.tsx                   # Admin dashboard home
├── config/
│   ├── page.tsx              # Config main page
│   ├── time-slots/
│   │   ├── page.tsx          # List time slots
│   │   └── [id]/edit.tsx     # Edit individual slot
│   ├── packages/
│   │   ├── page.tsx
│   │   └── [id]/edit.tsx
│   ├── bikes/page.tsx
│   ├── policies/page.tsx
│   └── website-content/page.tsx
├── availability/
│   ├── page.tsx              # Calendar view of all sessions
│   ├── [date]/page.tsx       # Edit sessions for a date
│   └── bulk-import.tsx       # Import from Excel (future)
├── bookings/
│   ├── page.tsx              # List all bookings
│   ├── [id]/page.tsx         # View/edit single booking
│   └── reports.tsx           # Analytics
├── staff/
│   ├── page.tsx              # Manage leaders & support riders
│   └── [id]/page.tsx
└── settings.tsx              # Account, backup, export data

/src/lib/actions/
├── admin-config.ts           # Server actions for config tables
├── admin-availability.ts     # Server actions for ride sessions
├── admin-bookings.ts         # Server actions for bookings
├── admin-staff.ts            # Server actions for staff
└── admin-reports.ts          # Server actions for analytics

/src/components/admin/
├── ConfigTable.tsx           # Reusable table for CRUD
├── InlineEdit.tsx            # Reusable inline edit cell
├── AvailabilityCalendar.tsx  # Calendar picker
├── BookingDetailModal.tsx    # View/edit booking modal
├── DashboardCard.tsx         # Info cards on dashboard
└── AdminSidebar.tsx          # Nav for admin section
```

---

### 3.3 Real-Time Data Flow

#### **Goal:** Changes appear immediately on website

#### **Pattern 1: Client-Side Caching**

```typescript
// /src/lib/actions/config.ts (server action)
'use server'

import { createClient } from '@/lib/supabase/server'

// Cached for 5 minutes
const CACHE_TTL = 5 * 60 * 1000

let configCache: any = null
let cacheTime = 0

export async function getTimeSlots() {
  const now = Date.now()

  // Return cache if fresh
  if (configCache?.timeSlots && (now - cacheTime) < CACHE_TTL) {
    return configCache.timeSlots
  }

  // Fetch from DB
  const supabase = createClient()
  const { data } = await supabase
    .from('time_slots')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  // Update cache
  configCache = { ...configCache, timeSlots: data }
  cacheTime = now

  return data
}

export async function updateTimeSlot(id: string, updates: any) {
  const supabase = createClient()

  // Update DB
  const { data, error } = await supabase
    .from('time_slots')
    .update(updates)
    .eq('id', id)
    .select()

  // Invalidate cache
  configCache = null
  cacheTime = 0

  return { data, error }
}
```

#### **Pattern 2: Revalidation on Save**

```typescript
// Admin saves a time slot change
export async function updateTimeSlot(id: string, updates: any) {
  // ... update in DB ...

  // Revalidate cached data
  revalidatePath('/') // Home page
  revalidatePath('/booking') // Booking page
  revalidatePath('/admin') // Admin dashboard

  // Optional: trigger real-time via Supabase subscription
  return { success: true, data }
}
```

#### **Pattern 3: WebSocket for Real-Time (optional, not critical)**

```typescript
// If Pailin changes pricing and Udorn is viewing the config page,
// show a notification: "Pricing updated!"

// Use Supabase Realtime channel:
supabase
  .channel('ride_packages')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'ride_packages' },
    (payload) => {
      // Refresh table on screen
      refetch()
      toast.success('Configuration updated by ' + payload.new.updated_by)
    }
  )
  .subscribe()
```

---

### 3.4 Admin Authentication & Permissions

#### **Current Setup (from schema)**

```sql
-- Profiles table has 'role' field
role text not null default 'customer'
  check (role in ('customer', 'admin', 'leader'))
```

#### **Enhance With Fine-Grained Permissions**

```sql
-- New table for admin roles & permissions
create table public.admin_roles (
  id uuid primary key,
  name text not null,  -- 'Super Admin', 'Operations', 'Finance'
  description text,
  permissions jsonb not null,  -- {'bookings.view', 'config.edit', 'reports.view'}
  created_at timestamptz
);

create table public.admin_users (
  user_id uuid primary key references public.profiles(id),
  role_id uuid references public.admin_roles(id),
  last_login_at timestamptz,
  is_active boolean default true
);

-- Permissions: Super Admin (Pailin) has all.
--              Ops Manager (Udorn) has bookings, availability, staff.
--              Finance role would have payments & reports (future).
```

#### **Middleware Check**

```typescript
// /src/middleware.ts

export function middleware(request: NextRequest) {
  // If accessing /admin/*
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const user = request.auth?.user
    const role = user?.role  // from profiles table

    if (!user || role !== 'admin') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}
```

---

### 3.5 The "Line Between Code & Config" — Actionable Rules

#### **Config (Database): Can Change Without Deployment**

1. **Time slots** — Add/edit A1-D times, names, periods
2. **Ride packages** — Pricing, min/max riders, package names
3. **Bike prices** — Rental costs for hybrid/road/own
4. **Policies** — Cancellation terms, refund rules (text content)
5. **Website text** — Hero headlines, FAQ, terms, footer links
6. **Promotional codes** — Discount rules, date ranges
7. **Staff assignments** — Who leads which session
8. **Availability** — Which dates/slots are open/closed
9. **Weather status** — Mark sessions as cancelled due to rain
10. **Booking restrictions** — Min advance booking hours

#### **Code: Requires Deployment**

1. **Booking flow UI** — Steps, form layout, validation screens
2. **Home page design** — Section arrangement, color, fonts
3. **Email templates** — Layout, embedded links (can have variable placeholders, but structure is code)
4. **Payment integration** — PromptPay QR generation, bank transfer logic
5. **Rider check-in flow** — How leaders mark riders as arrived
6. **Report graphs** — Chart types, breakdowns
7. **Admin dashboard layout** — Where cards appear, sidebar structure
8. **New features** — Loyalty system, reviews, notifications

#### **Grey Zone (Hybrid)**

- **Email/LINE message content** — Text can be config, but send logic is code
- **FAQ content** — Config, but if adding new Q&A category, may need UI change (minor code)
- **Home page images** — Config (URL), but hero section layout is code
- **Starter kit items** — Config table exists, but if adding "helmet included" feature, that's code

---

### 3.6 Practical Example: Implementing a New Promotional Code

**Goal:** Create a "RAIN20" code that gives 20% off bookings in May-June rain season, max 500 THB discount.

#### **Step 1: Admin Creates Code (No Developer)**

```
/admin/config/promotions → [+ Add Code]

Form:
┌──────────────────────────────────────┐
│ Promo Code:      [RAIN20             │
│ Description:     [Rainy season sale  │
│ Discount Type:   [Percentage]        │
│ Discount Value:  [20]                │
│ Max Discount:    [500] THB           │
│ Valid From:      [2026-05-01]        │
│ Valid Until:     [2026-06-30]        │
│ Max Uses:        [100] (0 = unlim)   │
│ Max per Customer:[1]                 │
│ Applies to:      [☑ Duo ☑ Squad     │
│                   ☑ Peloton]         │
│ Status:          [✓ Active]          │
│                                      │
│ [Save]          [Preview]            │
└──────────────────────────────────────┘
```

#### **Step 2: Code Already Supports This**

```typescript
// /src/lib/actions/bookings.ts already has:

export async function validatePromoCode(
  code: string,
  amount: number,
  groupType: GroupType
): Promise<{ valid: boolean; discount: number; message?: string }> {
  const supabase = createClient()

  const { data: promo } = await supabase
    .from('promotional_codes')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  // Validation checks:
  if (!promo) return { valid: false, discount: 0, message: 'Code not found' }
  if (new Date() > new Date(promo.valid_until))
    return { valid: false, discount: 0, message: 'Code expired' }
  if (promo.uses_count >= promo.max_uses && promo.max_uses)
    return { valid: false, discount: 0, message: 'Code exhausted' }
  if (promo.applies_to_packages && !promo.applies_to_packages.includes(groupType))
    return { valid: false, discount: 0, message: 'Not valid for this package' }

  // Calculate discount
  let discount = 0
  if (promo.discount_type === 'percentage') {
    discount = Math.floor(amount * promo.discount_value / 100)
  } else {
    discount = promo.discount_value
  }

  // Cap at max_discount
  if (promo.max_discount) {
    discount = Math.min(discount, promo.max_discount)
  }

  return { valid: true, discount }
}
```

**No code changes needed.** The booking form already calls this function, which reads from the database.

#### **Step 3: Code Appears on Website Automatically**

- When customer enters "RAIN20" during checkout, system validates against `promotional_codes` table
- Discount is calculated
- Invoice shows: "Discount (RAIN20): -500 THB"
- Payment amount is reduced

**Timeline:** Admin creates code at 2pm. Website accepts it by 2:05pm (after cache refresh).

---

### 3.7 Handling Missing Features Gracefully

**Example:** Promo codes are configured, but email confirmation doesn't mention the code.

#### **Option A: Accept Email Gap (Simple)**
- Email shows "You saved 500 THB" but doesn't mention the code
- Website + invoice shows the code
- Acceptable: email isn't transactional accounting, just confirmation

#### **Option B: Add Code to Email Template (Code Change)**
```typescript
// /src/lib/actions/notifications.ts

const emailTemplate = (booking: Booking, promoCode?: string) => `
  Dear ${booking.contact_name},

  Your booking is confirmed!
  ...
  ${promoCode ? `
    Promo Code: ${promoCode}
    Discount: -${booking.discount} THB
  ` : ''}
  ...
`
```

**Decision:** Option B is better. But it's a small code change that Pailin doesn't need to do.

---

### 3.8 Export & Backup for Non-Technical Safety

**Fear:** "What if the database is corrupted? I lose all my config."

**Solution: Admin Export Feature**

```typescript
// /admin/settings → [Export Data]

export async function exportAdminConfig() {
  const supabase = createClient()

  const [
    timeSlots,
    packages,
    bikeTypes,
    policies,
    promos,
    content,
  ] = await Promise.all([
    supabase.from('time_slots').select('*'),
    supabase.from('ride_packages').select('*'),
    supabase.from('bike_types').select('*'),
    supabase.from('policies').select('*'),
    supabase.from('promotional_codes').select('*'),
    supabase.from('website_content').select('*'),
  ])

  const backup = {
    exported_at: new Date().toISOString(),
    time_slots: timeSlots.data,
    packages: packages.data,
    // ... etc
  }

  // Download as JSON
  return JSON.stringify(backup, null, 2)
}
```

**UI:**
```
/admin/settings → "Backup & Export"

Last backup: March 22, 2:15 PM (automatic daily)
┌──────────────────────────────┐
│ [Download Full Backup (JSON)] │
│ [Import Backup]              │
│ [View Backup History]        │
└──────────────────────────────┘

This JSON contains all configuration.
Keep it safe. If disaster, show to developer
to restore.
```

---

### 3.9 Deployment Checklist

#### **Phase 1: Database Schema (Day 1)**

- [ ] Create new config tables (time_slots, ride_packages, bike_types, etc.)
- [ ] Migrate current constants to database
- [ ] Add RLS policies for admin access
- [ ] Create indexes for fast lookups
- [ ] Test with existing website (should still work, using fallback constants)

#### **Phase 2: Admin Dashboard (Week 1-2)**

- [ ] Build `/admin/config` pages for each entity
- [ ] Implement inline editing pattern
- [ ] Add validation & error handling
- [ ] Add delete/restore safeguards
- [ ] Mobile responsive testing

#### **Phase 3: Website Reads Config (Week 2)**

- [ ] Update home page to read from `website_content` table
- [ ] Update booking form to read from `ride_packages`, `time_slots`
- [ ] Update bike rental to read from `bike_types`
- [ ] Add caching layer
- [ ] Remove hardcoded constants from code

#### **Phase 4: Operational Features (Week 3)**

- [ ] Availability calendar management
- [ ] Booking CRUD in admin dashboard
- [ ] Payment verification UI
- [ ] Staff assignments
- [ ] Weather cancellations

#### **Phase 5: Reports (Week 4)**

- [ ] Daily revenue dashboard
- [ ] Bookings by package / by date
- [ ] No-show rate
- [ ] Customer feedback summary

#### **Phase 6: Polish & Launch (Week 5)**

- [ ] Mobile testing on-site
- [ ] Training sessions with Pailin & Udorn
- [ ] Offline mode for mobile
- [ ] Backup export feature
- [ ] Go live

---

## PART 4: Recommended Admin UX Patterns (Stealing from Industry Leaders)

### What Makes Shopify, Square, and Airbnb Host Dashboard Work

#### **1. Shopify Products Page**
- **Why it works:** Inline editing, bulk actions, filters
- **Pattern we steal:** Product name/SKU are click-to-edit cells; bulk edit pricing

#### **2. Square Dashboard**
- **Why it works:** Cards showing pending actions (verify payment, no-show riders)
- **Pattern we steal:** Prominent alerts with action buttons ("2 payments pending verification")

#### **3. Airbnb Host Dashboard**
- **Why it works:** Calendar view for availability + detailed view for single date
- **Pattern we steal:** Click date → see all bookings for that slot → click booking → edit inline

#### **4. Stripe Payments**
- **Why it works:** Copy-friendly values (PaymentID, PromptPay Ref); clear status colors
- **Pattern we steal:** Status badges (green=verified, yellow=pending, red=failed)

#### **5. Canva Team Dashboard**
- **Why it works:** Dark mode, touch-friendly buttons, zero scrolling on mobile
- **Pattern we steal:** Bottom sheet modals (slide up from bottom), not center dialogs

---

## Final Recommendations & Implementation Priority

### **Tier 1: Critical for Day 1 (Don't launch without)**

1. **Admin dashboard home** (today's bookings, revenue, alerts)
2. **Time slot management** (create/edit A1-D, names, times)
3. **Ride package management** (Duo/Squad/Peloton pricing, min/max riders)
4. **Availability calendar** (mark dates as open/closed)
5. **Booking view** (see all bookings, payment status, mark as no-show)
6. **Payment verification** (verify PromptPay slips, issue refunds)

### **Tier 2: High Value (Weeks 2-3)**

7. **Promotional code management** (create discount codes)
8. **Staff assignments** (assign leaders to sessions)
9. **Reports** (daily revenue, bookings by package)
10. **Website content** (edit hero headline, FAQ, policies)

### **Tier 3: Nice to Have (Weeks 4+)**

11. **Bike inventory tracking** (how many hybrids/roads available)
12. **Customer loyalty** (track repeat bookings, send perks)
13. **AI-powered pricing** (suggest price changes based on demand)
14. **Automated notifications** (24h before ride, weather alerts)

---

## Key Success Metrics

Measure success by:

1. **Time to change a price:** Goal <1 minute (currently: developer + deployment = 1 hour)
2. **Confidence level:** Pailin & Udorn report 90%+ confidence making changes alone
3. **Mistake recovery:** Any admin error can be fixed in <5 minutes via restore
4. **Mobile usability:** Can manage a ride day entirely from phone
5. **Offline resilience:** Cache allows viewing today's bookings with no connection

---

## Summary

The En-Joy Speed admin dashboard should be:

1. **Database-first** — All business changes (prices, times, packages) live in Supabase, not code
2. **Spreadsheet-familiar** — Inline editing, tables, simple forms (Excel users should get it immediately)
3. **Real-time safe** — Changes appear on website within 5 minutes, no deployment needed
4. **Mobile-optimized** — Designed for use at the track, on phones, in sun
5. **Mistake-proof** — Safeguards prevent accidental deletion; clearly show downstream impacts before confirming
6. **Simple first** — 80% of daily work should be 1-3 clicks; only complex operations need modals

This design lets Pailin and Udorn control their entire business without touching code, exactly like Shopify lets sellers manage stores without learning programming.

