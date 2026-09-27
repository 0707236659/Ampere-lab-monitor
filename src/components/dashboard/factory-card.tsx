"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Factory } from "lucide-react";
import { PassRateChart } from "@/components/dashboard/pass-rate-chart";
import { factoryStatusClass } from "@/lib/status-styles";
import type { Factory as FactoryType } from "@/types/dashboard";

const SEGMENT_STATUSES = ["Pass", "Fail", "Error"] as const;

type FactoryCardProps = {
  factory: FactoryType;
  chartType: "doughnut" | "bar";
};

export function FactoryCard({ factory, chartType }: FactoryCardProps) {
  const router = useRouter();
  const detailHref = `/factories/${factory.id}`;

  function handleSegmentClick(segmentIndex: number) {
    const status = SEGMENT_STATUSES[segmentIndex];
    if (status) {
      router.push(`${detailHref}?status=${status}`);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* ── Clickable header / footer (navigates to detail) ── */}
      <Link href={detailHref} className="block p-5 pb-0">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Factory className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-800">{factory.name}</p>
              <p className="truncate text-xs text-slate-400">
                {factory.labs} labs · {factory.totalChips.toLocaleString()} chips
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${factoryStatusClass[factory.status]}`}
          >
            {factory.status}
          </span>
        </div>
      </Link>

      {/* ── Chart area — separate from the Link to avoid nested <a> ── */}
      <div className="px-5">
        {chartType === "doughnut" ? (
          <div className="flex items-center gap-3">
            {/* Donut — fixed 112px so the arc and center label always fit */}
            <div className="relative shrink-0" style={{ width: 112, height: 112 }}>
              <PassRateChart
                passRate={factory.passRate}
                pass={factory.pass}
                fail={factory.fail}
                error={factory.error}
                chartType="doughnut"
                onSegmentClick={handleSegmentClick}
              />
            </div>
            {/* Legend items — each navigates with the corresponding status filter */}
            <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
              {(
                [
                  { label: "Pass", color: "bg-emerald-500", count: factory.pass, status: "Pass" },
                  { label: "Fail", color: "bg-amber-500", count: factory.fail, status: "Fail" },
                  { label: "Error", color: "bg-red-500", count: factory.error, status: "Error" },
                ] as const
              ).map(({ label, color, count, status }) => (
                <li key={label}>
                  <Link
                    href={`${detailHref}?status=${status}`}
                    className="flex w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-slate-600 transition hover:bg-slate-50"
                  >
                    <span className={`size-2 shrink-0 rounded-full ${color}`} />
                    <span className="truncate">{label}</span>
                    <span className="ml-auto shrink-0 font-medium tabular-nums text-slate-800">
                      {count.toLocaleString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          // Bar chart — click navigates to detail without a status filter
          <div
            className="h-[108px] w-full cursor-pointer"
            onClick={() => router.push(detailHref)}
          >
            <PassRateChart
              passRate={factory.passRate}
              pass={factory.pass}
              fail={factory.fail}
              error={factory.error}
              chartType="bar"
            />
          </div>
        )}
      </div>

      {/* ── Footer (navigates to detail) ── */}
      <Link href={detailHref} className="block p-5 pt-4">
        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
          <div>
            <p className="text-[11px] text-emerald-600">Labs OK</p>
            <p className="text-lg font-semibold text-slate-800">{factory.labsOk}</p>
          </div>
          <div>
            <p className="text-[11px] text-amber-600">Labs Warning</p>
            <p className="text-lg font-semibold text-slate-800">{factory.labsWarning}</p>
          </div>
          <div>
            <p className="text-[11px] text-red-500">Labs Error</p>
            <p className="text-lg font-semibold text-slate-800">{factory.labsError}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}
