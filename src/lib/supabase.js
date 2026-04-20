import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "./appConfig";

export { isSupabaseConfigured };

let supabaseClientPromise = null;

export async function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!supabaseClientPromise) {
    supabaseClientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(supabaseUrl, supabaseAnonKey)
    );
  }

  return supabaseClientPromise;
}
