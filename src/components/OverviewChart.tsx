import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface OverviewChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
    }[];
  };
}

const OverviewChart: React.FC<OverviewChartProps> = ({ data }) => {
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const themedData = {
    ...data,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: darkMode
        ? dataset.backgroundColor === "#101723"
          ? "#D7DFE5"
          : dataset.backgroundColor === "#D8DFE9"
            ? "#566273"
            : dataset.backgroundColor
        : dataset.backgroundColor,
    })),
  };

  return (
    <div className="rounded-xl border border-[rgba(16,23,35,0.12)] dark:border-[#2B3646] bg-[#F9FCFF] dark:bg-[#1A2533] text-[#101723] dark:text-[#D7DFE5] shadow-sm col-span-4 lg:col-span-3">
        <div className="p-6 pb-4">
            <h3 className="text-body-lg font-semibold font-sans tracking-tight">Overview</h3>
             <p className="text-body-sm text-[#566273] dark:text-[#9BAABD]">
              Feedback volume per chatbot for the last 30 days.
            </p>
        </div>
      <div className="p-6 pt-0 pl-2">
        <div className="h-[350px] w-full">
            <Bar
                data={themedData}
                options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                         backgroundColor: "#141D2B",
                         titleColor: "#D7DFE5",
                         bodyColor: "#D7DFE5",
                         padding: 12,
                         cornerRadius: 8,
                         displayColors: false,
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                        },
                        ticks: {
                            color: darkMode ? "#9BAABD" : "#647184",
                            font: {
                                family: '"Inter", sans-serif',
                                size: 12
                            }
                        }
                    },
                    y: {
                        border: {
                             display: false,
                             dash: [4, 4],
                        },
                        grid: {
                            color: darkMode ? "rgba(215,223,229,0.10)" : "rgba(16,23,35,0.06)",
                        },
                        ticks: {
                            color: darkMode ? "#9BAABD" : "#647184",
                            font: {
                                family: '"Inter", sans-serif',
                                size: 12
                            },
                            stepSize: 1
                        },
                        beginAtZero: true
                    }
                }
                }}
            />
        </div>
      </div>
    </div>
  );
};

export default OverviewChart;
