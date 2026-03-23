import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// ========================================
// LINE Webhook Handler
// Receives events from LINE Messaging API
// ========================================

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

// Verify LINE webhook signature
function verifySignature(body: string, signature: string): boolean {
  if (!CHANNEL_SECRET) return false;
  const hash = crypto
    .createHmac("SHA256", CHANNEL_SECRET)
    .update(body)
    .digest("base64");
  return hash === signature;
}

// Send a reply message via LINE Messaging API
async function replyMessage(replyToken: string, messages: LineMessage[]) {
  if (!CHANNEL_ACCESS_TOKEN) return;

  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
}

// Send a push message to a specific user
export async function pushMessage(userId: string, messages: LineMessage[]) {
  if (!CHANNEL_ACCESS_TOKEN) return;

  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to: userId, messages }),
  });
}

interface LineMessage {
  type: "text" | "flex" | "template" | "image";
  text?: string;
  altText?: string;
  contents?: unknown;
  template?: unknown;
}

interface LineEvent {
  type: string;
  replyToken: string;
  source: {
    type: string;
    userId: string;
  };
  message?: {
    type: string;
    text?: string;
  };
  timestamp: number;
}

// Handle individual LINE events
async function handleEvent(event: LineEvent) {
  const admin = createAdminClient();
  const lineUserId = event.source?.userId;

  if (!lineUserId) return;

  switch (event.type) {
    // ========================================
    // FOLLOW — user adds @EnjoySpeed
    // ========================================
    case "follow": {
      // Fetch display name from LINE profile API
      let displayName = "";
      if (CHANNEL_ACCESS_TOKEN) {
        try {
          const profileRes = await fetch(
            `https://api.line.me/v2/bot/profile/${lineUserId}`,
            { headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` } }
          );
          if (profileRes.ok) {
            const profile = await profileRes.json();
            displayName = profile.displayName || "";
          }
        } catch { /* ignore profile fetch failure */ }
      }

      // Store the LINE user ID for future push messages
      const { error } = await admin.from("line_users").upsert(
        {
          line_user_id: lineUserId,
          display_name: displayName || null,
          followed_at: new Date().toISOString(),
          is_following: true,
        },
        { onConflict: "line_user_id" }
      );

      if (error) {
        console.error("LINE follow store error:", error);
      }

      // Send welcome message
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: `🚴 Welcome to En-Joy Speed!\n\nThailand's premium guided cycling experience at the Skylane, Suvarnabhumi.\n\n🎯 Tap "Book a Ride" below to get started!\n\nQuestions? Just message us here — we reply within the hour.`,
        },
      ]);
      break;
    }

    // ========================================
    // UNFOLLOW — user removes @EnjoySpeed
    // ========================================
    case "unfollow": {
      await admin
        .from("line_users")
        .update({ is_following: false, unfollowed_at: new Date().toISOString() })
        .eq("line_user_id", lineUserId);
      break;
    }

    // ========================================
    // MESSAGE — user sends a text message
    // ========================================
    case "message": {
      const text = event.message?.text?.toLowerCase() || "";

      if (text.includes("book") || text.includes("ride") || text.includes("จอง")) {
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text: `🚴 Ready to ride?\n\nBook your guided cycling session here:\n👉 https://enjoyspeedbkk.com/booking\n\nChoose from:\n• Duo (2 riders) — ฿2,500/person\n• The Squad (3-5) — ฿2,100/person\n• The Peloton (6-8) — ฿2,000/person\n\nAll packages include a Starter Kit! 🎁`,
          },
        ]);
      } else if (text.includes("price") || text.includes("ราคา") || text.includes("cost")) {
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text: `💰 En-Joy Speed Pricing:\n\n🔹 Duo (2 riders): ฿2,500/person\n🔹 The Squad (3-5): ฿2,100/person\n🔹 The Peloton (6-8): ฿2,000/person\n\n🚲 Bike rental:\n• Hybrid: ฿420 (paid at track)\n• Road: ฿700 (paid at track)\n• Own bike: Free\n\n🎁 Every rider gets a Starter Kit (padded liner shorts, energy gel, eco mesh bag)\n\n👉 Book now: https://enjoyspeedbkk.com/booking`,
          },
        ]);
      } else if (text.includes("help") || text.includes("ช่วย")) {
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text: `Hi! Here's what I can help with:\n\n📅 Type "book" — Start a booking\n💰 Type "price" — See our packages\n🕐 Type "time" — Ride schedule\n❓ Anything else — Our team will get back to you!\n\nOr visit: https://enjoyspeedbkk.com`,
          },
        ]);
      } else if (text.includes("time") || text.includes("schedule") || text.includes("เวลา")) {
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text: `🕐 Ride Times at Skylane:\n\n🌅 Morning:\n• A1 Early Bird: 06:15–08:15\n• A2 Energy Booster: 06:30–08:30\n\n🌇 Evening:\n• B Light Chaser: 16:15–18:15\n• C Golden Hour: 16:45–18:45\n• D Twilight Finish: 17:15–19:15\n\n📍 Location: Skylane (Happy and Healthy Bike Lane), Suvarnabhumi\n\n👉 Book: https://enjoyspeedbkk.com/booking`,
          },
        ]);
      } else {
        // Generic response — Pailin/Udorn will see this in LINE OA chat manager
        await replyMessage(event.replyToken, [
          {
            type: "text",
            text: `Thanks for your message! 🙏\n\nOur team will reply shortly. In the meantime:\n\n📅 Book a ride: https://enjoyspeedbkk.com/booking\n💰 See pricing: Type "price"\n🕐 Ride times: Type "time"`,
          },
        ]);
      }
      break;
    }
  }
}

// ========================================
// POST handler — receives LINE webhook events
// ========================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-line-signature") || "";

    // Verify the request is from LINE
    if (CHANNEL_SECRET && !verifySignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(body);
    const events: LineEvent[] = data.events || [];

    // Process events (don't block the response)
    await Promise.allSettled(events.map(handleEvent));

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("LINE webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// LINE verifies the webhook URL with a GET request
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
