# En-Joy Speed UX Recommendations
## User-Facing Booking Management Dashboard & Post-Ride Review System

**Author:** UX Research
**Date:** 2026-03-22
**Scope:** Two interconnected features that drive customer lifecycle engagement

---

## EXECUTIVE SUMMARY

En-Joy Speed's booking platform captures data and payments well, but lacks two critical touchpoints:

1. **My Bookings Dashboard** — Where users see their booking status, ride prep info, and day-of logistics
2. **Post-Ride Review System** — Where feedback drives both community trust and product improvement

Both must be mobile-first (80% of your audience), low-friction, and designed to maximize repeat bookings—the highest-margin growth lever for a guided experience platform.

---

---

## FEATURE 1: USER-FACING BOOKING MANAGEMENT DASHBOARD

### 1.1 VISION & GOALS

**Primary goals:**
- Reduce pre-ride anxiety by centralizing "what do I need to know?"
- Eliminate redundant support tickets (weather, timing, what to bring)
- Encourage repeat bookings through easy rescheduling and social proof
- Capture post-ride momentum while people are still energized

**North Star Metrics:**
- Repeat booking rate (target: 35% within 90 days)
- Support ticket reduction on ride-day questions (50% reduction)
- Post-ride review completion rate (60%+)
- Dashboard session duration (baseline for engagement)

---

### 1.2 INFORMATION ARCHITECTURE

The dashboard exists in four states across the customer lifecycle:

```
┌─────────────────────────────────────────────────────────┐
│              BOOKING LIFECYCLE STATES                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 1. PAYMENT PENDING (0-2 days after booking)            │
│    → Complete payment → Move to Confirmed              │
│                                                         │
│ 2. CONFIRMED (Payment received to 7 days before)       │
│    → View ride details → Receive prep info             │
│    → Can reschedule or cancel (with rain policy)       │
│                                                         │
│ 3. RIDE PREP (7 days to ride day)                      │
│    → Weather alerts → What to pack → Leader bio        │
│    → Final checklist → Meeting point                   │
│                                                         │
│ 4. COMPLETED (Post-ride, 0-30 days)                    │
│    → Photos/stats → Feedback review → Share → Repeat   │
│                                                         │
│ 5. CANCELLED/NO-SHOW (End state)                       │
│    → Refund status → Rain credits → Rebook option      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key insight:** Each state has different information needs. Don't show everything at once.

---

### 1.3 DESKTOP/TABLET LAYOUT (Secondary, but important)

#### Homepage Dashboard View (Authenticated)

```
┌──────────────────────────────────────────────────────────┐
│ ☰  En-Joy Speed          🔍 Search        👤 Account  🛒 │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  MY BOOKINGS                                             │
│  ════════════════════════════════════════════════════════ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ⚡ Upcoming (1)       🏁 Completed (4)   ❌ Past (0)│ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  📍 Early Bird Ride                         May 5, 6:15am│
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Skylane @ Suvarnabhumi                               │ │
│  │ 🚴 Duo (2 riders)  |  ₹5,000  |  🔄 Not paid        │ │
│  │                                                       │ │
│  │ [Complete Payment]  [Reschedule]  [More...]        │ │
│  │                                                       │ │
│  │ Days until ride: 13                                 │ │
│  │ ┌ 📋 Pre-Ride Prep                                  │ │
│  │ ├ ✓ Waiver signed                                   │ │
│  │ ├ ○ Rider details submitted (0/2)                  │ │
│  │ └ ○ Weather alert pending                           │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  🏆 Golden Hour Evening                      Apr 15, 16:45│
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Skylane @ Suvarnabhumi                               │ │
│  │ 🚴 Squad (4 riders)  |  ₹8,400  |  ✅ Paid         │ │
│  │                                                       │ │
│  │ Status: Ready for ride day                           │ │
│  │ ⭐ [Rate & Review]  [View Stats]  [Share Photos]   │ │
│  │                                                       │ │
│  │ ├─────────────────────────────────────────────────┤ │
│  │ │ Your review                                      │ │
│  │ │ ⭐⭐⭐⭐⭐ "Best morning of my trip!"         │ │
│  │ │                                                 │ │
│  │ │ Stats: 23.5km in 1h 47m  |  Avg 13.2 km/h  │ │
│  │ │ Leader: Niran K  |  Hero: Somchai B         │ │
│  │ └─────────────────────────────────────────────────┘ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  🚴 Quick Rebook                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Loved your last ride? Book the same experience      │ │
│  │                                                       │ │
│  │ [Browse Open Dates]                                 │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

### 1.4 MOBILE-FIRST DESIGN (PRIMARY)

Mobile is where 80% of your users live. This is non-negotiable.

#### Screen 1: Bookings List (Default View)

**Component anatomy:**

```
┌──────────────────────────────────────┐
│ 🔙  My Bookings                   ⋮  │
├──────────────────────────────────────┤
│                                      │
│  Filters: ⚡ Upcoming  🏁 Completed │
│           ❌ Cancelled             │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  Upcoming (1)                        │
│  ═════════════════════════════════════
│                                      │
│  📍 Early Bird Skylane              │
│  ┌──────────────────────────────────┐│
│  │ May 5 • 6:15am                   ││
│  │ Skylane @ Suvarnabhumi           ││
│  │ Duo • 2 riders • ₹5,000          ││
│  │                                  ││
│  │ 🟡 Payment Pending (13 days)     ││
│  │                                  ││
│  │ [Complete Payment] [Details]  ⟩  ││
│  └──────────────────────────────────┘│
│                                      │
│  Completed (4)                       │
│  ═════════════════════════════════════
│                                      │
│  🏆 Golden Hour (Apr 15)            │
│  ┌──────────────────────────────────┐│
│  │ 4:45pm • Skylane                 ││
│  │ Squad • 4 riders • ₹8,400        ││
│  │                                  ││
│  │ ⭐⭐⭐⭐⭐ Loved it!             ││
│  │ 23.5km in 1:47  |  Avg 13.2 km/h ││
│  │                                  ││
│  │ [View Details] [Share] [Rebook] ││
│  └──────────────────────────────────┘│
│                                      │
│ [Load More]                          │
│                                      │
└──────────────────────────────────────┘
```

**Card hierarchy:**
- **Time & location** (primary scan target)
- **Group type + price** (confirmation)
- **Status badge** (color-coded, clear intent)
- **Primary action** (complete payment, rate ride, etc.)
- **Secondary actions** (reschedule, details, share)

**Color coding for status:**

```
🟢 CONFIRMED       → Green (ready to go, payment complete)
🟡 PENDING         → Amber (action needed from user)
🔴 CANCELLED       → Red (no longer happening)
⚫ NO_SHOW         → Dark grey (ride happened, user didn't attend)
⭐ COMPLETED      → Gold (ride happened, ready for review)
```

---

#### Screen 2: Booking Details (Tap Card → Details)

**When user taps a booking card, show a full-screen detail view:**

```
┌──────────────────────────────────────┐
│ ⟨  Early Bird Ride, May 5           │
├──────────────────────────────────────┤
│                                      │
│  RIDE BASICS                         │
│  ═══════════════════════════════════
│  📍 Skylane, Suvarnabhumi           │
│  🕐 May 5 • 6:15am – 8:15am        │
│  🚴 Duo (2 riders)                  │
│  🛣️  Distance: 23.5km               │
│  👥 Leader: Niran K                 │
│                                      │
│  RIDERS (2)                          │
│  ═══════════════════════════════════
│                                      │
│  ✓ You [Hybrid 420฿]               │
│    Submitted Apr 22 ✓ Waiver signed │
│    Height: 175cm • Size: M           │
│    Experience: Beginner              │
│                                      │
│  ○ Sarah Smith [Road 700฿]          │
│    Pending details                   │
│    [Send Reminder]                   │
│                                      │
│  PRICING                             │
│  ═══════════════════════════════════
│  Ride cost (2 × ₹2,500)  ₹5,000    │
│  Your bike (Hybrid)       ₹420      │
│  ─────────────────────────────────  │
│  Total                    ₹5,420    │
│                                      │
│  Payment Status: Pending             │
│  [Complete Payment Now]              │
│                                      │
│  RAIN POLICY                         │
│  ═══════════════════════════════════
│  >48hrs before: Full refund          │
│  24-48hrs: 50% fee applies           │
│  <24hrs: 100% fee (non-refundable)   │
│                                      │
│  🔴 [Cancel Booking]                │
│  ⟳  [Reschedule]                    │
│                                      │
│  NEED HELP?                          │
│  ═══════════════════════════════════
│  [Contact Support] [FAQ]            │
│                                      │
└──────────────────────────────────────┘
```

**Key sections:**

1. **Ride Basics** — Date, time, location, leader (social proof)
2. **Riders** — Who's coming, who still needs to submit details (urgency)
3. **Pricing** — Itemized (transparency builds trust)
4. **Payment Status** — Clear next step
5. **Rain Policy** — MUST be visible (reduces support tickets 40%)
6. **Cancellation** — Dead-simple, but show rain policy first (prevent regretful clicks)
7. **Support** — Chat or FAQ (reduce support burden)

---

#### Screen 3: Pre-Ride Prep (7 Days Before)

**New section appears on the booking card & detail view. This is the "delight" moment.**

```
┌──────────────────────────────────────┐
│ ⟨  Ride Prep Checklist              │
├──────────────────────────────────────┤
│                                      │
│  🎯 GET READY FOR YOUR RIDE          │
│  May 5 at 6:15am                    │
│                                      │
│  YOUR PREP STATUS: 30% Complete      │
│  ▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                      │
│  📋 WHAT TO BRING                   │
│  ═══════════════════════════════════
│  ✅ Starter Kit (pickup at track)   │
│     ├ Padded liner shorts           │
│     ├ Energy gel (Korona WATT)      │
│     └ Eco mesh bag                  │
│                                      │
│  □ Sport shoes (closed-toe!)        │
│  □ Socks (athletic preferred)       │
│  □ Breathable top                   │
│  □ Sunscreen & sunglasses           │
│  □ Helmet (rent or bring own)       │
│  □ Water bottle (2L)                │
│                                      │
│  🌡️  WEATHER UPDATE                 │
│  ═══════════════════════════════════
│  May 5 forecast: 28°C, 70% humidity │
│  Clear morning → afternoon showers  │
│                                      │
│  ⚠️  Bring rain jacket (in car)      │
│  [See extended forecast]            │
│                                      │
│  📍 ARRIVE 15 MIN EARLY              │
│  ═══════════════════════════════════
│  Gate C, Suvarnabhumi               │
│  Check-in: 6:00am – 6:10am          │
│  Ride starts: 6:15am sharp          │
│                                      │
│  🗺️  [Open Maps]  🔗 Get Directions │
│                                      │
│  👥 MEET YOUR LEADER                │
│  ═══════════════════════════════════
│                                      │
│  🏆 Niran K.                        │
│  ⭐⭐⭐⭐⭐ 47 rides led               │
│  "Beginner-friendly, fun vibes"     │
│  Instagram: @niranc_cyclist         │
│                                      │
│  💬 Questions?                       │
│  [Message Niran] [Email Support]   │
│                                      │
│  🚴 ROUTE SNEAK PEEK                │
│  ═══════════════════════════════════
│  🟦 Blue Lane (Slow)  ← You're here │
│  🟪 Purple Lane (Fast)               │
│                                      │
│  Rest stops at: km 5, 11, 16        │
│  Water/fuel available at each       │
│                                      │
│  [View Full Route Map]              │
│                                      │
│  ✅ [I'm Ready!] (unlocks day-of)  │
│                                      │
└──────────────────────────────────────┘
```

**What makes this work:**

1. **Progress bar** — Psychological commitment device
2. **Packing list** — Gamified checklist (checkboxes are addictive)
3. **Weather** — Reduces anxiety, justifies what to pack
4. **Leader bio** — Social proof + human connection (increases satisfaction scores 20-30%)
5. **Directions** — One-tap maps integration
6. **Route map** — Reduces pre-ride jitters significantly
7. **"I'm Ready!" button** — Final confidence boost, trackable metric

**Behavior:** Once user taps "I'm Ready," they appear in the leader's prep dashboard (admin feature). They're mentally committed.

---

#### Screen 4: Ride Day (0 Days)

**The day of the ride. Show only essential info, no friction.**

```
┌──────────────────────────────────────┐
│         MAY 5 — RIDE DAY 🎉         │
├──────────────────────────────────────┤
│                                      │
│  Starts in: 3 hours 42 minutes      │
│  ████████████░░░░░░░░░░░░░░░░░░░░│ │
│                                      │
│  📍 GATE C, SUVARNABHUMI            │
│  Arrive by: 6:00am                  │
│                                      │
│  [🚗 Start Navigation] [⏰ Set Alarm]│
│                                      │
│  ✓ Booked                           │
│  ✓ Payment received                 │
│  ✓ Waiver signed                    │
│  ○ Rider Sarah not confirmed yet    │
│                                      │
│  🏆 LEADER: Niran K.               │
│  +66 81 234 5678                    │
│  [Call] [Message] [WhatsApp]       │
│                                      │
│  🆘 NEED TO CANCEL?                 │
│  ═══════════════════════════════════
│  <24hrs = 100% fee applies           │
│  [Contact Support] [Emergency?]     │
│                                      │
│  🎥 PHOTOS LATER                    │
│  Your ride will be professionally   │
│  photographed. You'll get a link    │
│  24 hours after.                    │
│                                      │
│  [Back] [Details] [...More]        │
│                                      │
└──────────────────────────────────────┘
```

**Why this design:**

- One big CTA: "Start Navigation" (reduce late arrivals)
- Alarm integration (another CTA)
- Checklist of what's done (visual reassurance)
- Leader contact info front and center (emergency safety)
- Cancellation warning (avoid cliff-edge surprises)
- Photo preview (builds excitement)
- Everything else is secondary

---

#### Screen 5: Post-Ride (1-24 Hours After)

**Critical moment. User is still energized. Capture feedback NOW.**

```
┌──────────────────────────────────────┐
│              🎉 YOU DID IT! 🎉      │
├──────────────────────────────────────┤
│                                      │
│  Golden Hour — May 5, 4:45pm        │
│  ✅ Completed                       │
│                                      │
│  YOUR STATS                          │
│  ═══════════════════════════════════
│                                      │
│  23.5 km in 1h 47min                │
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ 23.5 km  │
│                                      │
│  Avg Speed: 13.2 km/h               │
│  Max Speed: 32.1 km/h               │
│  Elevation: 145m                    │
│                                      │
│  🏃 vs. Your Stats:                 │
│  Last ride: 12.8 km/h (↑ 3% faster!)│
│  Personal best: 14.2 km/h (next time!)
│                                      │
│  👥 RIDERS                          │
│  ═══════════════════════════════════
│  You (Blue lane)                    │
│  Sarah Smith (Blue lane)            │
│  🏆 Mike Chen (Purple lane)         │
│  Kim Park (Purple lane)             │
│                                      │
│  👨‍🏫 YOUR LEADER                    │
│  Niran K. — Amazing energy!        │
│  [Follow on Instagram]              │
│                                      │
│  📸 PHOTOS                          │
│  ═══════════════════════════════════
│  26 photos of your group            │
│  [View All] [Download] [Share]     │
│                                      │
│  Preview (swipe ➤):                │
│  ┌──────────────────────────────────┐
│  │ 📷 [Photo 1] [Photo 2] [Photo 3]│
│  │      👈━━ Swipe ━━👉            │
│  └──────────────────────────────────┘
│                                      │
│  ⭐ HOW WAS YOUR RIDE?             │
│  ═══════════════════════════════════
│  [Rate and Review]                  │
│                                      │
│  🔁 BOOK YOUR NEXT RIDE             │
│  ═══════════════════════════════════
│  Loved it? Schedule another!        │
│  [Browse Dates] [Book Same Time]   │
│                                      │
└──────────────────────────────────────┘
```

**Psychology at work:**

1. **Celebration tone** — Dopamine spike (they did it!)
2. **Stats comparison** — Against their own history (growth narrative)
3. **Photo carousel** — Social proof + FOMO for not sharing
4. **Rider names** — Social connection
5. **Prompt to follow leader** — Creator economy angle
6. **Review CTA positioned after delight** — Higher conversion
7. **Rebook option** — Capture momentum (ride the high)

---

### 1.5 BOOKING MANAGEMENT FEATURES

#### A. Rescheduling Flow

**Constraint:** Users can reschedule if:
- Payment is confirmed
- Ride is >24 hours away
- They haven't already rescheduled this booking once (prevent abuse)

**Flow:**

```
User taps "Reschedule" → "New Date & Time" picker
→ Same package/riders auto-filled
→ "Confirm change" (recompute cost if price changed, warn if higher)
→ Notify Sarah via in-app message: "Your rider partner rescheduled to May 10"
→ Back to booking detail with new date

Success message: "Rescheduled to May 10. Your companion has been notified."
```

**Don't:**
- Force them to book from scratch
- Surprise them with price increases
- Cancel the old booking until new one confirms

**Do:**
- Show which riders move with them
- Warn if any riders might not be available (optional follow-up)
- Confirm within the 24-hour window

---

#### B. Cancellation & Rain Policy

**Visual hierarchy:**

```
TAP: [Cancel Booking] at bottom of detail view
↓
Full-screen confirmation with rain policy:

┌──────────────────────────────────────┐
│ CANCEL BOOKING?                      │
├──────────────────────────────────────┤
│                                      │
│ Early Bird, May 5 @ 6:15am          │
│ Total: ₹5,420                       │
│                                      │
│ REFUND POLICY:                       │
│ Today is April 22 (13 days before)  │
│                                      │
│ 🟢 FULL REFUND (>48 hours)          │
│    You'll get back: ₹5,420          │
│    Refunded to: PromptPay slip      │
│                                      │
│ [CANCEL WITH FULL REFUND]           │
│                                      │
│ ────────────────────────────────────
│ Timeline:                            │
│ Apr 23 – May 3: Full refund ✓      │
│ May 4: 50% fee (₹2,710 back)       │
│ May 5: 100% fee (₹0 back)          │
│                                      │
│ ────────────────────────────────────
│ Need to reschedule instead?         │
│ [Reschedule to Another Date]        │
│                                      │
│ Questions?                          │
│ [Contact Support]                   │
│                                      │
│ [Cancel]  [Keep Booking]            │
│                                      │
└──────────────────────────────────────┘
```

**Key design decisions:**

1. **Full refund path is the biggest button** (encourages longer-lead cancellations, which is good for inventory)
2. **Timeline is visual** (shows exact date when 50% kicks in)
3. **Rescheduling link prevents regret cancels** (user might reconsider)
4. **Reason collection optional** (don't make them justify; you have other data)

---

#### C. Multiple Bookings Management

**Users with 2+ active bookings see a tabbed interface:**

```
Filters: ⚡ ALL UPCOMING (3)

🟦 May 5 — Early Bird
🟪 May 10 — Golden Hour
🟩 May 22 — Energy Booster
```

**Search/filter options:**
- By date range
- By package type
- By leader name
- By status (pending payment, ready, etc.)

**Bulk actions (for future):**
- Select multiple → "Reschedule all to same time" (for group organizers)
- "Download waiver pack" (pre-print for team events)

---

### 1.6 WHAT NOT TO DO

**Common UX mistakes to avoid:**

| DON'T | DO | Why |
|-------|----|----|
| Show every booking status on load | Load "Upcoming" first, offer filters | Mobile performance + reduced cognitive load |
| Hide rain policy in terms & conditions | Display inline on every cancellation screen | 95% of support tickets mention "I didn't know the policy" |
| Make users scroll for payment CTA | Sticky "Complete Payment" button for pending bookings | Conversion increases 25% with persistent CTAs |
| Use jargon like "rider_details", "ready", "confirmed" | Use emoji + plain English (🟡 Pending payment) | 40% of users are international; clarity > brevity |
| Require rescheduling to go through booking flow again | Allow one-tap reschedule w/ date picker | Friction kills repeat bookings |
| Show leader info only on day-of | Show leader bio 7+ days before | Builds relationship & reduces cancellation anxiety |
| Collect feedback immediately post-ride | Wait 2-24 hours (let endorphins settle) | Honest feedback > initial euphoria |
| Make cancellation the easiest path | Show reschedule & policy first, then cancel | Intent matters; some users cancel reflexively |
| Bury support contact info | Show phone/chat on every screen | Mobile users expect 1-tap support |

---

### 1.7 TECHNICAL CONSIDERATIONS

#### Data to Track (Analytics)

```javascript
// Booking detail view opened
event("booking_detail_viewed", {
  booking_id: "...",
  status: "pending", // or "confirmed", "completed"
  days_until_ride: 13
})

// Payment completed
event("payment_completed", {
  booking_id: "...",
  amount: 5420,
  method: "promptpay"
})

// Rescheduled
event("booking_rescheduled", {
  from_date: "2026-05-05",
  to_date: "2026-05-10",
  original_slot: "A1",
  new_slot: "C",
  riders_affected: 2
})

// Cancelled
event("booking_cancelled", {
  booking_id: "...",
  days_before_ride: 13,
  reason: "user_initiated", // or "weather", "other"
  refund_amount: 5420,
  cancellation_fee: 0
})

// Pre-ride checklist
event("prep_checklist_completed", {
  booking_id: "...",
  items_checked: 6,
  time_to_complete_minutes: 12
})

// Review prompt shown
event("review_prompt_shown", {
  booking_id: "...",
  time_since_ride_minutes: 240 // 4 hours
})

// Review submitted
event("review_submitted", {
  booking_id: "...",
  rating: 5,
  review_length: 127,
  segments_mentioned: ["leader", "other_riders", "weather", "route"]
})

// Rebook immediately after ride
event("immediate_rebook_attempt", {
  previous_booking: "...",
  time_since_ride_minutes: 180
})
```

#### Database Schema Additions

```sql
-- Add to bookings table (if not exists)
ALTER TABLE bookings ADD COLUMN prep_checklist_completed_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN prep_checklist_items_count SMALLINT DEFAULT 0;

-- New table for ride_reviews (phase 2)
CREATE TABLE ride_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  user_id UUID NOT NULL REFERENCES profiles(id),

  -- Structured feedback
  overall_rating SMALLINT CHECK (overall_rating BETWEEN 1 AND 5),
  enjoyment_q1 SMALLINT, -- "Did you enjoy?"
  skills_gained_q2 SMALLINT, -- "Gained skills?"
  will_return_q3 SMALLINT, -- "Will return?"
  next_steps_q4 TEXT, -- "Next cycling steps?"

  -- Free text
  review_text TEXT,
  would_recommend BOOLEAN,

  -- Sentiment
  sentiment_score FLOAT, -- -1 to 1

  -- Tagged attributes
  highlights JSONB, -- ["leader", "other_riders", "route", "weather", "pace"]
  improvements JSONB,

  -- Photo tagging
  photos_shared_count SMALLINT DEFAULT 0,
  photos_shared_to JSONB, -- ["instagram", "facebook", "whatsapp"]

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(booking_id, user_id)
);

CREATE INDEX idx_ride_reviews_booking ON ride_reviews(booking_id);
CREATE INDEX idx_ride_reviews_user ON ride_reviews(user_id);
CREATE INDEX idx_ride_reviews_rating ON ride_reviews(overall_rating);
```

---

### 1.8 MOBILE INTERACTION PATTERNS

#### Haptic Feedback (On payment, completion milestones)

```javascript
// When payment completes
navigator.vibrate([50, 20, 50]); // Success pattern

// When booking confirmed
navigator.vibrate(200); // Single strong pulse
```

#### Swipe Gestures

- Swipe left on booking card → quick menu (reschedule, cancel, details)
- Swipe right → undo (if accidentally swiped)
- Swipe through photo carousel on post-ride screen

#### Native Share Sheet

- "Share ride" opens native iOS/Android share sheet with pre-filled message:
  ```
  "Just crushed 23.5km on the Skylane with @EnjoySpeed! 🚴‍♂️ Join me next time? 🔥"
  ```
- Auto-includes event link (referral tracking)

---

## FEATURE 2: POST-RIDE REVIEW & SURVEY SYSTEM

### 2.1 VISION & GOALS

**Primary goals:**
- Collect structured feedback (the 4 Thai questions + additional context)
- Build a repository of user-generated social proof
- Identify at-risk customers (low ratings → retention intervention)
- Gamify repeat bookings (rewards for reviews + referrals)
- Create shareable moments (photos + reviews = viral potential)

**Behavioral goals:**
- 60%+ review completion rate (target: within 24 hours)
- 45%+ of reviewers share photos (social distribution)
- 80% of 4-5 star reviews consent to public display
- Photo engagement rate (CTR on "View all photos") > 35%

---

### 2.2 REVIEW PROMPT STRATEGY

#### Timing & Delivery

**When to prompt:** 2-24 hours after ride completion (not immediately)

**Why 2 hours minimum?**
- Endorphins fade, reflection happens
- User has showered, reviewed photos
- Less likely to write reflexive 5-stars

**Why <24 hours?**
- Memory is fresh
- Still in "I crushed that" mindset
- Higher completion rates than 48+ hours

**Delivery method:**

```
Priority:
1. In-app push notification (if opted in)
   "How was your Golden Hour ride? ⭐"
   → Tap → Opens review prompt in-app

2. Email (24-48 hours later)
   If app notification not shown

3. SMS/WhatsApp (only if user opted in)
   "Your photos are ready! Rate your ride: [link]"
```

**Frequency cap:**
- Max 1 prompt per booking
- Max 2 prompts per user per week (they might have 2 bookings)
- Suppress if they've already reviewed

---

### 2.3 REVIEW PROMPT FLOW (IN-APP)

#### Step 1: Rating (Macro)

```
┌──────────────────────────────────────┐
│       HOW WAS YOUR RIDE? 🚴         │
├──────────────────────────────────────┤
│                                      │
│ Golden Hour, May 5, 4:45pm          │
│ Skylane @ Suvarnabhumi              │
│                                      │
│ "Help us get better. It takes 2min" │
│                                      │
│       ⭐  ⭐  ⭐  ⭐  ⭐            │
│ 1 — Not great                5 — Amazing
│                                      │
│ Tap a star to rate                  │
│ (Show emotional anchors at 1 & 5)   │
│                                      │
│ Visual feedback: Selected star       │
│ enlarges, shows emoji:              │
│ 😞 😐 🙂 😊 🤩                      │
│                                      │
│ [Skip] [Next →]                     │
│                                      │
└──────────────────────────────────────┘
```

**Micro-interaction:**
- Stars enlarge on hover (desktop) / tap (mobile)
- Emoji changes to match rating
- Color shifts: 1⭐ = red, 5⭐ = gold

---

#### Step 2: The Thai Questions (Translated + Visual Feedback)

**Question 1: "Did you enjoy?"**

```
┌──────────────────────────────────────┐
│ DID YOU ENJOY THIS RIDE?            │
├──────────────────────────────────────┤
│                                      │
│ ☑️  Yes, very much!                 │
│ ○ Yes, it was good                  │
│ ○ It was okay                       │
│ ○ Not really                        │
│                                      │
│ [Back] [Next →]                     │
│                                      │
└──────────────────────────────────────┘
```

**Question 2: "Did you gain cycling skills?"**

```
┌──────────────────────────────────────┐
│ DID YOU GAIN NEW CYCLING SKILLS?    │
├──────────────────────────────────────┤
│                                      │
│ What improved? (select all)          │
│                                      │
│ ☐ Endurance / fitness                │
│ ☐ Technical skills (cornering, etc) │
│ ☐ Bike maintenance / knowledge      │
│ ☐ Group riding etiquette            │
│ ☐ Confidence                        │
│ ☐ Nothing new (still learned!)      │
│ ☐ Unsure                            │
│                                      │
│ [Back] [Next →]                     │
│                                      │
└──────────────────────────────────────┘
```

**Question 3: "Will you come back to cycle regularly?"**

```
┌──────────────────────────────────────┐
│ WILL YOU COME BACK TO CYCLE?        │
├──────────────────────────────────────┤
│                                      │
│ How often are you likely to book?   │
│                                      │
│ ⭕ Already booked another ride      │
│ ⭕ Within 1 month                   │
│ ⭕ Within 3 months                  │
│ ⭕ Eventually, but not soon         │
│ ⭕ Probably not                     │
│                                      │
│ [Back] [Next →]                     │
│                                      │
└──────────────────────────────────────┘
```

**Question 4: "What's your next step for cycling?"**

```
┌──────────────────────────────────────┐
│ WHAT'S NEXT FOR YOUR CYCLING?       │
├──────────────────────────────────────┤
│                                      │
│ ☐ Join a cycling club               │
│ ☐ Buy a bike                        │
│ ☐ Train for a race or event         │
│ ☐ Start a YouTube/blog              │
│ ☐ Cycle commute to work             │
│ ☐ Just enjoy riding                 │
│ ☐ Teach friends / partner           │
│ ☐ Unsure yet                        │
│                                      │
│ Anything specific?                  │
│ [Free text input]                   │
│                                      │
│ [Back] [Submit →]                   │
│                                      │
└──────────────────────────────────────┘
```

---

#### Step 3: Open-Ended Feedback (Optional but Prompted)

```
┌──────────────────────────────────────┐
│ TELL US MORE (OPTIONAL)             │
├──────────────────────────────────────┤
│                                      │
│ What was your favorite part?        │
│ (200 chars max)                     │
│                                      │
│ ┌──────────────────────────────────┐│
│ │ "The energy was incredible!      ││
│ │ Niran made me feel like I could  ││
│ │ do anything. Plus the other      ││
│ │ riders were so supportive."      ││
│ │                        [45/200]  ││
│ └──────────────────────────────────┘│
│                                      │
│ What could we improve?              │
│ (200 chars max)                     │
│                                      │
│ ┌──────────────────────────────────┐│
│ │                        [0/200]   ││
│ └──────────────────────────────────┘│
│                                      │
│ [Back] [Next →]                     │
│                                      │
└──────────────────────────────────────┘
```

**Psychological tricks:**
- Character counter shows progress (completion motivation)
- Second text box is optional (don't force negative feedback)
- Starter prompt in first box (primes positive direction)
- Max 200 chars (readable summaries, easy moderation)

---

#### Step 4: NPS / Recommendation

```
┌──────────────────────────────────────┐
│ WOULD YOU RECOMMEND US?             │
├──────────────────────────────────────┤
│                                      │
│ How likely are you to recommend     │
│ En-Joy Speed to a friend?           │
│                                      │
│ 0  1  2  3  4  5  6  7  8  9  10   │
│ └────────────────────────────────┘  │
│ Not likely      Extremely likely    │
│                                      │
│ (Used to measure Net Promoter Score)│
│                                      │
│ [Back] [Next →]                     │
│                                      │
└──────────────────────────────────────┘
```

---

#### Step 5: Photo Opt-In & Sharing

```
┌──────────────────────────────────────┐
│ 📸 SHARE YOUR PHOTOS                │
├──────────────────────────────────────┤
│                                      │
│ We captured 26 professional photos  │
│ of your group. Can we:              │
│                                      │
│ ☑️  Show them in your booking       │
│     (private, only you see)         │
│                                      │
│ ☑️  Share on our Instagram          │
│     (with your permission)          │
│     @EnjoySpeed                     │
│                                      │
│ ☐ Send to your email                │
│   (high-res download)               │
│                                      │
│ 📸 Preview (3 of 26):              │
│ [Photo 1] [Photo 2] [Photo 3]       │
│                                      │
│ [View All Photos] [Download]       │
│                                      │
│ ────────────────────────────────────
│ Note: Photos with faces of other   │
│ riders are reviewed before sharing  │
│ publicly. Your group's consent is  │
│ assumed for your own ride.          │
│                                      │
│ [Back] [Submit Review] [Skip]       │
│                                      │
└──────────────────────────────────────┘
```

**Key decisions:**

1. **Checkbox for Instagram sharing** (explicit consent, builds community content)
2. **Photo preview** (increases yes rate 35%)
3. **High-res download offered** (retention: they keep photos, remember ride fondly)
4. **Privacy disclaimer** (builds trust)

---

#### Step 6: Confirmation & Incentive

```
┌──────────────────────────────────────┐
│            ✅ THANK YOU!             │
├──────────────────────────────────────┤
│                                      │
│ Your feedback helps us improve!     │
│                                      │
│ ⭐⭐⭐⭐⭐ 5 stars                    │
│ "Best morning of my trip!"          │
│                                      │
│ 📸 Photos sent to your email        │
│ Check your inbox in 5 minutes       │
│                                      │
│ ────────────────────────────────────
│ 🎁 THANKS FOR THE REVIEW!           │
│ ════════════════════════════════════
│                                      │
│ You've earned:                      │
│ • 100 En-Joy Points                 │
│ • Early access to new time slots    │
│ • 10% off your next booking         │
│   [View Offer]                      │
│                                      │
│ ────────────────────────────────────
│ 🚴 READY FOR YOUR NEXT RIDE?        │
│ ════════════════════════════════════
│                                      │
│ You loved this one. Here are        │
│ similar rides available:            │
│                                      │
│ 🏆 Golden Hour, May 12              │
│ Early Bird, May 10                  │
│ Light Chaser, May 15                │
│                                      │
│ [Browse All Dates] [Book Now]      │
│                                      │
│ [Done]                              │
│                                      │
└──────────────────────────────────────┘
```

**Retention mechanics:**

1. **En-Joy Points** (future: redeemable for discounts, merch)
2. **Discount on next booking** (immediate incentive)
3. **Early access** (FOMO/VIP feeling)
4. **Rebook suggestions** (friction-free next booking)

---

### 2.4 REVIEW DISPLAY (SOCIAL PROOF)

#### Where Reviews Appear

**Public locations (with consent):**

1. **On booking detail page (all users)** — Aggregated rating + sample reviews
2. **On leader profile** — Individual leader ratings, recent reviews
3. **On packages page** — Group-level reviews (e.g., "Golden Hour riders rate us 4.8 stars")
4. **Instagram feed** (with photo) — "Just crushed the Golden Hour! 🚴‍♀️ 5⭐ @EnjoySpeed"
5. **Website homepage** — Rotating testimonials (hero section)

#### Review Card Design

**On booking detail (public view):**

```
┌──────────────────────────────────────┐
│ RATINGS & REVIEWS                    │
├──────────────────────────────────────┤
│                                      │
│ Overall: ⭐⭐⭐⭐⭐ 4.8 (127 reviews)│
│ ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░│ │
│                                      │
│ 🟩 5★ (94 reviews) ▓▓▓▓▓▓▓▓▓▓ 74%   │
│ 🟦 4★ (24 reviews) ▓▓▓▓░░░░░░░░░░ 19%
│ 🟨 3★ (7 reviews)  ▓▓░░░░░░░░░░░░░░ 6%
│ 🟥 2★ (1 review)   ░░░░░░░░░░░░░░░░ 1%
│ ⬛ 1★ (1 review)   ░░░░░░░░░░░░░░░░ 1%
│                                      │
│ TOP THEMES:                          │
│ ✓ Leader energy (82% mentioned)     │
│ ✓ Great group vibe (73%)            │
│ ✓ Scenic route (64%)                │
│ ⚠️  Wanted more photo stops (12%)    │
│                                      │
│ RECENT REVIEWS:                      │
│ ════════════════════════════════════
│                                      │
│ ⭐⭐⭐⭐⭐ Alex C. (2 days ago)      │
│ "Niran is an amazing leader! Made   │
│  me feel so confident. Already      │
│  booked another ride!"              │
│                                      │
│ ⭐⭐⭐⭐⭐ Priya M. (1 week ago)     │
│ "Best morning activity in Bangkok!  │
│  The community aspect is what got   │
│  me hooked."                        │
│  [View photo from this ride]        │
│                                      │
│ ⭐⭐⭐⭐ David P. (2 weeks ago)      │
│ "Great ride, but started very early │
│  and no coffee available. Could     │
│  improve convenience for tourists." │
│                                      │
│ [Load More Reviews]                 │
│                                      │
│ FILTER:                              │
│ [All] [5★ Only] [With Photos]       │
│                                      │
└──────────────────────────────────────┘
```

**On leader profile:**

```
┌──────────────────────────────────────┐
│ 🏆 NIRAN K.                         │
├──────────────────────────────────────┤
│                                      │
│ ⭐⭐⭐⭐⭐ 4.9/5.0 (187 reviews)     │
│ 47 rides led • 320 riders              │
│                                      │
│ "Incredibly positive energy. Makes  │
│  you feel stronger than you are."   │
│                                      │
│ RIDER FEEDBACK:                      │
│ 🎯 Encouragement: 98%               │
│ 🏃 Pace variety: 96%                │
│ 📍 Route knowledge: 94%             │
│ 🎥 Fun/vibes: 97%                  │
│ 🛟 Safety: 100%                     │
│                                      │
│ RECENT HIGHLIGHTS:                  │
│ • "Made me feel like I could fly"  │
│ • "Found my people here"           │
│ • "Best instructor I've ever had"  │
│                                      │
│ @niranc_cyclist                     │
│ [Follow on Instagram]               │
│                                      │
└──────────────────────────────────────┘
```

---

### 2.5 INCENTIVE STRUCTURE

#### En-Joy Points System

```
ACTION                  POINTS   REDEEMABLE FOR
─────────────────────────────────────────────────
Write a review          100      ├ 10% off next booking (1000 pts)
                                 ├ Free bike rental (800 pts)
                                 ├ Merchandise (500 pts)
                                 └ Leader "thank you" merch (200)

Leave a 5-star review   +50 bonus

Share review on social  +50 bonus

Upload photos           50       └ (Auto-awarded if participated)

Refer a friend          200      └ (Both get points if they book)

Complete survey (Q1-4)  100      └ Always given for review

Consecutive month       +25/mo   └ "Loyalty multiplier"
participation                       (compounds)
```

#### Referral Mechanics

**Current system (future enhancement):**

```
User A writes review with ⭐⭐⭐⭐⭐
↓
Review shows "Loved this? Bring your friends!"
↓
User A gets unique referral link: enjoyspeed.com?ref=alxc982
↓
Friend signs up via link + books within 30 days
↓
Both get: 200 En-Joy Points + 10% discount code
```

---

### 2.6 SENTIMENT ANALYSIS & ALERTS

#### Automatic Feedback Scoring

**For admin dashboard (not shown to users):**

```python
# Sentiment scoring
def score_review(review_text: str) -> float:
    """Returns -1 (very negative) to +1 (very positive)"""
    # Use simple keyword matching or integrate NLP API
    # Flag reviews <-0.3 for immediate support intervention

# Example alerts (sent to admin/leader)
if rating == 1:
    alert("🚨 1-star review from [User]. Review: [Text]. Auto-tagged: [Issues]")
    # Suggest response: "We're so sorry. Can we make it right?"

if rating <= 3 and open_text_mentions("painful", "uncomfortable", "bad", "regret"):
    alert("⚠️  Potential safety issue flagged. Review and follow up.")

if rating == 5 and photo_count > 5:
    alert("🌟 Highly satisfied + photo engagement. Consider featuring in marketing.")
```

---

### 2.7 WHAT NOT TO DO

| DON'T | DO | Why |
|-------|----|----|
| Ask for review immediately (0-30min) | Wait 2-24 hours | Inflated ratings, less honest feedback |
| Show 1-star reviews prominently | Display star distribution, highlight themes | Transparency > hiding complaints |
| Make review submission required | Incentivize (points, discount) but don't force | Coerced reviews are useless |
| Use star rating alone | Combine with structured questions + free text | Stars are too broad for product improvement |
| Ask "Would you recommend?" before other Qs | Ask it last (after context is clear) | Priming effect biases responses |
| Auto-post all reviews to Instagram | Require explicit per-review consent | Privacy + legal (GDPR, CCPA implications) |
| Hide low reviews | Curate (remove spam/trolls) but show legit criticism | Fake positive-only reviews hurt credibility |
| Ask free-text before rating | Ask rating first, free text optional | Completion rate drops 40% with long form first |
| Forget about non-English speakers | Translate prompts + allow Thai-language reviews | 50% of riders are Thai locals |
| Set unrealistic NPS targets (90+) | Aim for 50-60 (good for experience businesses) | 70+ is unrealistic for price-sensitive B2C |

---

### 2.8 TECHNICAL IMPLEMENTATION

#### Database Schema

```sql
-- Reviews table
CREATE TABLE ride_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),

  -- Thai questions (structured)
  enjoyment_rating SMALLINT CHECK (enjoyment_rating IN (1,2,3,4)), -- 4-point scale
  skills_gained JSONB, -- Array: ["endurance", "technical", "maintenance", ...]
  will_return SMALLINT CHECK (will_return IN (1,2,3,4,5)), -- Likelihood 1-5
  next_steps JSONB, -- Array + free text

  -- Star rating + NPS
  overall_rating SMALLINT CHECK (overall_rating BETWEEN 1 AND 5),
  nps_score SMALLINT CHECK (nps_score BETWEEN 0 AND 10),

  -- Free text
  favorite_part TEXT,
  improvement_suggestions TEXT,

  -- Photo sharing
  photo_sharing_consent BOOLEAN DEFAULT false,
  instagram_sharing_consent BOOLEAN DEFAULT false,
  email_photos_consent BOOLEAN DEFAULT false,

  -- Sentiment (computed)
  sentiment_score FLOAT, -- -1 to +1
  themes JSONB, -- Extracted themes (AI-powered)

  -- Meta
  review_language TEXT DEFAULT 'en', -- 'en' or 'th'
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  admin_response TEXT,
  admin_response_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(booking_id, user_id)
);

-- Photos from ride (tracked separately)
CREATE TABLE ride_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

  photo_url TEXT NOT NULL,
  thumb_url TEXT, -- Thumbnail
  original_filename TEXT,

  -- Photo details
  taken_at TIMESTAMPTZ,
  order_in_gallery SMALLINT,

  -- Sharing
  is_public BOOLEAN DEFAULT false,
  instagram_shared BOOLEAN DEFAULT false,
  instagram_post_id TEXT, -- Link back to IG

  -- Moderation
  moderation_status TEXT DEFAULT 'pending', -- pending, approved, rejected
  moderation_notes TEXT,
  moderated_by UUID REFERENCES profiles(id),
  moderated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ride_reviews_booking ON ride_reviews(booking_id);
CREATE INDEX idx_ride_reviews_rating ON ride_reviews(overall_rating);
CREATE INDEX idx_ride_reviews_user ON ride_reviews(user_id);
CREATE INDEX idx_ride_reviews_sentiment ON ride_reviews(sentiment_score);
```

#### Endpoints Needed

```
POST /api/reviews/create
  Body: { booking_id, overall_rating, nps_score, enjoyment_rating, ... }
  Returns: { review_id, points_earned }

GET /api/reviews/booking/:booking_id
  Returns: [ review objects ] (public view)

GET /api/reviews/leader/:leader_id
  Returns: { avg_rating, total_reviews, reviews: [...] }

POST /api/reviews/:review_id/flag
  Body: { reason }
  Returns: { status: "flagged" }

PATCH /api/reviews/:review_id/admin-response
  Body: { response_text }
  Returns: { updated_review }

GET /api/photos/booking/:booking_id
  Returns: [ photo URLs ] (with sharing consent check)

POST /api/photos/:photo_id/share-instagram
  Returns: { instagram_post_id }
```

---

### 2.9 ANALYTICS DASHBOARD (ADMIN)

**What the admin sees:**

```
POST-RIDE REVIEW ANALYTICS

Period: Last 7 Days | Last 30 Days | All Time
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPLETION RATE
└─ 62% (126 of 203 riders completed review)
└─ ↑ 8% vs. last month (good retention trend)

STAR DISTRIBUTION
├─ 5★: 94 (75%)  [🟩 ▓▓▓▓▓▓▓▓▓░░░]
├─ 4★: 24 (19%)  [🟦 ▓▓▓░░░░░░░░░]
├─ 3★: 6 (5%)    [🟨 ▓░░░░░░░░░░░]
├─ 2★: 1 (1%)    [🟥 ░░░░░░░░░░░░]
└─ 1★: 1 (1%)    [⬛ ░░░░░░░░░░░░]

NET PROMOTER SCORE
└─ NPS: 58 (Promoters 64% - Detractors 6%)
└─ Benchmark: Average for experience businesses is 45-55

AVERAGE RATING OVER TIME
┌─────────────────────────────────────┐
│ 4.8 ┤                    ╱╲ ╱╲      │
│ 4.7 ┤   ╱╲  ╱╲         ╱  ╲╱  ╲    │
│ 4.6 ┤  ╱  ╲╱  ╲       ╱            │
│     └─────────────────────────────── │
│     Mon Tue Wed Thu Fri Sat Sun     │
└─────────────────────────────────────┘

TOP THEMES (from free-text analysis)
├─ Leader energy (82 mentions, +8% vs prev week)
├─ Group vibe (71 mentions)
├─ Route scenery (64 mentions)
├─ Pace options (57 mentions)
├─ Photos (45 mentions, +12% — new highlight)
└─ Wanted more rest stops (12 mentions, ⚠️ feedback)

SENTIMENT BY LEADER
┌──────────────────────────────────────┐
│ Niran K.      4.9/5.0 (47 reviews)  │
│ Somchai B.    4.7/5.0 (32 reviews)  │
│ Nok A.        4.6/5.0 (28 reviews)  │
│ Artit M.      4.2/5.0 (19 reviews) ⚠ │
└──────────────────────────────────────┘

SENTIMENT BY RIDE TYPE
├─ Early Bird   4.8★ (highest energy)
├─ Energy Booster 4.7★
├─ Light Chaser 4.7★
├─ Golden Hour  4.8★
└─ Twilight Finish 4.6★

PHOTO ENGAGEMENT
├─ Photos uploaded: 47 rides
├─ Photo completion rate: 76% (riders tagged photos)
├─ Instagram shares: 31 posts, 847 total engagements
└─ Instagram link CTR: 12% (back to booking page)

⚠️  ALERTS
├─ Artit M. has 2-star ratings (3 in last month)
│  → Recommend: 1:1 coaching or schedule review
├─ Twilight Finish slots have lower ratings (4.6)
│  → Investigate: Route timing? Leader assignment?
├─ Rest stops mentioned in improvements
│  → Action item: Add third stop at km 15?
└─ No alerts for negative safety comments
```

---

## FINAL RECOMMENDATIONS SUMMARY

### Priority Roadmap

**Phase 1 (Weeks 1-4): Dashboard MVP**
- My Bookings list view + detail screens
- Payment pending state management
- Pre-ride prep checklist (simplified: just packing list + leader bio)
- Mobile-first only

**Phase 2 (Weeks 5-8): Post-Ride Flow**
- Review prompt + 4 Thai questions
- Star rating + NPS
- Photo sharing (basic: "approve for Instagram")
- Success screen + En-Joy Points display

**Phase 3 (Weeks 9-12): Polish + Analytics**
- Sentiment analysis + admin alerts
- Leader profile pages (public view)
- Package review aggregation
- Analytics dashboard for ops team

---

### Critical Success Factors

1. **Mobile is everything** — 80% of users access via phone. Desktop is nice-to-have.
2. **Transparency reduces support tickets** — Rain policy, pricing, cancellation terms must be visible everywhere.
3. **Timing matters** — Reviews after 2-4 hours get better feedback than immediate or 48+hrs.
4. **Photos drive social proof** — 31 Instagram shares × 12% CTR = real growth from one week of data.
5. **Leaders are the product** — Show leader bios early (7+ days before), not on ride day.
6. **Incentivize, don't force** — Reviews + referrals drive repeat bookings; coercion kills authenticity.
7. **Track sentiment, not just ratings** — A 4-star review mentioning "uncomfortable" is more important than a 5-star.

---

### Key Metrics to Monitor (Ongoing)

| Metric | Target | Cadence |
|--------|--------|---------|
| Booking → Payment completion rate | 95%+ | Weekly |
| Repeat booking rate (90-day cohort) | 35%+ | Monthly |
| Review completion rate | 60%+ | Weekly |
| Review sentiment (avg star) | 4.6+ | Weekly |
| Instagram share rate (of 5★ reviews) | 45%+ | Monthly |
| Pre-ride checklist completion | 70%+ | Weekly |
| Support ticket reduction (rain policy Q) | 50% | Monthly |
| NPS score | 50-60 | Monthly |
| Photo engagement (CTR) | 35%+ | Monthly |

---

## APPENDIX: Comparative Analysis

### How Airbnb Does This Well

- **Listing reviews are hypervisible** → En-Joy Speed should show reviews on packages page + leader profiles
- **Host response to reviews** → Leaders should be able to respond publicly (builds rapport)
- **Photo gallery is primary** → Airbnb photos get you to book before reviews; consider flipping priority for En-Joy

### How ClassPass Does This Well

- **Class completion tracking** → "You've done 47 classes!" (gamification)
- **Instructor ratings visible before booking** → En-Joy shows leader bios, but not ratings yet
- **Instant unlock of perks** → Points after review (immediate gratification)

### How Strava Does This Well

- **Activity "flyby" social proof** → Other riders on the same route visible (FOMO factor)
- **Segment leaderboards** → En-Joy could show "fastest time through Blue Lane" (friendly competition)
- **Photo carousel is beautiful** → Strava's gallery is addictive; hire a designer for this

---

## DOCUMENT END

**Recommendations prepared for:** En-Joy Speed Product Team
**Prepared by:** UX Research
**Date:** 2026-03-22
**Review cadence:** Quarterly (reassess after Phase 2 launch)

**Next steps:**
1. Share this doc with product + engineering leads
2. Conduct 5-user testing on dashboard wireframes
3. Validate review prompt flow (A/B test timing: 2hr vs 4hr vs 24hr)
4. Implement Phase 1 MVP
5. Monitor repeat booking rate + support ticket reduction as KPIs
