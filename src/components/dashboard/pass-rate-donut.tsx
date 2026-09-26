import { cn } from "@/lib/utils";

type PassRateDonutProps = {
  passRate: number;
  pass: number;
  fail: number;
  error: number;
  size?: number;
  className?: string;
};

export function PassRateDonut({
  passRate,
  pass,
  fail,
  error,
  size = 112,
  className,
}: PassRateDonutProps) {
  const total = Math.max(pass + fail + error, 1);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const passLen = (pass / total) * circumference;
  const failLen = (fail / total) * circumference;
  const errorLen = (error / total) * circumference;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 96 96" className="size-full -rotate-90">
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#eef2f7"
          strokeWidth="12"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#22c55e"
          strokeWidth="12"
          strokeDasharray={`${passLen} ${circumference}`}
          strokeLinecap="butt"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="12"
          strokeDasharray={`${failLen} ${circumference}`}
          strokeDashoffset={-passLen}
          strokeLinecap="butt"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#ef4444"
          strokeWidth="12"
          strokeDasharray={`${errorLen} ${circumference}`}
          strokeDashoffset={-(passLen + failLen)}
          strokeLinecap="butt"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold tracking-tight text-slate-800">
          {passRate.toFixed(1)}%
        </span>
        <span className="text-[10px] text-slate-400">Pass Rate</span>
      </div>
    </div>
  );
}
