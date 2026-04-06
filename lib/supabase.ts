import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Public client (browser-safe, respects RLS)
export const supabase = createClient(url, anonKey);

// Admin client (server-only, bypasses RLS)
export function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey);
}

// Helper: get public URL for storage images
export function getImageUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}
