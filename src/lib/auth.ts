/**
 * Auth library — now backed by Supabase instead of localStorage.
 * 
 * localStorage is kept as a fast local cache so the app feels instant,
 * but Supabase is the source of truth. This means:
 * - Account survives clearing browser data (just sign in again)
 * - Plan status is server-verified — paying users never lose access
 * - Generation counts sync correctly across devices
 * - Works on any device, any browser, always
 */

import { supabase } from "./supabase";

export interface User {
  id: string;
  email: string;
  fullName: string;
  plan: "starter" | "creator" | "studio";
}

const USER_KEY = "geenie_user_v2";

// ── Local cache helpers (for instant UI, always backed by Supabase) ────────

export function getCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function cacheUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem("geenie_plan", user.plan);
}

function clearCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("geenie_plan");
  localStorage.removeItem("geenie_anime_count");
  localStorage.removeItem("geenie_cartoon_count");
}

// Backwards compatible — used in route guards and existing code
export function getUser(): User | null {
  return getCachedUser();
}

// ── Auth operations ────────────────────────────────────────────────────────

export type AuthResult =
  | { success: true; user: User }
  | { success: false; error: string };

export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResult> {
  if (!email || !password || !fullName) {
    return { success: false, error: "All fields are required." };
  }
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase().trim(),
    password,
    options: { data: { full_name: fullName.trim() } },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { success: false, error: "An account with this email already exists." };
    }
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: "Sign up failed. Please try again." };
  }

  // If Supabase has email confirmation enabled, session will be null
  // and the user needs to verify their email before signing in.
  if (!data.session) {
    return { success: false, error: "CHECK_EMAIL" };
  }

  const user: User = {
    id: data.user.id,
    email: data.user.email!,
    fullName: fullName.trim(),
    plan: "starter",
  };

  cacheUser(user);
  return { success: true, user };
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login")) {
      return { success: false, error: "Incorrect email or password." };
    }
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: "Sign in failed. Please try again." };
  }

  // Fetch the profile to get the real plan from the database
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, anime_count, cartoon_count, full_name")
    .eq("id", data.user.id)
    .single();

  const user: User = {
    id: data.user.id,
    email: data.user.email!,
    fullName: profile?.full_name ?? data.user.user_metadata?.full_name ?? "",
    plan: (profile?.plan as User["plan"]) ?? "starter",
  };

  // Sync counts to localStorage for studio components
  if (profile) {
    localStorage.setItem("geenie_anime_count", String(profile.anime_count ?? 0));
    localStorage.setItem("geenie_cartoon_count", String(profile.cartoon_count ?? 0));
  }

  cacheUser(user);
  return { success: true, user };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  clearCache();
}

/** Refresh user profile from Supabase — call after payment to sync new plan */
export async function refreshProfile(): Promise<User | null> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, anime_count, cartoon_count, full_name")
    .eq("id", authUser.id)
    .single();

  if (!profile) return null;

  const user: User = {
    id: authUser.id,
    email: authUser.email!,
    fullName: profile.full_name ?? "",
    plan: profile.plan as User["plan"],
  };

  localStorage.setItem("geenie_anime_count", String(profile.anime_count ?? 0));
  localStorage.setItem("geenie_cartoon_count", String(profile.cartoon_count ?? 0));
  cacheUser(user);
  return user;
}

/** Update plan in Supabase after successful Razorpay payment */
export async function activatePlan(plan: "creator" | "studio"): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("profiles")
    .update({ plan })
    .eq("id", user.id);

  if (error) return false;

  // Update local cache immediately so UI reflects change without reload
  const cached = getCachedUser();
  if (cached) {
    cached.plan = plan;
    cacheUser(cached);
  }
  return true;
}

// ── React hook ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(getCachedUser);

  useEffect(() => {
    // Sync with Supabase session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setUser(null);
        clearCache();
        return;
      }
      // Refresh profile to get latest plan from server
      refreshProfile().then((u) => setUser(u));
    });

    // Listen for auth state changes (sign in/out from other tabs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setUser(null);
          clearCache();
        } else if (event === "SIGNED_IN" && session) {
          const u = await refreshProfile();
          setUser(u);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user };
}
