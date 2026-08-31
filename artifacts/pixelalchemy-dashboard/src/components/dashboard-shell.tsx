import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, BarChart3, Building2, ChevronRight, FileText, GitCompareArrows, Layers3, ListOrdered, MapPinned, Menu, Mountain, UsersRound, X } from "lucide-react";

const navItems = [
  { href: "/", label: "Risk overview", icon: Activity },
  { href: "/risk-map", label: "Risk map", icon: MapPinned },
  { href: "/villages", label: "Village priorities", icon: Mountain },
  { href: "/hazard-analysis", label: "Hazard analysis", icon: BarChart3 },
  { href: "/population-risk", label: "Population risk", icon: UsersRound },
  { href: "/relocation-priority", label: "Relocation priority", icon: ListOrdered },
  { href: "/safe-sites", label: "Safe sites", icon: Layers3 },
  { href: "/site-comparison", label: "Site comparison", icon: GitCompareArrows },
  { href: "/facilities", label: "Critical facilities", icon: Building2 },
  { href: "/reports", label: "Reports", icon: FileText },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="desk-grain min-h-[100dvh] bg-[#f2eee4] text-[#263440]">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col bg-[#263440] text-[#f2eee4] transition-transform duration-300 md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[86px] items-center justify-between border-b border-[#53616a] px-7">
          <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
            <span className="grid h-10 w-10 place-items-center border border-[#e8b84c] bg-[#e8b84c] text-[#263440]">
              <span className="font-mono text-lg font-bold">PA</span>
            </span>
            <span>
              <span className="block text-[15px] font-bold tracking-[.18em]">PIXEL</span>
              <span className="block text-[10px] tracking-[.25em] text-[#c4c9c3]">ALCHEMY / RISK</span>
            </span>
          </Link>
          <button type="button" onClick={() => setMobileOpen(false)} className="md:hidden" aria-label="Close menu" data-testid="button-close-menu"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 pt-8">
          <p className="mb-3 px-2 font-mono text-[10px] uppercase tracking-[.18em] text-[#aeb8b6]">Command desk</p>
          <nav className="space-y-1" aria-label="Primary navigation">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? location === "/" : location.startsWith(href);
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 border-l-2 px-3 py-3 text-sm ${active ? "border-[#e8b84c] bg-[#35434c] text-[#f7d884]" : "border-transparent text-[#c4c9c3] hover:bg-[#2f3c45] hover:text-[#f2eee4]"}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(" ", "-")}`}>
                  <Icon size={17} strokeWidth={1.7} />
                  <span>{label}</span>
                  {active && <ChevronRight size={14} className="ml-auto text-[#e8b84c]" />}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-5">
          <div className="border border-[#53616a] bg-[#2c3a43] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[.16em] text-[#aeb8b6]">Data status</span>
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a8c09a] opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#a8c09a]" /></span>
            </div>
            <p className="text-xs text-[#f2eee4]">Regional layer connected</p>
            <p className="mt-1 font-mono text-[10px] text-[#aeb8b6]">LAST SYNC · 06:42 IST</p>
          </div>
          <p className="mt-5 px-1 font-mono text-[9px] leading-4 tracking-[.12em] text-[#7f9094]">RUDRAPRAYAG + CHAMOLI<br />UTTARAKHAND / INDIA</p>
        </div>
      </aside>
      {mobileOpen && <button type="button" aria-label="Close navigation overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-[#263440]/35 md:hidden" data-testid="button-close-overlay" />}
      <div className="md:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-[#d7d1c5] bg-[#f2eee4]/95 px-5 backdrop-blur-sm md:px-9">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center border border-[#d7d1c5] md:hidden" aria-label="Open menu" data-testid="button-open-menu"><Menu size={18} /></button>
            <span className="hidden font-mono text-[10px] uppercase tracking-[.17em] text-[#60717c] md:block">Regional situation room</span>
            <span className="font-mono text-[10px] uppercase tracking-[.14em] text-[#60717c] md:hidden">PA / RISK</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-[#60717c] sm:block">Duty officer</span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#3f7069] font-mono text-[11px] font-bold text-[#f2eee4]" aria-label="Duty officer initials" data-testid="text-profile-initials">AM</span>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-5 py-7 md:px-9 md:py-9">{children}</main>
      </div>
    </div>
  );
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 border-b border-[#d7d1c5] pb-7 lg:flex-row lg:items-end">
      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-[#b65343]">{eyebrow}</p>
        <h1 className="text-3xl font-bold tracking-[-.035em] text-[#263440] md:text-[42px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#60717c]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusPill({ value, tone }: { value: string; tone?: "red" | "orange" | "yellow" | "green" | "ink" }) {
  const tones = {
    red: "bg-[#f3d9d3] text-[#984636]",
    orange: "bg-[#f5e0c8] text-[#a55b28]",
    yellow: "bg-[#f5eac9] text-[#856d1d]",
    green: "bg-[#d7e5d4] text-[#3b6652]",
    ink: "bg-[#e0e4e1] text-[#455760]",
  };
  return <span className={`inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] uppercase tracking-[.08em] ${tones[tone ?? "ink"]}`} data-testid={`status-${value.toLowerCase().replaceAll(" ", "-")}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{value}</span>;
}

export function LoadingState({ label = "Reading regional layer" }: { label?: string }) {
  return <div className="animate-appear space-y-5" role="status" data-testid="status-loading"><div className="skeleton h-7 w-52" /><div className="skeleton h-4 w-80" /><div className="grid gap-4 md:grid-cols-4"><div className="skeleton h-32" /><div className="skeleton h-32" /><div className="skeleton h-32" /><div className="skeleton h-32" /></div><div className="skeleton h-72 w-full" /><span className="sr-only">{label}</span></div>;
}

export function ErrorState({ onRetry, label = "The regional layer could not be loaded." }: { onRetry: () => void; label?: string }) {
  return <div className="border border-[#d8aaa0] bg-[#f7e6e1] p-7" role="alert" data-testid="status-error"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#b65343]">Connection interrupted</p><h2 className="mt-2 text-xl font-bold text-[#263440]">{label}</h2><p className="mt-2 max-w-lg text-sm text-[#60717c]">Try the request again. No recommendation is shown until its source data is available.</p><button type="button" onClick={onRetry} className="mt-5 border border-[#b65343] px-4 py-2 text-sm font-semibold text-[#984636] hover:bg-[#b65343] hover:text-[#f7e6e1]" data-testid="button-retry">Retry request</button></div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="border border-dashed border-[#c8c0b2] bg-[#fbf9f3] px-6 py-14 text-center" data-testid="status-empty"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#60717c]">No records</p><h2 className="mt-2 text-lg font-bold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-[#60717c]">{description}</p></div>;
}

export function formatKey(key: string) {
  return key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatNumber(value?: number) {
  return typeof value === "number" ? new Intl.NumberFormat("en-IN").format(value) : "—";
}
