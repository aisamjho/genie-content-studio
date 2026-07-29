"use client";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Mail, Lock, User, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { signIn, signUp, getUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Geenie AI Studio" },
      { name: "description", content: "Sign in or create your Geenie AI Studio account." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getUser()) navigate({ to: "/dashboard", replace: true });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Password reset email sent! Check your inbox.");
          setMode("signin");
        }
        return;
      }

      const result =
        mode === "signup"
          ? await signUp(email, password, fullName)
          : await signIn(email, password);

      if (!result.success) {
        if (result.error === "CHECK_EMAIL") {
          toast.success("Account created! Check your email and click the confirmation link, then sign in.");
          setMode("signin");
        } else {
          toast.error(result.error);
        }
        return;
      }

      toast.success(mode === "signup" ? "Welcome to Geenie AI Studio! 🎉" : "Welcome back!");
      navigate({ to: "/dashboard", replace: true });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setEmail("");
    setPassword("");
    setFullName("");
  }

  const grad = { background: "var(--gradient-brand)" };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-16"
      style={{ backgroundImage: "var(--gradient-hero)", backgroundAttachment: "fixed" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={grad}>
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-2xl font-semibold">
            Geenie <span className="text-gradient">AI Studio</span>
          </span>
        </Link>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          {/* Forgot password mode */}
          {mode === "forgot" ? (
            <>
              <button onClick={() => switchMode("signin")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </button>
              <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <Field label="Email address" type="email" value={email} onChange={setEmail}
                  placeholder="you@example.com" icon={<Mail className="h-4 w-4" />} required />
                <button type="submit" disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:opacity-60"
                  style={grad}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "signin"
                  ? "Sign in to your studio and start creating."
                  : "Join Geenie and start creating amazing content."}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {mode === "signup" && (
                  <Field label="Full name" type="text" value={fullName} onChange={setFullName}
                    placeholder="Abhishek Tiwari" icon={<User className="h-4 w-4" />} required />
                )}
                <Field label="Email address" type="email" value={email} onChange={setEmail}
                  placeholder="you@example.com" icon={<Mail className="h-4 w-4" />} required />
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Password</label>
                    {mode === "signin" && (
                      <button type="button" onClick={() => switchMode("forgot")}
                        className="text-xs text-muted-foreground hover:text-foreground transition">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-violet focus:ring-2 focus:ring-violet/40"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                      aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {mode === "signup" && (
                    <p className="mt-1 text-xs text-muted-foreground">Minimum 6 characters.</p>
                  )}
                </div>

                <button type="submit" disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
                  style={grad}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign in" : "Create account"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button type="button" onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
                  className="font-medium text-foreground hover:underline">
                  {mode === "signin" ? "Sign up free" : "Sign in"}
                </button>
              </div>

              {mode === "signin" && (
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  No account yet?{" "}
                  <button type="button"
                    onClick={() => {
                      setEmail("demo@geenie.studio");
                      setPassword("demo123");
                    }}
                    className="text-foreground hover:underline">
                    Use demo credentials
                  </button>
                </p>
              )}
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link to="/terms" className="hover:text-foreground underline">Terms</Link>{" "}
          and{" "}
          <Link to="/privacy" className="hover:text-foreground underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder, icon, required }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  icon: React.ReactNode; required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative mt-1.5">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} required={required}
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-violet focus:ring-2 focus:ring-violet/40" />
      </div>
    </div>
  );
}
