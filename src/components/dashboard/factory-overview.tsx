"use client";

import { useMemo, useState } from "react";
import { BarChart2, ChevronLeft, ChevronRight, PieChart, Search } from "lucide-react";
import { FactoryCard } from "@/components/dashboard/factory-card";
import { OverviewKpis } from "@/components/dashboard/overview-kpis";
import { PageToolbar, RegisterRefresh } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import factoryPayload from "@/data/factories.json";
import { useFakeFetch } from "@/hooks/use-fake-fetch";
import type { Factory, FactoryStatus } from "@/types/dashboard";

const statusOptions: Array<"All" | FactoryStatus> = [
  "All",
  "Healthy",
  "Attention",
  "Critical",
];

const SORT_LABELS: Record<string, string> = {
  status: "Overall Status",
  passRate: "Pass Rate",
  name: "Name (A → Z)",
};

const STATUS_LABELS: Record<string, string> = {
  All: "All Statuses",
  Healthy: "Healthy",
  Attention: "Attention",
  Critical: "Critical",
};

const PAGE_SIZE_OPTIONS = [8, 16, 24, 50] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

type DraftFilters = {
  search: string;
  sort: "status" | "passRate" | "name";
  status: "All" | FactoryStatus;
  factoryId: string;
};

const defaultFilters: DraftFilters = {
  search: "",
  sort: "name",
  status: "All",
  factoryId: "all",
};

// ── Labeled filter wrapper ────────────────────────────────────────────────────
function LabeledSelect({
  label,
  value,
  valueLabel,
  onValueChange,
  children,
}: {
  label: string;
  value: string;
  /** Display text matching the option list label for the selected value. */
  valueLabel: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-44 flex-col gap-1">
      <span className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <Select value={value} onValueChange={(v) => v != null && onValueChange(v)}>
        <SelectTrigger className="h-9 w-full border-slate-200 bg-slate-50">
          <SelectValue>{valueLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>{children}</SelectContent>
      </Select>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function FactoryOverviewPage() {
  const { data, loading, refetch } = useFakeFetch(factoryPayload);
  const [draft, setDraft] = useState<DraftFilters>(defaultFilters);
  const [applied, setApplied] = useState<DraftFilters>(defaultFilters);
  const [chartType, setChartType] = useState<"doughnut" | "bar">("doughnut");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(8);

  const factories = (data?.factories ?? []) as Factory[];

  const filtered = useMemo(() => {
    let list = factories.filter((f) => {
      const matchesSearch = f.name
        .toLowerCase()
        .includes(applied.search.trim().toLowerCase());
      const matchesStatus =
        applied.status === "All" || f.status === applied.status;
      const matchesFactory =
        applied.factoryId === "all" || f.id === applied.factoryId;
      return matchesSearch && matchesStatus && matchesFactory;
    });

    list = [...list].sort((a, b) => {
      if (applied.sort === "passRate") return b.passRate - a.passRate;
      if (applied.sort === "name")
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
      const order = { Critical: 0, Attention: 1, Healthy: 2 };
      return order[a.status] - order[b.status];
    });

    return list;
  }, [applied, factories]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Reset to page 1 when filters change
  function applyFilters() {
    setPage(1);
    setApplied(draft);
  }

  function resetFilters() {
    setPage(1);
    setDraft(defaultFilters);
    setApplied(defaultFilters);
  }

  return (
    <div>
      <RegisterRefresh refetch={refetch} />
      <PageToolbar />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Factory Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor the status of 50 factories, 100 labs per factory, and sensor
          chip test results in real-time.
        </p>
      </div>

      {/* ── Filter toolbar ── */}
      <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          {/* Search — no label above, just a full-width search box */}
          <div className="flex flex-col gap-1 min-w-56 flex-1">
            <span className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Search
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={draft.search}
                onChange={(e) =>
                  setDraft((c) => ({ ...c, search: e.target.value }))
                }
                placeholder="Search factory name…"
                className="h-9 border-slate-200 bg-slate-50 pl-9 pr-3"
              />
            </div>
          </div>

          <LabeledSelect
            label="Sort by"
            value={draft.sort}
            valueLabel={SORT_LABELS[draft.sort]}
            onValueChange={(v) =>
              setDraft((c) => ({ ...c, sort: v as DraftFilters["sort"] }))
            }
          >
            <SelectItem value="status">Overall Status</SelectItem>
            <SelectItem value="passRate">Pass Rate</SelectItem>
            <SelectItem value="name">Name (A → Z)</SelectItem>
          </LabeledSelect>

          <LabeledSelect
            label="Status"
            value={draft.status}
            valueLabel={STATUS_LABELS[draft.status] ?? draft.status}
            onValueChange={(v) =>
              setDraft((c) => ({ ...c, status: v as DraftFilters["status"] }))
            }
          >
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "All" ? "All Statuses" : s}
              </SelectItem>
            ))}
          </LabeledSelect>

          <LabeledSelect
            label="Factory"
            value={draft.factoryId}
            valueLabel={
              draft.factoryId === "all"
                ? "All Factories"
                : (factoryPayload.factories.find((f) => f.id === draft.factoryId)?.name ??
                  "All Factories")
            }
            onValueChange={(v) =>
              setDraft((c) => ({ ...c, factoryId: String(v) }))
            }
          >
            <SelectItem value="all">All Factories</SelectItem>
            {factoryPayload.factories.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </LabeledSelect>

          {/* Chart toggle */}
          <div className="flex flex-col gap-1">
            <span className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Chart
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-slate-200 bg-slate-50"
              onClick={() =>
                setChartType((ct) => (ct === "doughnut" ? "bar" : "doughnut"))
              }
              aria-label={`Switch to ${chartType === "doughnut" ? "bar" : "doughnut"} chart`}
              title={`Switch to ${chartType === "doughnut" ? "bar" : "doughnut"} chart`}
            >
              {chartType === "doughnut" ? (
                <BarChart2 className="size-4" />
              ) : (
                <PieChart className="size-4" />
              )}
            </Button>
          </div>

          {/* Action buttons aligned to bottom */}
          <div className="flex flex-col gap-1">
            <span className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-transparent select-none">
              Actions
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
              <Button
                className="bg-indigo-600 text-white hover:bg-indigo-500"
                onClick={applyFilters}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading || !data ? (
        <OverviewSkeleton />
      ) : (
        <>
          <OverviewKpis
            factories={data.kpis.factories}
            labsTotal={data.kpis.labsTotal}
            sensorChipsTotal={data.kpis.sensorChipsTotal}
            overallPassRate={data.kpis.overallPassRate}
          />

          {/* ── Cards grid ── */}
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pageItems.map((factory) => (
              <FactoryCard
                key={factory.id}
                factory={factory}
                chartType={chartType}
              />
            ))}
          </div>

          {/* ── Pagination bar ── */}
          {filtered.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-3 shadow-sm">
              {/* Left: summary + page-size select */}
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>
                  Showing{" "}
                  <span className="font-medium text-slate-700">
                    {(currentPage - 1) * pageSize + 1}–
                    {Math.min(currentPage * pageSize, filtered.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-700">
                    {filtered.length}
                  </span>{" "}
                  factories
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Per page</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v) as PageSize);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-20 border-slate-200 bg-slate-50 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right: page buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </Button>

                {/* Show at most 7 page buttons with ellipsis */}
                {buildPageNumbers(currentPage, pageCount).map((item, idx) =>
                  item === "…" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-slate-400 select-none"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={currentPage === item ? "default" : "ghost"}
                      size="icon-sm"
                      className={
                        currentPage === item
                          ? "bg-indigo-600 text-white hover:bg-indigo-500"
                          : ""
                      }
                      onClick={() => setPage(item as number)}
                    >
                      {item}
                    </Button>
                  ),
                )}

                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns an array of page numbers and "…" ellipsis strings. */
function buildPageNumbers(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: Array<number | "…"> = [];
  const addPage = (n: number) => pages.push(n);
  const addEllipsis = () => {
    if (pages[pages.length - 1] !== "…") pages.push("…");
  };

  addPage(1);
  if (current > 3) addEllipsis();
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    addPage(i);
  }
  if (current < total - 2) addEllipsis();
  addPage(total);

  return pages;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
          >
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Factory card skeletons */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="size-[108px] shrink-0 rounded-full" />
              <div className="flex-1 min-w-0 space-y-2.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-full" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
              {Array.from({ length: 3 }).map((__, j) => (
                <div key={j} className="space-y-1.5 text-center">
                  <Skeleton className="mx-auto h-3 w-12" />
                  <Skeleton className="mx-auto h-5 w-6" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
