import React from "react";
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
  return (
    <div className="rounded-xl border border-[rgba(55,50,47,0.12)] dark:border-[#44403C] bg-white dark:bg-[#292524] text-[#37322F] dark:text-[#F5F5F4] shadow-sm col-span-4 lg:col-span-3">
        <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold font-sans tracking-tight">Overview</h3>
             <p className="text-sm text-[#605A57] dark:text-[#A8A29E]">
              Feedback volume per chatbot for the last 30 days.
            </p>
        </div>
      <div className="p-6 pt-0 pl-2">
        <div className="h-[350px] w-full">
            <Bar
                data={data}
                options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                         backgroundColor: "#1C1917",
                         titleColor: "#F5F5F4",
                         bodyColor: "#F5F5F4",
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
                            color: "#A8A29E",
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
                            color: "rgba(55,50,47,0.06)",
                        },
                        ticks: {
                            color: "#A8A29E",
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
