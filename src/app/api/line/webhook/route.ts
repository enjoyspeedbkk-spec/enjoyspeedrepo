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

function getAutoReply(text: string): string | null {
  // Booking-related
  if (text.includes("book") || text.includes("reserve") || text.includes("จอง")) {
    return `Ready to ride? 🚴\n\nBook here: https://enjoyspeedbkk.com/booking\n\nPick your date, time, and group size — takes about 2 minutes!`;
  }

  // Pricing
  if (text.includes("price") || text.includes("pricing") || text.includes("package") || text.includes("cost") || text.includes("how much") || text.includes("ราคา") || text.includes("แพ็ค")) {
    return `Our rides start at 2,000 THB/person 🚴\n\n• Duo (2 riders): 2,500 THB/person\n• Squad (3-5): 2,100 THB/person\n• Peloton (6-8): 2,000 THB/person\n\nEach rider gets a free Starter Kit (padded shorts, energy gel, eco bag)!\n\nBike rental: Hybrid 420 THB, Road 720 THB — or bring your own.\n\nBook: https://enjoyspeedbkk.com/booking`;
  }

  // Location / meeting point
  if (text.includes("where") || text.includes("location") || text.includes("map") || text.includes("ที่ไหน") || text.includes("meeting")) {
    return `📍 We meet at Skylane (Happy and Healthy Bike Lane) near Suvarnabhumi Airport.\n\nExact pin: https://maps.app.goo.gl/skylane\n\nWe'll send you detailed directions 24 hours before your ride!`;
  }

  // Time / schedule
  if (text.includes("time") || text.includes("schedule") || text.includes("slot") || text.includes("เวลา")) {
    return `⏰ We ride 5 time slots:\n\nMorning:\n• Early Bird — 06:15-08:15\n• Energy Booster — 06:30-08:30\n• Sunrise — 06:45-08:45\n\nEvening:\n• Golden Hour — 15:30-17:30\n• Sunset — 16:00-18:00\n\nBook: https://enjoyspeedbkk.com/booking`;
  }

  // Weather / rain policy
  if (text.includes("rain") || text.includes("weather") || text.includes("cancel") || text.includes("ฝน")) {
    return `🌧️ Rain Policy:\n\nIf we cancel due to weather, you get:\n• Free reschedule to any date\n• Rain credit (valid 90 days)\n• Refund option\n\nWe monitor weather closely and notify you ASAP if conditions are unsafe.`;
  }

  // What to bring
  if (text.includes("bring") || text.includes("wear") || text.includes("what to") || text.includes("prepare") || text.includes("need to") || text.includes("เอาอะไร") || text.includes("เตรียม")) {
    return `📋 What to bring:\n\n✅ Sport shoes (closed-toe, mandatory)\n✅ Athletic socks\n✅ Breathable top\n✅ Sunscreen + sunglasses\n✅ Water bottle\n\n🎁 We provide: helmet, bike (if renting), and your Starter Kit (padded shorts, energy gel, eco bag)!`;
  }

  // Hello / greeting
  if (text === "hi" || text === "hello" || text === "hey" || text.includes("สวัสดี")) {
    return `Hi there! 👋\n\nWelcome to En-Joy Speed! How can we help?\n\n🚴 Book a ride: https://enjoyspeedbkk.com/booking\n💰 See pricing: type "price"\n📍 Location: type "where"\n⏰ Time slots: type "time"\n📋 What to bring: type "bring"`;
  }

  // Status check
  if (text.includes("status") || text.includes("my booking") || text.includes("สถานะ")) {
    return `Check your booking status here:\nhttps://enjoyspeedbkk.com/bookings\n\nIf you have any issues, just describe them here and we'll get back to you!`;
  }

  // Fallback — don't auto-reply, let admin handle it
  return null;
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
