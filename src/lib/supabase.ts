import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gwqppskwsfuyjwnsfgdm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cXBwc2t3c2Z1eWp3bnNmZ2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzE3MzUsImV4cCI6MjEwMDkwNzczNX0.zK7KLrh6dzf42GWdIBJV5obxuJCE5Z_FbFhhyBCU9KE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  plan: "starter" | "creator" | "studio";
  anime_count: number;
  cartoon_count: number;
  created_at: string;
};

/** Get the current user's profile from Supabase */
export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return null;
  return data as Profile;
}

/** Update a field on the current user's profile */
export async function updateProfile(updates: Partial<Profile>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  return !error;
}

/** Increment generation count for a studio */
export async function incrementCount(field: "anime_count" | "cartoon_count"): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data, error } = await supabase.rpc("increment_count", {
    user_id: user.id,
    field_name: field,
  });

  if (error) return 0;
  return data as number;
}
