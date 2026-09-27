"use client";

import "@/lib/chart-setup";
import { Tooltip, type ChartOptions, type Plugin, type TooltipPositionerFunction } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { cn } from "@/lib/utils";

// ── Custom tooltip positioner ────────────────────────────────────────────────
// Registered once — places the tooltip above the cursor with a fixed offset
// so it never overlaps the mouse pointer or the hovered arc segment.
declare module "chart.js" {
  interface TooltipPositionerMap {
    aboveCursor: TooltipPositionerFunction<"doughnut">;
  }
}

if (!Tooltip.positioners["aboveCursor"]) {
  Tooltip.positioners["aboveCursor"] = function (_elements, eventPosition) {
    const x = eventPosition.x ?? 0;
    const y = (eventPosition.y ?? 0) - 12; // 12px above the cursor
    return { x, y, xAlign: "center", yAlign: "bottom" };
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────
type PassRateChartProps = {
  passRate: number;
  pass: number;
  fail: number;
  error: number;
  size?: number;
  chartType: "doughnut" | "bar";
  className?: string;
  onSegmentClick?: (segmentIndex: number) => void;
};

const COLORS = {
  pass: "#22c55e",
  fail: "#f59e0b",
  error: "#ef4444",
};

const SEGMENT_LABELS = ["Pass", "Fail", "Error"] as const;

// ── Center-label canvas plugin ────────────────────────────────────────────────
// Drawn in afterDraw so the tooltip (rendered after all plugins) always wins.
function makeCenterLabelPlugin(passRate: number): Plugin<"doughnut"> {
  return {
    id: "centerLabel",
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const cx = (chartArea.left + chartArea.right) / 2;
      const cy = (chartArea.top + chartArea.bottom) / 2;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.font = "600 15px Inter, ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = "#1e293b";
      ctx.fillText(`${passRate.toFixed(1)}%`, cx, cy - 7);

      ctx.font = "400 9px Inter, ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("Pass Rate", cx, cy + 8);

      ctx.restore();
    },
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PassRateChart({
  passRate,
  pass,
  fail,
  error,
  size,
  chartType,
  className,
  onSegmentClick,
}: PassRateChartProps) {
  const labels = [...SEGMENT_LABELS];
  const values = [pass, fail, error];
  const sizeStyle = size ? { width: size, height: size } : undefined;

  if (chartType === "bar") {
    return (
      <div className={cn("w-full h-full", className)} style={sizeStyle}>
        <Bar
          data={{
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: [COLORS.pass, COLORS.fail, COLORS.error],
                borderRadius: 4,
                borderSkipped: false,
              },
            ],
          }}
          options={{
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 400 },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.92)",
                titleColor: "#f1f5f9",
                bodyColor: "#cbd5e1",
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                  label: (ctx) => `  ${(ctx.parsed.x ?? 0).toLocaleString()}`,
                },
              },
            },
            scales: {
              x: { display: false, grid: { display: false } },
              y: {
                display: true,
                grid: { display: false },
                ticks: { font: { size: 11 }, color: "#94a3b8" },
              },
            },
          }}
        />
      </div>
    );
  }

  // ── Doughnut ──────────────────────────────────────────────────────────────
  const centerLabelPlugin = makeCenterLabelPlugin(passRate);

  const options: ChartOptions<"doughnut"> = {
    cutout: "72%",
    responsive: true,
    maintainAspectRatio: false,
    animation: { animateRotate: true, duration: 600 },
    // Padding gives the tooltip room to render above the arc
    // without being cropped by the canvas edge.
    // overflow:visible on the wrapper lets the tooltip bleed outside freely,
    // so we only need a small uniform padding.
    layout: { padding: 8 },
    plugins: {
      legend: { display: false },
      tooltip: {
        // Our custom positioner: always 12px above the cursor, tail points down
        position: "aboveCursor",
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        boxWidth: 10,
        boxHeight: 10,
        callbacks: {
          title: (items) => SEGMENT_LABELS[items[0].dataIndex] ?? "",
          label: (ctx) => `  ${ctx.label}: ${ctx.parsed.toLocaleString()}`,
        },
      },
    },
    clip: false as unknown as number,
    onClick: onSegmentClick
      ? (_event, elements) => {
          if (elements.length > 0) onSegmentClick(elements[0].index);
        }
      : undefined,
  };

  return (
    <div
      className={cn("relative w-full h-full", className)}
      style={{ ...sizeStyle, overflow: "visible" }}
    >
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: [COLORS.pass, COLORS.fail, COLORS.error],
              borderWidth: 0,
              hoverOffset: 6,
            },
          ],
        }}
        options={options}
        plugins={[centerLabelPlugin]}
        style={onSegmentClick ? { cursor: "pointer" } : undefined}
      />
    </div>
  );
}
