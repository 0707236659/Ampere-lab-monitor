"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Download,
  Droplets,
  MoreHorizontal,
  Search,
  Thermometer,
} from "lucide-react";
import { PassRateChart } from "@/components/dashboard/pass-rate-chart";
import { PageToolbar, RegisterRefresh } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import chipsJson from "@/data/chips.json";
import factoryPayload from "@/data/factories.json";
import { useFakeFetch } from "@/hooks/use-fake-fetch";
import { exportChipsToExcel } from "@/lib/export-excel";
import { chipStatusClass, factoryStatusClass } from "@/lib/status-styles";
import type { Chip, ChipStatus, ChipType, Factory } from "@/types/dashboard";
import { toast } from "sonner";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

type DetailFilters = {
  search: string;
  status: "All" | ChipStatus;
  type: "All" | ChipType;
  temperature: "all" | "low" | "mid" | "high";
  humidity: "all" | "low" | "mid" | "high";
  sort: "name" | "temperature" | "humidity" | "updated";
};

const VALID_STATUSES = new Set(["All", "Pass", "Fail", "Error"]);
const VALID_TYPES = new Set([
  "All",
  "Temperature Sensor",
  "Pressure Sensor",
  "Humidity Sensor",
  "Light Sensor",
]);
const VALID_TEMP_HUMIDITY = new Set(["all", "low", "mid", "high"]);
const VALID_SORTS = new Set(["name", "temperature", "humidity", "updated"]);

function parseFiltersFromParams(sp: URLSearchParams): DetailFilters {
  const status = sp.get("status") ?? "";
  const type = sp.get("type") ?? "";
  const temperature = sp.get("temperature") ?? "";
  const humidity = sp.get("humidity") ?? "";
  const sort = sp.get("sort") ?? "";
  return {
    search: sp.get("search") ?? "",
    status: VALID_STATUSES.has(status) ? (status as DetailFilters["status"]) : "All",
    type: VALID_TYPES.has(type) ? (type as DetailFilters["type"]) : "All",
    temperature: VALID_TEMP_HUMIDITY.has(temperature)
      ? (temperature as DetailFilters["temperature"])
      : "all",
    humidity: VALID_TEMP_HUMIDITY.has(humidity)
      ? (humidity as DetailFilters["humidity"])
      : "all",
    sort: VALID_SORTS.has(sort) ? (sort as DetailFilters["sort"]) : "name",
  };
}

function filtersToParams(filters: DetailFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.search) sp.set("search", filters.search);
  if (filters.status !== "All") sp.set("status", filters.status);
  if (filters.type !== "All") sp.set("type", filters.type);
  if (filters.temperature !== "all") sp.set("temperature", filters.temperature);
  if (filters.humidity !== "all") sp.set("humidity", filters.humidity);
  if (filters.sort !== "name") sp.set("sort", filters.sort);
  return sp;
}

const defaultFilters: DetailFilters = {
  search: "",
  status: "All",
  type: "All",
  temperature: "all",
  humidity: "all",
  sort: "name",
};

// ── Labeled select wrapper ────────────────────────────────────────────────────
function LabeledSelect({
  label,
  value,
  valueLabel,
  onValueChange,
  children,
}: {
  label: string;
  value: string;
  /** Display text for the currently selected value — matches the option list label. */
  valueLabel: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
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

const STATUS_LABELS: Record<string, string> = {
  All: "All Statuses",
  Pass: "Pass",
  Fail: "Fail",
  Error: "Error",
};

const TYPE_LABELS: Record<string, string> = {
  All: "All Types",
  "Temperature Sensor": "Temperature Sensor",
  "Pressure Sensor": "Pressure Sensor",
  "Humidity Sensor": "Humidity Sensor",
  "Light Sensor": "Light Sensor",
};

const TEMP_LABELS: Record<string, string> = {
  all: "All Ranges",
  low: "Below 34°C",
  mid: "34°C – 40°C",
  high: "Above 40°C",
};

const HUMIDITY_LABELS: Record<string, string> = {
  all: "All Ranges",
  low: "Below 42%",
  mid: "42% – 55%",
  high: "Above 55%",
};

const SORT_LABELS: Record<string, string> = {
  name: "Name (A → Z)",
  temperature: "Temperature",
  humidity: "Humidity",
  updated: "Last Updated",
};

// ── Main page ─────────────────────────────────────────────────────────────────
export function FactoryDetailPage({ factoryId }: { factoryId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const payload = useMemo(
    () => ({
      factory: factoryPayload.factories.find((item) => item.id === factoryId) as
        | Factory
        | undefined,
      chips: (chipsJson as Chip[]).filter((chip) => chip.factoryId === factoryId),
    }),
    [factoryId],
  );

  const [filters, setFilters] = useState<DetailFilters>(() =>
    parseFiltersFromParams(searchParams),
  );

  const { data, loading, refetch } = useFakeFetch(payload, 2000);
  const [page, setPage] = useState(1);

  // When the URL changes externally (e.g. back/forward or chart segment click),
  // re-sync the filter state to match the URL params.
  useEffect(() => {
    setFilters(parseFiltersFromParams(searchParams));
    setPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const rows = data.chips.filter((chip) => {
      const query = filters.search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        chip.name.toLowerCase().includes(query) ||
        chip.type.toLowerCase().includes(query) ||
        chip.serialNumber.toLowerCase().includes(query);
      const matchesStatus =
        filters.status === "All" || chip.status === filters.status;
      const matchesType = filters.type === "All" || chip.type === filters.type;
      const matchesTemp = inRange(chip.temperature, filters.temperature, 34, 40);
      const matchesHumidity = inRange(chip.humidity, filters.humidity, 42, 55);
      return matchesSearch && matchesStatus && matchesType && matchesTemp && matchesHumidity;
    });

    rows.sort((a, b) => {
      if (filters.sort === "temperature") return a.temperature - b.temperature;
      if (filters.sort === "humidity") return a.humidity - b.humidity;
      if (filters.sort === "updated") return b.lastUpdated.localeCompare(a.lastUpdated);
      return a.name.localeCompare(b.name);
    });

    return rows;
  }, [data, filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const factory = data?.factory;

  function updateFilter<K extends keyof DetailFilters>(key: K, value: DetailFilters[K]) {
    setPage(1);
    setFilters((c) => {
      const next = { ...c, [key]: value };
      const sp = filtersToParams(next);
      const query = sp.toString();
      router.replace(query ? `?${query}` : "?", { scroll: false });
      return next;
    });
  }

  if (!loading && !factory) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center">
        <p className="font-medium">Factory not found.</p>
        <Link href="/" className="mt-3 inline-block text-sm text-indigo-600">
          Back to Factories
        </Link>
      </div>
    );
  }

  return (
    <div>
      <RegisterRefresh refetch={refetch} />
      <PageToolbar />
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" />
        Back to Factories
      </Link>

      {loading || !factory ? (
        <DetailSkeleton />
      ) : (
        <>
          {/* ── Page title ── */}
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {factory.name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${factoryStatusClass[factory.status]}`}
            >
              {factory.status}
            </span>
          </div>
          <p className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>{factory.labs} labs</span>
            <span className="text-slate-300">·</span>
            <span>{factory.totalChips.toLocaleString()} chips</span>
            <span className="text-emerald-600">{factory.pass.toLocaleString()} pass</span>
            <span className="text-amber-600">{factory.fail.toLocaleString()} fail</span>
            <span className="text-red-500">{factory.error.toLocaleString()} error</span>
          </p>

          {/* ── Stat cards ── */}
          <div className="mb-6 grid gap-4 lg:grid-cols-4">
            <StatCard>
              <div className="flex items-center gap-4">
                <PassRateChart
                  passRate={factory.passRate}
                  pass={factory.pass}
                  fail={factory.fail}
                  error={factory.error}
                  size={108}
                  chartType="doughnut"
                />
                <ul className="flex-1 min-w-0 space-y-1.5 text-sm text-slate-600">
                  <Legend color="bg-emerald-500" label="Pass" value={factory.pass} />
                  <Legend color="bg-amber-500" label="Fail" value={factory.fail} />
                  <Legend color="bg-red-500" label="Error" value={factory.error} />
                </ul>
              </div>
            </StatCard>
            <StatCard>
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Thermometer className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-slate-400">Avg. Temperature</p>
                  <p className="text-2xl font-semibold">{factory.avgTemperature.toFixed(1)}°C</p>
                  <p className="text-xs text-slate-400">
                    Range: {factory.temperatureRange[0].toFixed(1)}°C –{" "}
                    {factory.temperatureRange[1].toFixed(1)}°C
                  </p>
                </div>
              </div>
            </StatCard>
            <StatCard>
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
                  <Droplets className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-slate-400">Avg. Humidity</p>
                  <p className="text-2xl font-semibold">{factory.avgHumidity.toFixed(1)}%</p>
                  <p className="text-xs text-slate-400">
                    Range: {factory.humidityRange[0].toFixed(1)}% –{" "}
                    {factory.humidityRange[1].toFixed(1)}%
                  </p>
                </div>
              </div>
            </StatCard>
            <StatCard>
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                  <Cpu className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-slate-400">Total Sensor Chips</p>
                  <p className="text-2xl font-semibold">{factory.totalChips.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">
                    {factory.pass.toLocaleString()} Pass ·{" "}
                    {(factory.fail + factory.error).toLocaleString()} Fail/Error
                  </p>
                </div>
              </div>
            </StatCard>
          </div>

          {/* ── Chip table ── */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">

            {/* Filter bar */}
            <div className="border-b border-slate-100 p-4">
              <div className="flex flex-wrap items-end gap-3">
                {/* Search */}
                <div className="flex flex-col gap-1 min-w-56 flex-1">
                  <span className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Search
                  </span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={filters.search}
                      onChange={(e) => updateFilter("search", e.target.value)}
                      placeholder="Chip name, type, serial number…"
                      className="h-9 border-slate-200 bg-slate-50 pl-9 pr-3"
                    />
                  </div>
                </div>

                {/* All selects share w-44 so they're uniform and sized to the longest item */}
                <div className="w-44">
                  <LabeledSelect
                    label="Status"
                    value={filters.status}
                    valueLabel={STATUS_LABELS[filters.status]}
                    onValueChange={(v) => updateFilter("status", v as DetailFilters["status"])}
                  >
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Pass">Pass</SelectItem>
                    <SelectItem value="Fail">Fail</SelectItem>
                    <SelectItem value="Error">Error</SelectItem>
                  </LabeledSelect>
                </div>

                <div className="w-44">
                  <LabeledSelect
                    label="Chip Type"
                    value={filters.type}
                    valueLabel={TYPE_LABELS[filters.type]}
                    onValueChange={(v) => updateFilter("type", v as DetailFilters["type"])}
                  >
                    <SelectItem value="All">All Types</SelectItem>
                    <SelectItem value="Temperature Sensor">Temperature Sensor</SelectItem>
                    <SelectItem value="Pressure Sensor">Pressure Sensor</SelectItem>
                    <SelectItem value="Humidity Sensor">Humidity Sensor</SelectItem>
                    <SelectItem value="Light Sensor">Light Sensor</SelectItem>
                  </LabeledSelect>
                </div>

                <div className="w-44">
                  <LabeledSelect
                    label="Temperature"
                    value={filters.temperature}
                    valueLabel={TEMP_LABELS[filters.temperature]}
                    onValueChange={(v) =>
                      updateFilter("temperature", v as DetailFilters["temperature"])
                    }
                  >
                    <SelectItem value="all">All Ranges</SelectItem>
                    <SelectItem value="low">Below 34°C</SelectItem>
                    <SelectItem value="mid">34°C – 40°C</SelectItem>
                    <SelectItem value="high">Above 40°C</SelectItem>
                  </LabeledSelect>
                </div>

                <div className="w-44">
                  <LabeledSelect
                    label="Humidity"
                    value={filters.humidity}
                    valueLabel={HUMIDITY_LABELS[filters.humidity]}
                    onValueChange={(v) =>
                      updateFilter("humidity", v as DetailFilters["humidity"])
                    }
                  >
                    <SelectItem value="all">All Ranges</SelectItem>
                    <SelectItem value="low">Below 42%</SelectItem>
                    <SelectItem value="mid">42% – 55%</SelectItem>
                    <SelectItem value="high">Above 55%</SelectItem>
                  </LabeledSelect>
                </div>

                <div className="w-44">
                  <LabeledSelect
                    label="Sort by"
                    value={filters.sort}
                    valueLabel={SORT_LABELS[filters.sort]}
                    onValueChange={(v) => updateFilter("sort", v as DetailFilters["sort"])}
                  >
                    <SelectItem value="name">Name (A → Z)</SelectItem>
                    <SelectItem value="temperature">Temperature</SelectItem>
                    <SelectItem value="humidity">Humidity</SelectItem>
                    <SelectItem value="updated">Last Updated</SelectItem>
                  </LabeledSelect>
                </div>

                {/* Export button + selection count */}
                <div className="flex flex-col gap-1">
                  <span className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {(() => {
                      const visibleSelected = filtered.filter((c) =>
                        selected.includes(c.id),
                      ).length;
                      return visibleSelected > 0 && visibleSelected < filtered.length
                        ? `${visibleSelected} selected`
                        : "\u00a0";
                    })()}
                  </span>
                  <Button
                    variant="outline"
                    className="h-9 border-slate-200 bg-slate-50"
                    disabled={filtered.length === 0}
                    onClick={() => {
                      if (!factory) return;
                      const visibleSelected = filtered.filter((c) =>
                        selected.includes(c.id),
                      );
                      const exportRows =
                        visibleSelected.length > 0 &&
                        visibleSelected.length < filtered.length
                          ? visibleSelected
                          : filtered;
                      exportChipsToExcel(exportRows, `${factory.name}-chips`);
                      toast.success(`Exported ${exportRows.length} rows`);
                    }}
                  >
                    <Download className="size-4" />
                    Export
                  </Button>
                </div>
              </div>
            </div>

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        pageRows.length > 0 &&
                        pageRows.every((row) => selected.includes(row.id))
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelected((c) => [
                            ...new Set([...c, ...pageRows.map((r) => r.id)]),
                          ]);
                        } else {
                          setSelected((c) =>
                            c.filter((id) => !pageRows.some((r) => r.id === id)),
                          );
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="w-32 whitespace-nowrap font-semibold text-indigo-600">
                    Chip Name
                  </TableHead>
                  <TableHead className="w-40 whitespace-nowrap font-semibold text-violet-600">
                    Type
                  </TableHead>
                  <TableHead className="w-24 whitespace-nowrap font-semibold text-slate-500">
                    Status
                  </TableHead>
                  <TableHead className="w-36 whitespace-nowrap font-semibold text-orange-500">
                    Temperature (°C)
                  </TableHead>
                  <TableHead className="w-32 whitespace-nowrap font-semibold text-sky-500">
                    Humidity (%)
                  </TableHead>
                  <TableHead className="w-36 whitespace-nowrap font-semibold text-teal-600">
                    Serial Number
                  </TableHead>
                  <TableHead className="w-44 whitespace-nowrap font-semibold text-slate-400">
                    Last Updated
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-12 text-center text-sm text-slate-400"
                    >
                      No chips match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((chip) => (
                    <TableRow key={chip.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(chip.id)}
                          onCheckedChange={(checked) =>
                            setSelected((c) =>
                              checked
                                ? [...c, chip.id]
                                : c.filter((id) => id !== chip.id),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{chip.name}</TableCell>
                      <TableCell>{chip.type}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${chipStatusClass[chip.status]}`}
                        >
                          {chip.status}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {chip.temperature.toFixed(1)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {chip.humidity.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-slate-500">{chip.serialNumber}</TableCell>
                      <TableCell className="text-slate-500">{chip.lastUpdated}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Row actions"
                              />
                            }
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View details</DropdownMenuItem>
                            <DropdownMenuItem>Retest</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
              {/* Left: summary + page-size */}
              <div className="flex items-center gap-4">
                <span>
                  Showing{" "}
                  <span className="font-medium text-slate-700">
                    {filtered.length === 0
                      ? 0
                      : (currentPage - 1) * pageSize + 1}
                    –{Math.min(currentPage * pageSize, filtered.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-700">
                    {filtered.length}
                  </span>{" "}
                  chips
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
          </div>
        </>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function inRange(
  value: number,
  bucket: "all" | "low" | "mid" | "high",
  lowMax: number,
  highMin: number,
) {
  if (bucket === "all") return true;
  if (bucket === "low") return value < lowMax;
  if (bucket === "high") return value > highMin;
  return value >= lowMax && value <= highMin;
}

function buildPageNumbers(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: Array<number | "…"> = [];
  const addEllipsis = () => {
    if (pages[pages.length - 1] !== "…") pages.push("…");
  };
  pages.push(1);
  if (current > 3) addEllipsis();
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) addEllipsis();
  pages.push(total);
  return pages;
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function StatCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <li className="flex w-full items-center gap-2">
      <span className={`size-2 shrink-0 rounded-full ${color}`} />
      {label}
      <span className="ml-auto font-medium tabular-nums text-slate-800">
        {value.toLocaleString()}
      </span>
    </li>
  );
}

// ── Detail Skeleton ───────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-72" />

      {/* Stat cards */}
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <Skeleton className="size-[108px] shrink-0 rounded-full" />
            <div className="flex-1 min-w-0 space-y-2.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
            </div>
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Filter bar skeleton */}
        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-[52px] min-w-56 flex-1" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[52px] w-36" />
            ))}
            <Skeleton className="h-[52px] w-24" />
          </div>
        </div>
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-4" />
            {["w-32", "w-28", "w-16", "w-28", "w-24", "w-32", "w-28"].map((w, i) => (
              <Skeleton key={i} className={`h-4 ${w}`} />
            ))}
          </div>
        </div>
        {/* Rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-b border-slate-50 px-4 py-3.5 last:border-0"
          >
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
