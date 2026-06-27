/**
 * Geenie AI Studio — Auth Store
 *
 * Simple localStorage-based auth. No external service needed to run the app.
 * When you are ready to add real auth, swap this module's implementation —
 * all components import from here so nothing else needs to change.
 */

export interface User {
  id: string;
  email: string;
  fullName: string;
  plan: "starter" | "creator" | "studio";
  credits: number;
  creditsTotal: number;
  createdAt: string;
}

const STORAGE_KEY = "geenie_user";

// ─── Read / Write ──────────────────────────────────────────────────────────────

export function getUser(): User | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function saveUser(user: User): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Auth operations ───────────────────────────────────────────────────────────

// Registered accounts live in localStorage keyed by email
const ACCOUNTS_KEY = "geenie_accounts";

interface StoredAccount {
  email: string;
  passwordHash: string; // simple btoa hash — good enough for demo/prototype
  fullName: string;
  createdAt: string;
}

function getAccounts(): Record<string, StoredAccount> {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(ACCOUNTS_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAccounts(accounts: Record<string, StoredAccount>): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function hashPassword(password: string): string {
  return btoa(encodeURIComponent(password));
}

export type AuthResult =
  | { success: true; user: User }
  | { success: false; error: string };

export function signUp(email: string, password: string, fullName: string): AuthResult {
  if (!email || !password || !fullName) {
    return { success: false, error: "All fields are required." };
  }
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  const accounts = getAccounts();
  const key = email.toLowerCase().trim();

  if (accounts[key]) {
    return { success: false, error: "An account with this email already exists." };
  }

  const account: StoredAccount = {
    email: key,
    passwordHash: hashPassword(password),
    fullName: fullName.trim(),
    createdAt: new Date().toISOString(),
  };

  accounts[key] = account;
  saveAccounts(accounts);

  const user = buildUser(account);
  saveUser(user);
  return { success: true, user };
}

export function signIn(email: string, password: string): AuthResult {
  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const accounts = getAccounts();
  const key = email.toLowerCase().trim();
  const account = accounts[key];

  if (!account || account.passwordHash !== hashPassword(password)) {
    return { success: false, error: "Incorrect email or password." };
  }

  const user = buildUser(account);
  saveUser(user);
  return { success: true, user };
}

export function signOut(): void {
  clearUser();
}

function buildUser(account: StoredAccount): User {
  return {
    id: btoa(account.email),
    email: account.email,
    fullName: account.fullName,
    plan: "starter",
    credits: 50,
    creditsTotal: 50,
    createdAt: account.createdAt,
  };
}

// ─── React hook ────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    setLoading(false);

    // Watch for changes from other tabs
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
