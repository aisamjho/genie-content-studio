// Stub — Supabase auth middleware removed. Auth is handled client-side via src/lib/auth.ts
import { createMiddleware } from "@tanstack/react-start";
export const attachSupabaseAuth = createMiddleware().server(async ({ next }) => next());
