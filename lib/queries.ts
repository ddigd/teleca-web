import { supabase } from "./supabase";
import type { Collection, HeroSettings } from "./types";

export async function getCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("*, chasing_cards(*), checklist_items(*)")
    .order("sort_order", { ascending: true });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function getCollection(id: string): Promise<Collection | null> {
  const { data, error } = await supabase
    .from("collections")
    .select("*, chasing_cards(*, sort_order), checklist_items(*, sort_order)")
    .eq("id", id)
    .single();
  if (error) { console.error(error); return null; }
  return data;
}

export async function getHeroSettings(): Promise<HeroSettings> {
  const { data } = await supabase.from("hero_settings").select("*").single();
  return data || { id: 1, title: "COLLECT\nTHE LEGENDS", subtitle: "Collect special moments of the world's greatest stars", featured_id: null };
}

export async function submitContactInquiry(form: { name: string; email: string; company?: string; subject?: string; message: string }) {
  const { error } = await supabase.from("contact_inquiries").insert(form);
  return !error;
}

export async function submitOrderInquiry(form: any) {
  const { error } = await supabase.from("order_inquiries").insert(form);
  return !error;
}
