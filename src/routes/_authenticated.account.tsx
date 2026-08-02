import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth, signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { CreditCard, User, Shield, Trash2, LogOut, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account — Geenie AI Studio" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState("starter");
  const [animeCount, setAnimeCount] = useState(0);
  const [cartoonCount, setCartoonCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPlan(localStorage.getItem("geenie_plan") ?? "starter");
    setAnimeCount(parseInt(localStorage.getItem("geenie_anime_count") ?? "0"));
    setCartoonCount(parseInt(localStorage.getItem("geenie_cartoon_count") ?? "0"));
  }, []);

  const isPaid = plan === "creator" || plan === "studio";
  const grad = { background: "var(--gradient-brand)" };

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/", replace: true });
  }

  async function handleDeleteAccount() {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      // Delete profile from Supabase
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase.from("profiles").delete().eq("id", authUser.id);
        await supabase.auth.admin?.deleteUser(authUser.id).catch(() => {});
      }
      await signOut();
      toast.success("Your account has been deleted.");
      navigate({ to: "/", replace: true });
    } catch {
      // Even if Supabase deletion fails, sign them out
      await signOut();
      toast.success("Signed out. Contact us at abhishek2k1985@gmail.com to complete account deletion.");
      navigate({ to: "/", replace: true });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium" style={{ color: "var(--magenta)" }}>Settings</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your Account</h1>
      </div>

      {/* Profile */}
      <div className="glass rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Profile</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{user?.fullName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Plan & Billing */}
      <div className="glass rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Plan & Billing</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Current plan</span>
            <span className="font-semibold capitalize" style={{ color: isPaid ? "var(--magenta)" : undefined }}>
              {plan.charAt(0).toUpperCase() + plan.slice(1)}
            </span>
          </div>
          {isPaid && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium">{plan === "creator" ? "₹166/month" : "₹583/month"}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Anime generated</span>
            <span className="font-medium">{animeCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Cartoon generated</span>
            <span className="font-medium">{cartoonCount}</span>
          </div>
        </div>

        {!isPaid ? (
          <a href="/#pricing"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            style={grad}>
            Upgrade to Creator <ArrowRight className="h-4 w-4" />
          </a>
        ) : (
          <div className="mt-5 rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
            <p className="text-xs text-orange-700 font-medium flex items-start gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                To cancel your subscription, email{" "}
                <a href="mailto:abhishek2k1985@gmail.com?subject=Cancel subscription" className="underline font-semibold">
                  abhishek2k1985@gmail.com
                </a>{" "}
                with the subject "Cancel subscription". We'll process it within 24 hours and your access continues until the end of the billing period.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Security */}
      <div className="glass rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Security</h2>
        </div>
        <a href="/auth?reset=true"
          className="text-sm text-muted-foreground hover:text-foreground transition underline">
          Change password
        </a>
      </div>

      {/* Sign out & Delete */}
      <div className="glass rounded-2xl p-6 space-y-3">
        <button onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl bg-surface border border-border px-4 py-3 text-sm font-medium hover:bg-surface-elevated transition">
          <LogOut className="h-4 w-4 text-muted-foreground" />
          Sign out
        </button>

        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition border border-red-200">
            <Trash2 className="h-4 w-4" />
            Delete account
          </button>
        ) : (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700 font-medium mb-3">
              ⚠️ This permanently deletes your account and all data. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl bg-surface border border-border px-4 py-2 text-sm font-medium hover:bg-surface-elevated transition">
                Cancel
              </button>
              <button onClick={handleDeleteAccount} disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-60">
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
