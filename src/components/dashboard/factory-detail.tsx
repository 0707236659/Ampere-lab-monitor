"use client";

import { useMemo, useState } from "react";
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
import { PassRateDonut } from "@/components/dashboard/pass-rate-donut";
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
import { chipStatusClass, factoryStatusClass } from "@/lib/status-styles";
import type { Chip, ChipStatus, ChipType, Factory } from "@/types/dashboard";
import { toast } from "sonner";

const PAGE_SIZE = 10;

type DetailFilters = {
  search: string;
  status: "All" | ChipStatus;
  type: "All" | ChipType;
  temperature: "all" | "low" | "mid" | "high";
  humidity: "all" | "low" | "mid" | "high";
  sort: "name" | "temperature" | "humidity" | "updated";
};

const defaultFilters: DetailFilters = {
  search: "",
  status: "All",
  type: "All",
  temperature: "all",
  humidity: "all",
  sort: "name",
};

export function FactoryDetailPage({ factoryId }: { factoryId: string }) {
  const payload = useMemo(
    () => ({
      factory: factoryPayload.factories.find((item) => item.id === factoryId) as
        | Factory
        | undefined,
      chips: (chipsJson as Chip[]).filter((chip) => chip.factoryId === factoryId),
    }),
    [factoryId],
  );

  const { data, loading, refetch } = useFakeFetch(payload, 900);
  const [filters, setFilters] = useState<DetailFilters>(defaultFilters);
  const [page, setPage] = useState(1);
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
      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesTemp &&
        matchesHumidity
      );
    });

    rows.sort((a, b) => {
      if (filters.sort === "temperature") return a.temperature - b.temperature;
      if (filters.sort === "humidity") return a.humidity - b.humidity;
      if (filters.sort === "updated") return b.lastUpdated.localeCompare(a.lastUpdated);
      return a.name.localeCompare(b.name);
    });

    return rows;
  }, [data, filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const factory = data?.factory;

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
            <span className="text-emerald-600">
              {factory.pass.toLocaleString()} pass
            </span>
            <span className="text-amber-600">
              {factory.fail.toLocaleString()} fail
            </span>
            <span className="text-red-500">
              {factory.error.toLocaleString()} error
            </span>
          </p>

          <div className="mb-6 grid gap-4 lg:grid-cols-4">
            <StatCard>
              <div className="flex items-center gap-4">
                <PassRateDonut
                  passRate={factory.passRate}
                  pass={factory.pass}
                  fail={factory.fail}
                  error={factory.error}
                  size={108}
                />
                <ul className="space-y-1.5 text-sm text-slate-600">
                  <Legend color="bg-emerald-500" label="Pass" value={factory.pass} />
                  <Legend color="bg-amber-500" label="Fail" value={factory.fail} />
                  <Legend color="bg-red-500" label="Error" value={factory.error} />
                </ul>
              </div>
            </StatCard>
            <StatCard>
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Thermometer className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-slate-400">Avg. Temperature</p>
                  <p className="text-2xl font-semibold">
                    {factory.avgTemperature.toFixed(1)}°C
                  </p>
                  <p className="text-xs text-slate-400">
                    Range: {factory.temperatureRange[0].toFixed(1)}°C –{" "}
                    {factory.temperatureRange[1].toFixed(1)}°C
                  </p>
                </div>
              </div>
            </StatCard>
            <StatCard>
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
                  <Droplets className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-slate-400">Avg. Humidity</p>
                  <p className="text-2xl font-semibold">
                    {factory.avgHumidity.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400">
                    Range: {factory.humidityRange[0].toFixed(1)}% –{" "}
                    {factory.humidityRange[1].toFixed(1)}%
                  </p>
                </div>
              </div>
            </StatCard>
            <StatCard>
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                  <Cpu className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-slate-400">Total Sensor Chips</p>
                  <p className="text-2xl font-semibold">
                    {factory.totalChips.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">
                    {factory.pass.toLocaleString()} Pass ·{" "}
                    {(factory.fail + factory.error).toLocaleString()} Fail/Error
                  </p>
                </div>
              </div>
            </StatCard>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-3 p-4">
              <div className="relative min-w-64 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={filters.search}
                  onChange={(event) => {
                    setPage(1);
                    setFilters((current) => ({
                      ...current,
                      search: event.target.value,
                    }));
                  }}
                  placeholder="Search by chip name, type, serial number..."
                  className="h-9 border-slate-200 bg-slate-50 pl-9"
                />
              </div>
              <FilterSelect
                value={filters.status}
                onChange={(value) => {
                  setPage(1);
                  setFilters((current) => ({
                    ...current,
                    status: value as DetailFilters["status"],
                  }));
                }}
                items={[
                  ["All", "Status: All Statuses"],
                  ["Pass", "Pass"],
                  ["Fail", "Fail"],
                  ["Error", "Error"],
                ]}
              />
              <FilterSelect
                value={filters.type}
                onChange={(value) => {
                  setPage(1);
                  setFilters((current) => ({
                    ...current,
                    type: value as DetailFilters["type"],
                  }));
                }}
                items={[
                  ["All", "Chip Type: All Types"],
                  ["Temperature Sensor", "Temperature Sensor"],
                  ["Pressure Sensor", "Pressure Sensor"],
                  ["Humidity Sensor", "Humidity Sensor"],
                  ["Light Sensor", "Light Sensor"],
                ]}
              />
              <FilterSelect
                value={filters.temperature}
                onChange={(value) => {
                  setPage(1);
                  setFilters((current) => ({
                    ...current,
                    temperature: value as DetailFilters["temperature"],
                  }));
                }}
                items={[
                  ["all", "Temperature: All Ranges"],
                  ["low", "Below 34°C"],
                  ["mid", "34°C – 40°C"],
                  ["high", "Above 40°C"],
                ]}
              />
              <FilterSelect
                value={filters.humidity}
                onChange={(value) => {
                  setPage(1);
                  setFilters((current) => ({
                    ...current,
                    humidity: value as DetailFilters["humidity"],
                  }));
                }}
                items={[
                  ["all", "Humidity: All Ranges"],
                  ["low", "Below 42%"],
                  ["mid", "42% – 55%"],
                  ["high", "Above 55%"],
                ]}
              />
              <FilterSelect
                value={filters.sort}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    sort: value as DetailFilters["sort"],
                  }))
                }
                items={[
                  ["name", "Sort by Name (A → Z)"],
                  ["temperature", "Sort by Temperature"],
                  ["humidity", "Sort by Humidity"],
                  ["updated", "Sort by Last Updated"],
                ]}
              />
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Export is not wired yet. See the README checklist.")
                }
              >
                <Download className="size-4" />
                Export
              </Button>
            </div>

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
                          setSelected((current) => [
                            ...new Set([...current, ...pageRows.map((row) => row.id)]),
                          ]);
                        } else {
                          setSelected((current) =>
                            current.filter(
                              (id) => !pageRows.some((row) => row.id === id),
                            ),
                          );
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Chip Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Temperature (°C)</TableHead>
                  <TableHead>Humidity (%)</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((chip) => (
                  <TableRow key={chip.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(chip.id)}
                        onCheckedChange={(checked) => {
                          setSelected((current) =>
                            checked
                              ? [...current, chip.id]
                              : current.filter((id) => id !== chip.id),
                          );
                        }}
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
                    <TableCell className="text-slate-500">
                      {chip.serialNumber}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {chip.lastUpdated}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" aria-label="Row actions" />
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
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-500">
              <p>
                Showing {(currentPage - 1) * PAGE_SIZE + (filtered.length ? 1 : 0)}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: pageCount }).map((_, index) => (
                  <Button
                    key={index}
                    variant={currentPage === index + 1 ? "default" : "ghost"}
                    size="icon-sm"
                    className={
                      currentPage === index + 1
                        ? "bg-indigo-600 text-white hover:bg-indigo-500"
                        : ""
                    }
                    onClick={() => setPage(index + 1)}
                  >
                    {index + 1}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={currentPage === pageCount}
                  onClick={() =>
                    setPage((value) => Math.min(pageCount, value + 1))
                  }
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

function StatCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <li className="flex items-center gap-2">
      <span className={`size-2 rounded-full ${color}`} />
      {label}
      <span className="ml-auto font-medium tabular-nums text-slate-800">
        {value.toLocaleString()}
      </span>
    </li>
  );
}

function FilterSelect({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  items: Array<[string, string]>;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(String(next))}>
      <SelectTrigger className="min-w-36 border-slate-200 bg-slate-50">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map(([itemValue, label]) => (
          <SelectItem key={itemValue} value={itemValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
