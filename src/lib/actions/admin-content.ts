"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Not authorized");
  return { userId: user.id, admin };
}

export async function getUploadedAssets(type?: string) {
  const { admin } = await requireAdmin();
  let query = admin.from("uploaded_assets").select("*").order("sort_order").order("created_at", { ascending: false });
  if (type) query = query.eq("type", type);
  const { data } = await query.limit(100);
  return data || [];
}

export async function uploadAsset(
  base64Data: string,
  fileName: string,
  mimeType: string,
  assetType: string,
  title: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const { userId, admin } = await requireAdmin();

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data.split(",").pop() || base64Data, "base64");
  const storagePath = `${assetType}/${Date.now()}-${fileName}`;

  const { error: uploadError } = await admin.storage
    .from("admin-uploads")
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

  if (uploadError) return { success: false, error: uploadError.message };

  const { data: urlData } = admin.storage.from("admin-uploads").getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  // Create asset record
  const { error: dbError } = await admin.from("uploaded_assets").insert({
    type: assetType,
    title,
    storage_url: publicUrl,
    file_name: fileName,
    file_size: buffer.length,
    mime_type: mimeType,
    uploaded_by: userId,
  });

  if (dbError) return { success: false, error: dbError.message };
  return { success: true, url: publicUrl };
}

export async function deleteAsset(id: string): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();

  // Get the asset to find storage path
  const { data: asset } = await admin.from("uploaded_assets").select("storage_url").eq("id", id).single();

  if (asset?.storage_url) {
    // Extract path from URL
    const urlParts = asset.storage_url.split("/admin-uploads/");
    if (urlParts[1]) {
      await admin.storage.from("admin-uploads").remove([urlParts[1]]);
    }
  }

  const { error } = await admin.from("uploaded_assets").delete().eq("id", id);
  return { success: !error };
}

export async function updateAsset(
  id: string,
  updates: { title?: string; description?: string; sort_order?: number; is_active?: boolean }
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("uploaded_assets").update(updates).eq("id", id);
  return { success: !error };
}

// ========================================
// CAROUSEL MANAGEMENT
// ========================================
export async function getCarouselImages() {
  const { admin } = await requireAdmin();
  const { data } = await admin
    .from("uploaded_assets")
    .select("*")
    .eq("type", "carousel")
    .eq("is_active", true)
    .order("sort_order");
  return data || [];
}

export async function addToCarousel(
  assetId: string,
  caption: string
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("uploaded_assets")
    .update({ type: "carousel", description: caption, is_active: true })
    .eq("id", assetId);
  return { success: !error };
}

export async function removeFromCarousel(assetId: string): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("uploaded_assets")
    .update({ type: "gallery" })
    .eq("id", assetId);
  return { success: !error };
}

export async function reorderCarousel(
  orderedIds: string[]
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const updates = orderedIds.map((id, i) =>
    admin.from("uploaded_assets").update({ sort_order: i }).eq("id", id)
  );
  await Promise.all(updates);
  return { success: true };
}

export async function rotateImage(
  assetId: string,
  degrees: number
): Promise<{ success: boolean; error?: string }> {
  const { admin } = await requireAdmin();

  // Get current asset
  const { data: asset } = await admin
    .from("uploaded_assets")
    .select("*")
    .eq("id", assetId)
    .single();

  if (!asset) return { success: false, error: "Asset not found" };

  // Store rotation metadata (actual pixel rotation happens on CDN/edge)
  const currentDesc = asset.description || "";
  const rotationNote = `[rotated:${degrees}deg]`;
  const newDesc = currentDesc.includes("[rotated:")
    ? currentDesc.replace(/\[rotated:\d+deg\]/, rotationNote)
    : `${currentDesc} ${rotationNote}`.trim();

  const { error } = await admin
    .from("uploaded_assets")
    .update({ description: newDesc })
    .eq("id", assetId);

  return { success: !error };
}
