"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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

type DraftFilters = {
  search: string;
  sort: "status" | "passRate" | "name";
  status: "All" | FactoryStatus;
  factoryId: string;
};

const defaultFilters: DraftFilters = {
  search: "",
  sort: "status",
  status: "All",
  factoryId: "all",
};

export function FactoryOverviewPage() {
  const { data, loading, refetch } = useFakeFetch(factoryPayload);
  const [draft, setDraft] = useState<DraftFilters>(defaultFilters);
  const [applied, setApplied] = useState<DraftFilters>(defaultFilters);

  const factories = (data?.factories ?? []) as Factory[];

  const visible = useMemo(() => {
    let list = factories.filter((factory) => {
      const matchesSearch = factory.name
        .toLowerCase()
        .includes(applied.search.trim().toLowerCase());
      const matchesStatus =
        applied.status === "All" || factory.status === applied.status;
      const matchesFactory =
        applied.factoryId === "all" || factory.id === applied.factoryId;
      return matchesSearch && matchesStatus && matchesFactory;
    });

    list = [...list].sort((a, b) => {
      if (applied.sort === "passRate") return b.passRate - a.passRate;
      if (applied.sort === "name") return a.name.localeCompare(b.name);
      const order = { Critical: 0, Attention: 1, Healthy: 2 };
      return order[a.status] - order[b.status];
    });

    return list;
  }, [applied, factories]);

  return (
    <div>
      <RegisterRefresh refetch={refetch} />
      <PageToolbar />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Factory Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor the status of 8 factories, 100 labs per factory, and sensor
          chip test results in real-time.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={draft.search}
            onChange={(event) =>
              setDraft((current) => ({ ...current, search: event.target.value }))
            }
            placeholder="Search factory..."
            className="h-9 border-slate-200 bg-slate-50 pl-9"
          />
        </div>
        <Select
          value={draft.sort}
          onValueChange={(value) =>
            setDraft((current) => ({
              ...current,
              sort: value as DraftFilters["sort"],
            }))
          }
        >
          <SelectTrigger className="min-w-40 border-slate-200 bg-slate-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="status">Sort by Overall Status</SelectItem>
            <SelectItem value="passRate">Sort by Pass Rate</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={draft.status}
          onValueChange={(value) =>
            setDraft((current) => ({
              ...current,
              status: value as DraftFilters["status"],
            }))
          }
        >
          <SelectTrigger className="min-w-36 border-slate-200 bg-slate-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status === "All" ? "Filter by Status: All" : status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={draft.factoryId}
          onValueChange={(value) =>
            setDraft((current) => ({ ...current, factoryId: String(value) }))
          }
        >
          <SelectTrigger className="min-w-40 border-slate-200 bg-slate-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Filter by Factory: All</SelectItem>
            {factoryPayload.factories.map((factory) => (
              <SelectItem key={factory.id} value={factory.id}>
                {factory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setDraft(defaultFilters);
            setApplied(defaultFilters);
          }}
        >
          Reset
        </Button>
        <Button className="bg-indigo-600 text-white hover:bg-indigo-500" onClick={() => setApplied(draft)}>
          Apply
        </Button>
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
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visible.map((factory) => (
              <FactoryCard key={factory.id} factory={factory} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
