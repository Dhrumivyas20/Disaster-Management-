import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

export default function NotFound() {
  return <DashboardShell><div className="mx-auto max-w-lg py-20 text-center"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#b65343]">404 / outside the desk</p><h1 className="mt-4 text-5xl font-bold tracking-[-.05em]">No record here.</h1><p className="mt-4 text-sm leading-6 text-[#60717c]">The page you requested is not part of this regional situation room.</p><Link href="/" className="mt-7 inline-flex items-center gap-2 border border-[#263440] px-4 py-3 text-sm font-bold hover:bg-[#263440] hover:text-[#f2eee4]" data-testid="link-return-overview"><ArrowLeft size={15} />Return to overview</Link></div></DashboardShell>;
}
