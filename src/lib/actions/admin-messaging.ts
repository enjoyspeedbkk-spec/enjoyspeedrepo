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

export async function getMessageTemplates() {
  const { admin } = await requireAdmin();
  const { data } = await admin
    .from("messaging_templates")
    .select("*")
    .order("type")
    .order("name");
  return data || [];
}

export async function updateMessageTemplate(
  id: string,
  updates: { name?: string; subject?: string; content?: string; is_active?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("messaging_templates").update(updates).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function createMessageTemplate(
  template: { type: string; name: string; subject?: string; content: string; language?: string }
): Promise<{ success: boolean; error?: string }> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("messaging_templates").insert(template);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteMessageTemplate(id: string): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("messaging_templates").delete().eq("id", id);
  return { success: !error };
}

export async function getAutoresponders() {
  const { admin } = await requireAdmin();
  const { data } = await admin
    .from("autoresponders")
    .select("*, messaging_templates(name, type)")
    .order("trigger_event");
  return data || [];
}

export async function toggleAutoresponder(id: string, enabled: boolean): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("autoresponders").update({ enabled }).eq("id", id);
  return { success: !error };
}
