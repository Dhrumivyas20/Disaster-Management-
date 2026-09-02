import { Link } from "wouter";
import { ArrowRight, BookOpen, CheckCircle2, CircleAlert, FileCheck, Layers3, ListOrdered, Route, ShieldAlert, ShieldCheck } from "lucide-react";
import { DashboardShell, PageIntro, StatusPill } from "@/components/dashboard-shell";

export default function RelocationPolicy() {
  const priorityTiers = [
    {
      name: "Immediate Priority",
      threshold: "Score ≥ 62.0",
      tone: "red" as const,
      description: "Severe multi-hazard exposure and immediate danger to life or active ground subsidence. Triggers mandatory expedited site matching and district task-force mobilization.",
      actions: ["Immediate administrative notification", "Carrying-capacity screening within 48h", "Emergency shelter & temporary staging identification"],
    },
    {
      name: "Short-term Priority",
      threshold: "Score 42.0 – 61.9",
      tone: "orange" as const,
      description: "High hazard exposure combined with moderate-to-high community vulnerability. Scheduled for structured phased relocation within the upcoming planning cycle.",
      actions: ["Technical geotechnical re-assessment", "AHP candidate site suitability ranking", "Gram Sabha community consultation"],
    },
    {
      name: "Medium-term Priority",
      threshold: "Score 22.0 – 41.9",
      tone: "yellow" as const,
      description: "Moderate hazard exposure with stable baseline conditions. Relocation options developed as part of long-term regional disaster mitigation plans.",
      actions: ["Annual vulnerability monitoring", "Pre-screening of nearby candidate sites", "Infrastructure resilience upgrades"],
    },
    {
      name: "Monitor / Stable",
      threshold: "Score < 22.0",
      tone: "green" as const,
      description: "Low-to-moderate hazard exposure without urgent relocation indicators. Continuous sensor and field officer monitoring maintained.",
      actions: ["Routine seasonal monitoring", "Standard disaster preparedness drills", "Community early warning linkage"],
    },
  ];

  const ahpCriteria = [
    {
      name: "Hazard Zone Safety",
      weight: "30%",
      rationale: "Ensures candidate ground is verified low-hazard (Zone Green) and not susceptible to slope failure or flash flooding.",
    },
    {
      name: "Land Availability & Tenure",
      weight: "25%",
      rationale: "Evaluates unencumbered government/revenue land suitable for housing, agriculture, and municipal layout without legal disputes.",
    },
    {
      name: "Road & Transport Access",
      weight: "15%",
      rationale: "Proximity to all-weather motorable roads for emergency logistics, daily livelihood mobility, and economic connectivity.",
    },
    {
      name: "Perennial Water Source",
      weight: "15%",
      rationale: "Guaranteed access to potable drinking water and gravity-flow spring or municipal pipeline networks.",
    },
    {
      name: "Healthcare & Emergency Services",
      weight: "15%",
      rationale: "Travel distance to primary health centres (PHC), community health centres (CHC), or district hospitals.",
    },
  ];

  const capacityRules = [
    {
      status: "Ready",
      rule: "Available Capacity ≥ Source Village Demand",
      adjustment: "+0.08 AHP Score Boost",
      tone: "green" as const,
      meaning: "Candidate site can absorb the entire displaced community without exceeding ecological or infrastructural carrying capacity.",
    },
    {
      status: "Limited",
      rule: "Available Capacity > 35% of Demand",
      adjustment: "0.00 Neutral Adjustment",
      tone: "yellow" as const,
      meaning: "Candidate site can accommodate partial displacement or require joint pairing with a secondary safe site.",
    },
    {
      status: "Insufficient",
      rule: "Available Capacity ≤ 35% of Demand",
      adjustment: "-0.12 AHP Penalty",
      tone: "red" as const,
      meaning: "Candidate site does not possess adequate carrying capacity for the displaced population.",
    },
  ];

  return (
    <DashboardShell>
      <PageIntro
        eyebrow="Governance & Standards · Uttarakhand SDRF / NDMA Alignment"
        title="Relocation Policy & Framework"
        description="Formal decision framework governing hazard score thresholds, AHP suitability evaluation, carrying-capacity constraints, and community rehabilitation protocols."
        action={<StatusPill value="Active Framework · 2024-2026" tone="green" />}
      />

      {/* Section 1: Relocation Urgency Tiers */}
      <section className="mb-6 border border-[#d7d1c5] bg-[#fbf9f3] p-6">
        <div className="flex items-center gap-3 border-b border-[#e3ded4] pb-4">
          <ListOrdered size={20} className="text-[#b65343]" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#60717c]">Framework Standard 01</p>
            <h2 className="text-xl font-bold text-[#263440]">Relocation Urgency Priority Tiers</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {priorityTiers.map((tier) => (
            <div key={tier.name} className="border border-[#d7d1c5] bg-[#f7f3ea] p-4.5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#263440]">{tier.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#60717c]">{tier.threshold}</span>
                  <StatusPill value={tier.name.split(" ")[0]} tone={tier.tone} />
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#60717c]">{tier.description}</p>
              <div className="mt-3.5 border-t border-[#e3ded4] pt-3">
                <p className="font-mono text-[9px] uppercase tracking-[.1em] text-[#8a989a] font-bold">Standard Operating Protocol:</p>
                <ul className="mt-1.5 space-y-1 text-xs text-[#263440]">
                  {tier.actions.map((act, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#3f7069]">•</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: AHP Multi-Criteria Suitability Weighting */}
      <section className="mb-6 border border-[#d7d1c5] bg-[#fbf9f3] p-6">
        <div className="flex items-center gap-3 border-b border-[#e3ded4] pb-4">
          <ShieldCheck size={20} className="text-[#3f7069]" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#60717c]">Framework Standard 02</p>
            <h2 className="text-xl font-bold text-[#263440]">AHP Multi-Criteria Suitability Weights</h2>
          </div>
        </div>

        <div className="mt-5 divide-y divide-[#e3ded4]">
          {ahpCriteria.map((crit) => (
            <div key={crit.name} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-bold text-[#263440]">{crit.name}</p>
                <p className="mt-0.5 text-xs text-[#60717c]">{crit.rationale}</p>
              </div>
              <div className="shrink-0 font-mono text-lg font-bold text-[#3f7069]">
                {crit.weight}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Carrying Capacity Feasibility */}
      <section className="mb-6 border border-[#d7d1c5] bg-[#fbf9f3] p-6">
        <div className="flex items-center gap-3 border-b border-[#e3ded4] pb-4">
          <Layers3 size={20} className="text-[#e8b84c]" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#60717c]">Framework Standard 03</p>
            <h2 className="text-xl font-bold text-[#263440]">Carrying Capacity Feasibility Adjustments</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {capacityRules.map((rule) => (
            <div key={rule.status} className="border border-[#d7d1c5] bg-[#f7f3ea] p-4">
              <div className="flex items-center justify-between">
                <StatusPill value={rule.status} tone={rule.tone} />
                <span className="font-mono text-[10px] font-bold text-[#3f7069]">{rule.adjustment}</span>
              </div>
              <p className="mt-3 font-mono text-xs font-semibold text-[#263440]">{rule.rule}</p>
              <p className="mt-2 text-xs leading-5 text-[#60717c]">{rule.meaning}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Action Links */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-[#2f4a4d] bg-[#3f7069] p-6 text-[#f2eee4]">
        <div>
          <h3 className="text-lg font-bold">Apply Policy to Live Regional Queue</h3>
          <p className="mt-1 max-w-xl text-xs leading-5 text-[#d5e2dc]">
            Review all 20 pilot villages ranked strictly against these policy standards and candidate site capacity limits.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/relocation-priority"
            className="inline-flex items-center gap-2 bg-[#e8b84c] px-4 py-2.5 text-xs font-bold text-[#263440] hover:bg-[#f7d884] transition-colors"
          >
            Relocation Priority <ArrowRight size={14} />
          </Link>
          <Link
            href="/safe-sites"
            className="inline-flex items-center gap-2 border border-[#f2eee4] px-4 py-2.5 text-xs font-bold text-[#f2eee4] hover:bg-[#2f4a4d] transition-colors"
          >
            Candidate Sites <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </DashboardShell>
  );
}
