"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface HeroVideo {
  src: string;
  label: string;
}

// Default hardcoded videos (fallback if config not set)
const DEFAULT_HERO_VIDEOS: HeroVideo[] = [
  {
    src: "https://oqldbxkluuoyrmzehkpk.supabase.co/storage/v1/object/public/videos/video%20of%20cycling%20golden%20hour%20morning%20vertical.mp4",
    label: "hero.videoLabels.goldenHourMorning",
  },
  {
    src: "https://oqldbxkluuoyrmzehkpk.supabase.co/storage/v1/object/public/videos/front%20facing%20golden%20hour%20vertical.mp4",
    label: "hero.videoLabels.frontFacing",
  },
  {
    src: "https://oqldbxkluuoyrmzehkpk.supabase.co/storage/v1/object/public/videos/Side%20view%20of%20sunrise%20golden%20hour%20cycling%20video%20vertical.mp4",
    label: "hero.videoLabels.sunriseSideView",
  },
  {
    src: "https://oqldbxkluuoyrmzehkpk.supabase.co/storage/v1/object/public/videos/Video%20of%20cycling%20in%20the%20morning%20blue%20hour%20vertical.mp4",
    label: "hero.videoLabels.blueHour",
  },
  {
    src: "https://oqldbxkluuoyrmzehkpk.supabase.co/storage/v1/object/public/videos/wide%20angle%20blue%20hour%20morning%20vertical.mp4",
    label: "hero.videoLabels.wideAngle",
  },
];

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Not authorized");
  return { userId: user.id, admin };
}

/**
 * Get hero videos from site_config. If not found, returns default videos.
 * Used by admin panel to manage hero videos.
 */
export async function getHeroVideos(): Promise<HeroVideo[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_config")
      .select("value")
      .eq("key", "hero_videos")
      .single();

    if (data && data.value) {
      const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      return Array.isArray(parsed) ? parsed : DEFAULT_HERO_VIDEOS;
    }
    return DEFAULT_HERO_VIDEOS;
  } catch (error) {
    console.warn("Failed to fetch hero videos from site_config:", error);
    return DEFAULT_HERO_VIDEOS;
  }
}

/**
 * Update hero videos in site_config.
 * Requires admin authentication.
 */
export async function updateHeroVideos(
  videos: HeroVideo[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, admin } = await requireAdmin();

    const { error } = await admin
      .from("site_config")
      .update({
        value: JSON.stringify(videos),
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq("key", "hero_videos");

    if (error) return { success: false, error: error.message };

    revalidatePath("/");
    revalidatePath("/admin/images");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Get hero videos config for public use (Hero component).
 * No auth required — reads using admin client to bypass RLS.
 * Falls back to defaults if config not found.
 */
export async function getHeroVideoConfig(): Promise<HeroVideo[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_config")
      .select("value")
      .eq("key", "hero_videos")
      .single();

    if (data && data.value) {
      const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      return Array.isArray(parsed) ? parsed : DEFAULT_HERO_VIDEOS;
    }
    return DEFAULT_HERO_VIDEOS;
  } catch (error) {
    // Silent fail — just return defaults
    return DEFAULT_HERO_VIDEOS;
  }
}
