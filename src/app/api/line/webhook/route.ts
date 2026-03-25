import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as crypto from "crypto";

// =============================================
// LINE Webhook — Receives events from LINE Platform
// =============================================
//
// Configure this URL in LINE Developers Console:
//   https://enjoyspeedbkk.com/api/line/webhook
//
// Events handled:
// - follow:   User adds @EnjoySpeed as friend
// - unfollow: User blocks or removes the OA
// - message:  User sends a text message
// - postback: User taps a button in a Flex message

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

/**
 * Verify the LINE webhook signature (X-Line-Signature header)
 * Returns false if the request wasn't sent by LINE.
 */
function verifySignature(body: string, signature: string | null): boolean {
  if (!CHANNEL_SECRET || !signature) return false;
  const hmac = crypto.createHmac("SHA256", CHANNEL_SECRET);
  hmac.update(body);
  const expected = hmac.digest("base64");
  return expected === signature;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-line-signature");

    // Verify webhook authenticity
    if (!verifySignature(rawBody, signature)) {
      console.warn("[LINE Webhook] Invalid signature — rejecting");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const events = body.events || [];

    const admin = createAdminClient();

    for (const event of events) {
      const lineUserId = event.source?.userId;
      if (!lineUserId) continue;

      switch (event.type) {
        // ── FOLLOW ───────────────────────────────
        // User added @EnjoySpeed as a friend
        case "follow": {
          console.log(`[LINE] New follower: ${lineUserId}`);

          // Fetch their profile from LINE
          let displayName = "LINE User";
          let pictureUrl: string | null = null;

          if (CHANNEL_ACCESS_TOKEN) {
            try {
              const profileRes = await fetch(
                `https://api.line.me/v2/bot/profile/${lineUserId}`,
                {
                  headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
                }
              );
              if (profileRes.ok) {
                const profile = await profileRes.json();
                displayName = profile.displayName || displayName;
                pictureUrl = profile.pictureUrl || null;
              }
            } catch {
              // Profile fetch failed — continue with defaults
            }
          }

          // Upsert into line_users table
          await admin.from("line_users").upsert(
            {
              line_user_id: lineUserId,
              display_name: displayName,
              picture_url: pictureUrl,
              followed_at: new Date().toISOString(),
              is_following: true,
            },
            { onConflict: "line_user_id" }
          );

          // Send a welcome message
          if (CHANNEL_ACCESS_TOKEN) {
            await sendReply(event.replyToken, [
              {
                type: "text",
                text: `Welcome to En-Joy Speed! 🚴\n\nWe're Bangkok's premium guided cycling experience on the Skylane.\n\n🎯 Book a ride:\nhttps://enjoyspeedbkk.com/booking\n\n📞 Questions? Just reply here — we usually respond within a few hours.\n\nRide happy, ride safe! 🌅`,
              },
            ]);
          }
          break;
        }

        // ── UNFOLLOW ─────────────────────────────
        // User blocked or removed the OA
        case "unfollow": {
          console.log(`[LINE] Unfollowed: ${lineUserId}`);
          await admin
            .from("line_users")
            .update({ is_following: false })
            .eq("line_user_id", lineUserId);
          break;
        }

        // ── MESSAGE ──────────────────────────────
        // User sent a text message
        case "message": {
          if (event.message?.type !== "text") break;

          const text = (event.message.text || "").trim().toLowerCase();
          console.log(`[LINE] Message from ${lineUserId}: ${text}`);

          // Smart auto-replies based on keywords
          const reply = getAutoReply(text);
          if (reply && CHANNEL_ACCESS_TOKEN) {
            await sendReply(event.replyToken, [{ type: "text", text: reply }]);
          }

          // Log the message for admin review (table may not exist yet — that's OK)
          try {
            await admin.from("line_messages").insert({
              line_user_id: lineUserId,
              direction: "incoming",
              message_type: "text",
              content: event.message.text,
              line_message_id: event.message.id,
              timestamp: new Date(event.timestamp).toISOString(),
            });
          } catch {
            // line_messages table may not exist yet
          }

          break;
        }

        default:
          console.log(`[LINE] Unhandled event type: ${event.type}`);
      }
    }

    // LINE expects a 200 response, always
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[LINE Webhook] Error:", error);
    // Still return 200 — LINE retries on non-200 and that causes duplicate processing
    return NextResponse.json({ ok: true });
  }
}

// ── Auto-reply logic ──────────────────────────
// NOTE: Exact button labels are matched first (before keyword matching)
// so button taps always get the right response regardless of phrasing.

// LIFF URL keeps the user inside LINE's browser with full LIFF context,
// so their LINE account is automatically linked after email verification.
// Falls back to the regular booking URL if LIFF_ID isn't configured.
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID;
const BOOK_URL = LIFF_ID
  ? `https://liff.line.me/${LIFF_ID}`
  : "https://www.enjoyspeedbkk.com/booking";

const PRICING_REPLY = `💰 En-Joy Speed Pricing:\n\n🔹 Duo (2 riders): 2,500 THB/person\n🔹 Squad (3–5 riders): 2,100 THB/person\n🔹 Peloton (6–8 riders): 2,000 THB/person\n\n🚲 Bike rental (paid at track):\n• Hybrid: 420 THB\n• Road: 720 THB\n• Own bike: Free\n\n🎁 Every rider gets a free Starter Kit (padded shorts, energy gel, eco bag)!\n\n👉 Book now: ${BOOK_URL}`;

const LOCATION_REPLY = `📍 Meeting point: Skylane (Happy & Healthy Bike Lane)\nNear Suvarnabhumi Airport, Bangkok.\n\nMap: https://maps.app.goo.gl/ZexMhiLu1BcSdCiJ9\n\nWe'll send you exact directions 24 hours before your ride. Look for our team in orange vests at the Skylane entrance!`;

const WHAT_TO_BRING_REPLY = `📋 What to bring:\n\n✅ Sport shoes — closed-toe (mandatory)\n✅ Athletic socks\n✅ Breathable top\n✅ Sunscreen + sunglasses\n✅ Water bottle\n\n🎁 We provide:\nHelmet, bike (if renting), and your Starter Kit (padded liner shorts, energy gel, eco mesh bag)!\n\nNo cycling experience needed — your Athlete Leader handles everything. 🚴`;

const BOOKING_REPLY = `🚴 Ready to ride?\n\nBook here (takes 2 minutes):\n👉 ${BOOK_URL}\n\nChoose your date, time slot, and group size. Pay securely via PromptPay — no card needed!\n\n📲 Booking through LINE? We'll send ride reminders directly to this chat — no extra setup needed.`;

function getAutoReply(text: string): string | null {
  // ── Exact button label matches (highest priority) ──────────────────
  // These match the text sent when users tap rich menu / card buttons.
  if (text === "pricing & packages" || text === "ราคาและแพ็กเกจ") {
    return PRICING_REPLY;
  }
  if (text === "location" || text === "ที่ตั้ง") {
    return LOCATION_REPLY;
  }
  if (text === "what to bring" || text === "สิ่งที่ต้องเตรียม") {
    return WHAT_TO_BRING_REPLY;
  }
  if (text === "book a ride" || text === "จองเลย") {
    return BOOKING_REPLY;
  }

  // ── Keyword matching (for freehand messages) ───────────────────────

  // Booking-related
  if (text.includes("book") || text.includes("reserve") || text.includes("จอง")) {
    return BOOKING_REPLY;
  }

  // Pricing
  if (text.includes("price") || text.includes("pricing") || text.includes("package") || text.includes("cost") || text.includes("how much") || text.includes("ราคา") || text.includes("แพ็ค")) {
    return PRICING_REPLY;
  }

  // Location / meeting point
  if (text.includes("where") || text.includes("location") || text.includes("map") || text.includes("ที่ไหน") || text.includes("meeting") || text.includes("ที่ตั้ง")) {
    return LOCATION_REPLY;
  }

  // Time / schedule
  if (text.includes("time") || text.includes("schedule") || text.includes("slot") || text.includes("เวลา")) {
    return `⏰ We ride 5 time slots:\n\n🌅 Morning:\n• Early Bird — 06:15–08:15\n• Energy Booster — 06:30–08:30\n\n🌇 Evening:\n• Light Chaser — 16:15–18:15\n• Golden Hour — 16:45–18:45\n• Twilight Finish — 17:15–19:15\n\n👉 Book: https://enjoyspeedbkk.com/booking`;
  }

  // Weather / rain policy
  if (text.includes("rain") || text.includes("weather") || text.includes("cancel") || text.includes("ฝน")) {
    return `🌧️ Rain Policy:\n\nIf we cancel due to weather, you get:\n• Free reschedule to any date\n• Rain credit (valid 90 days)\n• Full refund option\n\nWe monitor conditions closely and notify you as early as possible. Safety first!`;
  }

  // What to bring
  if (text.includes("bring") || text.includes("wear") || text.includes("what to") || text.includes("prepare") || text.includes("need to") || text.includes("เอาอะไร") || text.includes("เตรียม")) {
    return WHAT_TO_BRING_REPLY;
  }

  // Hello / greeting
  if (text === "hi" || text === "hello" || text === "hey" || text.includes("สวัสดี")) {
    return `Hi there! 👋 Welcome to En-Joy Speed!\n\nHow can we help?\n\n💰 Pricing → type "price"\n📍 Location → type "where"\n⏰ Time slots → type "time"\n📋 What to bring → type "bring"\n🚴 Book a ride → https://enjoyspeedbkk.com/booking`;
  }

  // Status check
  if (text.includes("status") || text.includes("my booking") || text.includes("สถานะ")) {
    return `Check your booking here:\n👉 https://enjoyspeedbkk.com/bookings\n\nIf something looks wrong, just reply and we'll sort it out!`;
  }

  // Fallback — let admin handle it manually
  return null;
}

// ── GET handler — LINE verifies the webhook URL with a GET request ────
export async function GET() {
  return NextResponse.json({ status: "ok" });
}

// ── Reply helper ──────────────────────────────

async function sendReply(
  replyToken: string,
  messages: { type: string; text: string }[]
) {
  try {
    await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ replyToken, messages }),
    });
  } catch (err) {
    console.error("[LINE] Reply failed:", err);
  }
}
