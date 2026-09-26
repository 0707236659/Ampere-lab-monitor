"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Cpu,
  Factory,
  FileBarChart,
  FlaskConical,
  Home,
  RefreshCw,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import factoryPayload from "@/data/factories.json";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/factories/1", label: "Factories", icon: Factory, match: "/factories" },
  { href: "/labs", label: "Labs", icon: FlaskConical },
  { href: "/sensor-chips", label: "Sensor Chips", icon: Cpu },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

type RefreshContextValue = {
  lastUpdated: string;
  registerRefetch: (fn: (() => void) | null) => void;
  refetch: () => void;
};

const RefreshContext = createContext<RefreshContextValue | null>(null);

export function useDashboardRefresh() {
  const value = useContext(RefreshContext);
  if (!value) {
    throw new Error("useDashboardRefresh must be used inside AppShell");
  }
  return value;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [refetchFn, setRefetchFn] = useState<(() => void) | null>(null);

  const registerRefetch = useCallback((fn: (() => void) | null) => {
    setRefetchFn(() => fn);
  }, []);

  const refetch = useCallback(() => {
    refetchFn?.();
  }, [refetchFn]);

  const contextValue = useMemo(
    () => ({
      lastUpdated: factoryPayload.lastUpdated,
      registerRefetch,
      refetch,
    }),
    [registerRefetch, refetch],
  );

  return (
    <RefreshContext.Provider value={contextValue}>
      <div className="flex min-h-screen bg-[#f4f6fb] text-slate-800">
        <aside className="flex w-60 shrink-0 flex-col bg-[#1b2540] text-slate-200">
          <div className="flex items-center gap-3 px-5 py-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
              <Cpu className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Sensor Chip</p>
              <p className="text-xs text-slate-400">Manufacturing Test</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-3">
            {navItems.map((item) => {
              const matchPrefix = "match" in item ? item.match : item.href;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(`${matchPrefix}/`) ||
                    pathname === matchPrefix;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-5 py-4 text-xs text-slate-400">
            <p className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400" />
              System Online
            </p>
            <p className="mt-2">v1.2.0</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-end gap-3 px-8 py-4">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="size-4 text-slate-500" />
            </Button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-sm"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-white">
                TT
              </span>
              <span className="pr-1 font-medium text-slate-700">Thinh Tran</span>
              <ChevronDown className="size-4 text-slate-400" />
            </button>
          </header>
          <main className="min-w-0 flex-1 px-8 pb-8">{children}</main>
        </div>
      </div>
    </RefreshContext.Provider>
  );
}

export function RegisterRefresh({ refetch }: { refetch: () => void }) {
  const { registerRefetch } = useDashboardRefresh();

  useEffect(() => {
    registerRefetch(refetch);
    return () => registerRefetch(null);
  }, [refetch, registerRefetch]);

  return null;
}

export function PageToolbar({
  onRefresh,
}: {
  onRefresh?: () => void;
}) {
  const { lastUpdated, refetch } = useDashboardRefresh();
  return (
    <div className="mb-1 flex items-center justify-end gap-3 text-xs text-slate-400">
      <span>Last updated</span>
      <span className="font-medium text-slate-500">{lastUpdated}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Refresh data"
        onClick={() => {
          onRefresh?.();
          refetch();
        }}
      >
        <RefreshCw className="size-4" />
      </Button>
    </div>
  );
}
