import { createClient } from "@supabase/supabase-js";

export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Note: For MVP scaffold we return a plain server client without cookie wiring.
  // We will switch to @supabase/ssr in the Auth task when middleware is added.
  return createClient(url, anonKey);
}


