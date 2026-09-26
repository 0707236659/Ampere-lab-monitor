import { Cpu, Factory, FlaskConical } from "lucide-react";
import { CheckCircle2 } from "lucide-react";

const cards = [
  {
    label: "Factories",
    icon: Factory,
    iconClass: "bg-indigo-50 text-indigo-600",
  },
  {
    label: "Labs (Total)",
    icon: FlaskConical,
    iconClass: "bg-sky-50 text-sky-600",
  },
  {
    label: "Sensor Chips (Total)",
    icon: Cpu,
    iconClass: "bg-violet-50 text-violet-600",
  },
  {
    label: "Overall Pass Rate",
    icon: CheckCircle2,
    iconClass: "bg-emerald-50 text-emerald-600",
  },
] as const;

type OverviewKpisProps = {
  factories: number;
  labsTotal: number;
  sensorChipsTotal: number;
  overallPassRate: number;
};

export function OverviewKpis({
  factories,
  labsTotal,
  sensorChipsTotal,
  overallPassRate,
}: OverviewKpisProps) {
  const values = [
    String(factories),
    labsTotal.toLocaleString(),
    sensorChipsTotal.toLocaleString(),
    `${overallPassRate.toFixed(1)}%`,
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
          >
            <span
              className={`flex size-11 items-center justify-center rounded-xl ${card.iconClass}`}
            >
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-slate-800">
                {values[index]}
              </p>
              <p className="text-sm text-slate-400">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
