import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  GitCompareArrows,
  Home,
  LayoutGrid,
  LogOut,
  Map,
  MapPin,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/risk-map", label: "Risk Map", icon: Map },
  { href: "/hazard-analysis", label: "Hazard Analysis", icon: AlertTriangle },
  { href: "/villages", label: "Vulnerable Habitations", icon: Home },
  { href: "/population-risk", label: "Population at Risk", icon: Users },
  { href: "/relocation-priority", label: "Relocation Priority", icon: TrendingUp },
  { href: "/safe-sites", label: "Safe-Site Discovery", icon: MapPin },
  { href: "/site-comparison", label: "Site Comparison", icon: GitCompareArrows },
  { href: "/relocation-policy", label: "Recommended Site", icon: CheckCircle2 },
  { href: "/reports", label: "Reports", icon: FileText },
];

export function DashboardShell({
  children,
  noScroll = false,
}: {
  children: ReactNode;
  noScroll?: boolean;
}) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("narada_sidebar_collapsed") === "true";
    }
    return false;
  });

  function toggleCollapse() {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("narada_sidebar_collapsed", String(next));
      }
      return next;
    });
  }

  return (
    <div className={`desk-grain ${noScroll ? "h-screen overflow-hidden" : "min-h-[100dvh]"} bg-[#ECE5DC] text-[#4B5125]`}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#727270]/20 bg-[#ECE5DC] text-[#2d3116] transition-all duration-300 md:translate-x-0 ${isCollapsed ? "w-[72px]" : "w-[260px]"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header matching reference image: Olive Box + NDMA / OPERATIONAL COMMAND */}
        <div
          className={`flex h-[76px] items-center border-b border-[#727270]/20 px-3.5 transition-all ${isCollapsed ? "justify-center" : "justify-between"
            }`}
        >
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden" data-testid="link-brand">
            <img
              src="/logo.png"
              alt="Narada Logo"
              className="h-[48px] w-[48px] shrink-0 object-contain rounded-lg shadow-xs"
            />
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-serif text-[18px] font-extrabold tracking-wide text-[#4B5125] leading-none">
                  NARADA
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[.18em] text-[#727270] font-semibold mt-1.5">
                  OPERATIONAL COMMAND
                </span>
              </div>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-[#727270] hover:text-[#4B5125]"
            aria-label="Close menu"
            data-testid="button-close-menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-1" aria-label="Primary navigation">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? location === "/" : location.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  title={isCollapsed ? label : undefined}
                  className={`group flex items-center gap-3.5 rounded-xs px-3.5 py-2.5 text-sm font-medium transition-colors ${active
                    ? "bg-[#4B5125] text-[#FEFEFE] shadow-xs"
                    : "text-[#2d3116] hover:bg-[#4B5125]/10 hover:text-[#4B5125]"
                    } ${isCollapsed ? "justify-center px-2" : ""}`}
                  data-testid={`link-nav-${label.toLowerCase().replaceAll(" ", "-")}`}
                >
                  <Icon
                    size={19}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={`shrink-0 ${active ? "text-[#FEFEFE]" : "text-[#4B5125]"}`}
                  />
                  {!isCollapsed && <span className="truncate">{label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Status & Collapse Toggle: • SYSTEM SECURE  [ |< ] */}
        <div
          className={`border-t border-[#727270]/20 p-3.5 flex items-center transition-all ${isCollapsed ? "justify-center flex-col gap-2.5" : "justify-between"
            }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#4B5125]" />
            {!isCollapsed && (
              <span className="font-mono text-[11px] font-bold uppercase tracking-[.18em] text-[#4B5125] whitespace-nowrap">
                SYSTEM SECURE
              </span>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle Button beside SYSTEM SECURE */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden md:grid h-7 w-7 place-items-center rounded-xs text-[#727270] hover:bg-[#4B5125]/10 hover:text-[#4B5125] transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            data-testid="button-sidebar-collapse"
          >
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-[#4B5125]/40 backdrop-blur-xs md:hidden"
          data-testid="button-close-overlay"
        />
      )}

      {/* Main Content Pane */}
      <div className={`transition-all duration-300 ${isCollapsed ? "md:pl-[72px]" : "md:pl-[260px]"}`}>
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#727270]/20 bg-[#ECE5DC]/95 px-5 backdrop-blur-sm md:px-9">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center border border-[#727270]/25 text-[#4B5125] md:hidden"
              aria-label="Open menu"
              data-testid="button-open-menu"
            >
              <Menu size={18} />
            </button>
            <span className="hidden font-mono text-[10px] uppercase tracking-[.17em] text-[#727270] md:block">
              Regional Situation Room · NARADA Operational Command
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[.14em] text-[#727270] md:hidden">
              NARADA / RISK
            </span>
          </div>
          {/* Executive User Profile & Sign Out Capsule */}
          <div className="flex items-center gap-2 rounded-xl border border-[#727270]/20 bg-[#FEFEFE] p-1.5 sm:pr-2.5 shadow-xs">
            {/* User Avatar */}
            <div
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#4B5125] font-mono text-xs font-extrabold text-[#FEFEFE] shadow-xs"
              aria-label="Admin initials"
              data-testid="text-profile-initials"
            >
              AD
            </div>

            {/* Email & Role Badge */}
            <div className="hidden flex-col sm:flex min-w-0 pr-1">
              <span className="font-mono text-xs font-bold text-[#4B5125] leading-tight truncate max-w-[140px]">
                {user?.email ?? "admin@gmail.com"}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#727270]">
                Commander
              </span>
            </div>

            {/* Subtle Divider */}
            <span className="hidden h-5 w-px bg-[#727270]/20 sm:block mx-0.5" />

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={logout}
              className="group flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#727270] hover:bg-[#b65343]/10 hover:text-[#b65343] transition-all cursor-pointer"
              title="Sign out of Narada"
              aria-label="Sign out"
              data-testid="button-logout"
            >
              <LogOut size={14} className="transition-transform group-hover:translate-x-0.5 text-[#727270] group-hover:text-[#b65343]" />
              <span className="font-mono text-[11px] font-bold tracking-wide">Sign out</span>
            </button>
          </div>
        </header>
        <main
          className={
            noScroll
              ? "mx-auto h-[calc(100vh-76px)] max-w-[1650px] overflow-hidden px-4 py-2.5 md:px-6 md:py-3 flex flex-col justify-start gap-2.5"
              : "mx-auto max-w-[1500px] px-5 py-7 md:px-9 md:py-9"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 border-b border-[#727270]/25 pb-7 lg:flex-row lg:items-end">
      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-[#b65343]">{eyebrow}</p>
        <h1 className="text-3xl font-bold tracking-[-.035em] text-[#4B5125] md:text-[40px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#727270]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusPill({ value, tone }: { value: string; tone?: "red" | "orange" | "yellow" | "green" | "ink" }) {
  const tones = {
    red: "bg-[#f3d9d3] text-[#984636]",
    orange: "bg-[#f5e0c8] text-[#a55b28]",
    yellow: "bg-[#F0F1DB] text-[#4B5125]",
    green: "bg-[#F0F1DB] text-[#4B5125]",
    ink: "bg-[#ECE5DC] text-[#727270]",
  };
  return <span className={`inline-flex items-center px-2.5 py-1 font-mono text-[10px] font-bold tracking-[.06em] ${tones[tone ?? "ink"]}`}>{value}</span>;
}

export function LoadingState({ label = "Loading data" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center border border-[#727270]/25 bg-[#FEFEFE] p-12 text-center" data-testid="state-loading">
      <div className="skeleton h-10 w-10 rounded-full" />
      <p className="mt-4 font-mono text-xs uppercase tracking-[.14em] text-[#727270]">{label}</p>
    </div>
  );
}

export function ErrorState({ onRetry, label = "Could not load data" }: { onRetry?: () => void; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center border border-[#e0b8ad] bg-[#f8e9e4] p-12 text-center text-[#984636]" data-testid="state-error">
      <p className="font-bold">{label}</p>
      <p className="mt-1 text-xs text-[#984636]/80">Please ensure the FastAPI server is running at http://localhost:8000</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-4 border border-[#984636] bg-[#984636] px-4 py-2 text-xs font-bold text-[#FEFEFE] hover:bg-[#7b3224]" data-testid="button-retry">Retry Connection</button>}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="border border-dashed border-[#727270]/40 p-12 text-center" data-testid="state-empty">
      <p className="font-mono text-xs uppercase tracking-[.12em] text-[#727270]">{title}</p>
      <p className="mt-2 text-sm text-[#727270]/80">{description}</p>
    </div>
  );
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

export function formatKey(key: string): string {
  return key.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
