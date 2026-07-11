import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";
import { signOut, getUser, useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  Sparkles,
  LayoutDashboard,
  Image as ImageIcon,
  Film,
  Video,
  Wand2,
  PenLine,
  Briefcase,
  Palette,
  Mic,
  History,
  Settings,
  LogOut,
  CreditCard,
  Bell,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    // Server-side: skip. Client-side: check localStorage.
    if (typeof window !== "undefined" && !getUser()) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  function handleSignOut() {
    signOut();
    toast.success("Signed out successfully.");
    navigate({ to: "/", replace: true });
  }

  const initials = (user?.fullName || user?.email || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const SidebarInner = () => (
    <>
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2.5 px-5 py-5 border-b border-border/40"
        onClick={() => setSidebarOpen(false)}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="font-display text-base font-semibold leading-none">
          Geenie <span className="text-gradient">AI</span>
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        <NavGroup title="Workspace">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Overview" pathname={pathname} onClick={() => setSidebarOpen(false)} />
          <NavItem icon={History} label="History" pathname={pathname} />
          
        </NavGroup>

        <NavGroup title="Studios">
          <NavItem to="/studios/photo" icon={ImageIcon} label="Photo Editor" pathname={pathname} onClick={() => setSidebarOpen(false)} />
          <NavItem to="/studios/video-editor" icon={Video} label="Video Editor" pathname={pathname} onClick={() => setSidebarOpen(false)} />
          <NavItem to="/studios/anime" icon={Sparkles} label="Anime Style" pathname={pathname} onClick={() => setSidebarOpen(false)} />
          <NavItem to="/studios/cartoon" icon={Palette} label="Cartoon & Comic" pathname={pathname} onClick={() => setSidebarOpen(false)} />
        </NavGroup>

        <NavGroup title="Account">
          <NavItem icon={CreditCard} label="Billing" pathname={pathname} onClick={() => window.open("/#pricing", "_self")} />
          
          
        </NavGroup>
      </nav>

      {/* User row */}
      <div className="border-t border-border/40 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: "var(--gradient-brand)" }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">{user?.fullName || "—"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border/40 md:flex">
        <SidebarInner />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border/40 bg-background/95 backdrop-blur transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarInner />
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1 flex flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle menu"
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-surface-elevated"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="font-display text-sm font-semibold">
              Geenie <span className="text-gradient">AI</span>
            </span>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
  pathname,
  soon,
  onClick,
}: {
  to?: string;
  icon: typeof LayoutDashboard;
  label: string;
  pathname: string;
  soon?: boolean;
  onClick?: () => void;
}) {
  const active = to ? pathname === to || pathname.startsWith(to + "/") : false;

  if (soon || !to) {
    return (
      <div
        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/40 cursor-not-allowed"
        title={`${label} — coming soon`}
        aria-disabled="true"
      >
        <span className="flex items-center gap-3">
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </span>
        <span className="rounded-full bg-surface-elevated px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">
          Soon
        </span>
      </div>
    );
  }

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition ${
        active
          ? "bg-surface-elevated text-foreground font-medium"
          : "text-muted-foreground hover:bg-surface-elevated/60 hover:text-foreground"
      }`}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
      {active && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
    </Link>
  );
}
