import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { BarChart3 } from "lucide-react";
import { useSiteDarkMode } from "../utils/useSiteDarkMode";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export interface FeedbackSeries {
  labels: string[];
  positive: number[];
  negative: number[];
}

interface OverviewChartProps {
  byChatbot: FeedbackSeries;
  overTime: FeedbackSeries;
}

type Mode = "time" | "chatbot";

const PALETTE = {
  light: { positive: "#101723", negative: "#C9D3E0", tick: "#647184", grid: "rgba(16,23,35,0.06)" },
  dark: { positive: "#D7DFE5", negative: "#4A5A6E", tick: "#9BAABD", grid: "rgba(215,223,229,0.08)" },
};

const hasAny = (s: FeedbackSeries) => s.positive.some((v) => v > 0) || s.negative.some((v) => v > 0);

const OverviewChart: React.FC<OverviewChartProps> = ({ byChatbot, overTime }) => {
  const darkMode = useSiteDarkMode();
  const [mode, setMode] = useState<Mode>(() => (hasAny(overTime) ? "time" : "chatbot"));
  const colors = darkMode ? PALETTE.dark : PALETTE.light;
  const series = mode === "time" ? overTime : byChatbot;
  const hasData = hasAny(series);
  const stacked = mode === "time";
  const tickFont = { family: '"Inter", sans-serif', size: 12 };

  const total = series.positive.reduce((a, b) => a + b, 0) + series.negative.reduce((a, b) => a + b, 0);

  return (
    <div className="flex h-full flex-col rounded-xl border border-[#D8DFE9] bg-[#F9FCFF] text-[#101723] shadow-[0_1px_2px_rgba(16,23,35,0.04)] dark:border-[#2B3646] dark:bg-[#1A2533] dark:text-[#D7DFE5]">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-2 sm:px-6">
        <div>
          <h3 className="text-body font-semibold tracking-tight">Visitor feedback</h3>
          <p className="mt-0.5 text-body-sm text-[#566273] dark:text-[#9BAABD]">
            {mode === "time"
              ? `${total.toLocaleString()} rating${total === 1 ? "" : "s"} in the last 30 days`
              : "All-time ratings for each chatbot"}
          </p>
        </div>
        <div
          role="group"
          aria-label="Chart view"
          className="inline-flex rounded-lg border border-[#D8DFE9] bg-[#F3F7FC] p-0.5 text-caption font-medium dark:border-[#2B3646] dark:bg-[#141D2B]"
        >
          {(
            [
              ["time", "Last 30 days"],
              ["chatbot", "By chatbot"],
            ] as [Mode, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              aria-pressed={mode === id}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                mode === id
                  ? "bg-[#F9FCFF] text-[#101723] shadow-sm dark:bg-[#273444] dark:text-[#D7DFE5]"
                  : "text-[#647184] hover:text-[#101723] dark:text-[#87909D] dark:hover:text-[#D7DFE5]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {hasData && (
        <div className="flex items-center gap-4 px-5 pb-1 text-caption text-[#566273] sm:px-6 dark:text-[#9BAABD]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.positive }} />
            Positive
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.negative }} />
            Negative
          </span>
        </div>
      )}
      <div className="flex-1 px-3 pb-4 sm:px-4">
        {hasData ? (
          <div className="h-[280px] w-full lg:h-[320px]">
            <Bar
              data={{
                labels: series.labels,
                datasets: [
                  {
                    label: "Positive",
                    data: series.positive,
                    backgroundColor: colors.positive,
                    borderRadius: stacked ? 2 : 4,
                    maxBarThickness: stacked ? 18 : 28,
                  },
                  {
                    label: "Negative",
                    data: series.negative,
                    backgroundColor: colors.negative,
                    borderRadius: stacked ? 2 : 4,
                    maxBarThickness: stacked ? 18 : 28,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#141D2B",
                    titleColor: "#F3F7FC",
                    bodyColor: "#D7DFE5",
                    padding: 10,
                    cornerRadius: 8,
                    boxPadding: 4,
                    usePointStyle: true,
                  },
                },
                scales: {
                  x: {
                    stacked,
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                      color: colors.tick,
                      font: tickFont,
                      maxRotation: 0,
                      autoSkip: true,
                      maxTicksLimit: stacked ? 8 : undefined,
                      callback(value) {
                        const label = this.getLabelForValue(Number(value));
                        return label.length > 14 ? `${label.slice(0, 13)}…` : label;
                      },
                    },
                  },
                  y: {
                    stacked,
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: colors.grid },
                    ticks: { color: colors.tick, font: tickFont, precision: 0 },
                  },
                },
              }}
            />
          </div>
        ) : (
          <div className="flex h-[280px] flex-col items-center justify-center text-center lg:h-[320px]">
            <BarChart3 size={28} className="text-[#87909D]" strokeWidth={1.5} />
            <p className="mt-3 text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
              {mode === "time" ? "No ratings in the last 30 days" : "No feedback yet"}
            </p>
            <p className="mt-1 max-w-xs text-caption text-[#647184] dark:text-[#87909D]">
              Ratings appear here once visitors give your chatbots a thumbs up or down.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewChart;
