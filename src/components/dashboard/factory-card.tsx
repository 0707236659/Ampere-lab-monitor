import Link from "next/link";
import { Factory } from "lucide-react";
import { PassRateDonut } from "@/components/dashboard/pass-rate-donut";
import { factoryStatusClass } from "@/lib/status-styles";
import type { Factory as FactoryType } from "@/types/dashboard";

export function FactoryCard({ factory }: { factory: FactoryType }) {
  return (
    <Link
      href={`/factories/${factory.id}`}
      className="block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Factory className="size-4" />
          </span>
          <div>
            <p className="font-semibold text-slate-800">{factory.name}</p>
            <p className="text-xs text-slate-400">
              {factory.labs} labs · {factory.totalChips.toLocaleString()} chips
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${factoryStatusClass[factory.status]}`}
        >
          {factory.status}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <PassRateDonut
          passRate={factory.passRate}
          pass={factory.pass}
          fail={factory.fail}
          error={factory.error}
          size={108}
        />
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-center gap-2 text-slate-600">
            <span className="size-2 rounded-full bg-emerald-500" />
            Pass
            <span className="ml-auto font-medium tabular-nums text-slate-800">
              {factory.pass.toLocaleString()}
            </span>
          </li>
          <li className="flex items-center gap-2 text-slate-600">
            <span className="size-2 rounded-full bg-amber-500" />
            Fail
            <span className="ml-auto font-medium tabular-nums text-slate-800">
              {factory.fail.toLocaleString()}
            </span>
          </li>
          <li className="flex items-center gap-2 text-slate-600">
            <span className="size-2 rounded-full bg-red-500" />
            Error
            <span className="ml-auto font-medium tabular-nums text-slate-800">
              {factory.error.toLocaleString()}
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
        <div>
          <p className="text-[11px] text-emerald-600">Labs OK</p>
          <p className="text-lg font-semibold text-slate-800">{factory.labsOk}</p>
        </div>
        <div>
          <p className="text-[11px] text-amber-600">Labs Warning</p>
          <p className="text-lg font-semibold text-slate-800">
            {factory.labsWarning}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-red-500">Labs Error</p>
          <p className="text-lg font-semibold text-slate-800">
            {factory.labsError}
          </p>
        </div>
      </div>
    </Link>
  );
}
