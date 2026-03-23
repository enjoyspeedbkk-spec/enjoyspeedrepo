"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface SiteImageSetting {
  id: string;
  image_key: string;
  label: string;
  category: string;
  current_url: string;
  object_position: string;
  object_fit: string;
  brightness: number;
  contrast: number;
  saturate: number;
  custom_css: string | null;
  notes: string | null;
  updated_at: string;
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Not authorized");
  return { userId: user.id, admin };
}

export async function getSiteImageSettings(): Promise<SiteImageSetting[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_image_settings")
    .select("*")
    .order("category")
    .order("label");
  return (data || []) as SiteImageSetting[];
}

export async function getSiteImageSetting(imageKey: string): Promise<SiteImageSetting | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_image_settings")
    .select("*")
    .eq("image_key", imageKey)
    .single();
  return data as SiteImageSetting | null;
}

// Get multiple settings by keys (for components that need several images)
export async function getSiteImageSettingsBatch(imageKeys: string[]): Promise<Record<string, SiteImageSetting>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_image_settings")
    .select("*")
    .in("image_key", imageKeys);

  const result: Record<string, SiteImageSetting> = {};
  (data || []).forEach((item: SiteImageSetting) => {
    result[item.image_key] = item;
  });
  return result;
}

export async function updateImagePosition(
  imageKey: string,
  objectPosition: string
): Promise<{ success: boolean; error?: string }> {
  const { userId, admin } = await requireAdmin();

  const { error } = await admin
    .from("site_image_settings")
    .update({ object_position: objectPosition, updated_by: userId })
    .eq("image_key", imageKey);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/booking");
  revalidatePath("/admin/images");
  return { success: true };
}

export async function updateImageSettings(
  imageKey: string,
  updates: {
    object_position?: string;
    object_fit?: string;
    brightness?: number;
    contrast?: number;
    saturate?: number;
    custom_css?: string;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const { userId, admin } = await requireAdmin();

  const { error } = await admin
    .from("site_image_settings")
    .update({ ...updates, updated_by: userId })
    .eq("image_key", imageKey);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/booking");
  revalidatePath("/admin/images");
  return { success: true };
}

export async function replaceImage(
  imageKey: string,
  base64Data: string,
  fileName: string,
  mimeType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const { userId, admin } = await requireAdmin();

  const buffer = Buffer.from(base64Data.split(",").pop() || base64Data, "base64");
  const storagePath = `site-images/${imageKey}/${Date.now()}-${fileName}`;

  const { error: uploadError } = await admin.storage
    .from("admin-uploads")
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

  if (uploadError) return { success: false, error: uploadError.message };

  const { data: urlData } = admin.storage.from("admin-uploads").getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  const { error: dbError } = await admin
    .from("site_image_settings")
    .update({ current_url: publicUrl, updated_by: userId })
    .eq("image_key", imageKey);

  if (dbError) return { success: false, error: dbError.message };

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/booking");
  revalidatePath("/admin/images");
  return { success: true, url: publicUrl };
}
