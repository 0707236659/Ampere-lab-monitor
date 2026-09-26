import { FlaskConical } from "lucide-react";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <FlaskConical className="size-6" />
      </span>
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      <p className="mt-4 text-xs text-slate-400">
        Placeholder page — see the README continuation checklist.
      </p>
    </div>
  );
}
