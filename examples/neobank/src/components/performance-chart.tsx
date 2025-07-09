"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Generate sample data for different time periods
const generateData = (period: string) => {
  const now = new Date();
  const data = [];
  let points = 0;
  let interval = 0;

  switch (period) {
    case "1 HOUR":
      points = 60;
      interval = 1; // 1 minute intervals
      break;
    case "1 DAY":
      points = 24;
      interval = 60; // 1 hour intervals
      break;
    case "1 WEEK":
      points = 7;
      interval = 24 * 60; // 1 day intervals
      break;
    case "1 MONTH":
      points = 30;
      interval = 24 * 60; // 1 day intervals
      break;
    case "1 YEAR":
      points = 12;
      interval = 30 * 24 * 60; // 1 month intervals
      break;
    case "MAX":
      points = 50;
      interval = 7 * 24 * 60; // 1 week intervals
      break;
    default:
      points = 24;
      interval = 60;
  }

  // Generate data with a pattern similar to the image (flat then sharp increase)
  for (let i = 0; i < points; i++) {
    const date = new Date(now.getTime() - (points - i - 1) * interval * 60000);
    let value = 45 + Math.random() * 10; // Base value around 45-55

    // Add some variation in the middle
    if (i > points * 0.3 && i < points * 0.7) {
      value = 40 + Math.random() * 8;
    }

    // Sharp increase in the last 20% of data points
    if (i > points * 0.8) {
      const progress = (i - points * 0.8) / (points * 0.2);
      value = 40 + progress * 55 + Math.random() * 5;
    }

    data.push({
      date: date.toISOString(),
      value: Math.round(value * 100) / 100,
    });
  }

  return data;
};

const chartConfig = {
  value: {
    label: "Performance",
    color: "#22c55e",
  },
} satisfies ChartConfig;

const timeFilters = ["1 HOUR", "1 DAY", "1 WEEK", "1 MONTH", "1 YEAR", "MAX"];

export default function PerformanceChart() {
  const [activeFilter, setActiveFilter] = React.useState("1 DAY");
  const [chartData, setChartData] = React.useState(() => generateData("1 DAY"));

  React.useEffect(() => {
    setChartData(generateData(activeFilter));
  }, [activeFilter]);

  const currentValue = chartData[chartData.length - 1]?.value || 60.0;
  const previousValue = chartData[chartData.length - 2]?.value || 59.45;
  const change = currentValue - previousValue;
  const changePercent = (change / previousValue) * 100;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (activeFilter) {
      case "1 HOUR":
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      case "1 DAY":
        return date.toLocaleTimeString("en-US", { hour: "2-digit" });
      case "1 WEEK":
      case "1 MONTH":
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      case "1 YEAR":
      case "MAX":
        return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      default:
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  return (
    <Card className="h-full w-full rounded-3xl border-gray-800 bg-neobank-dark text-white">
      <CardContent className="">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-0">
          <h2 className="font-semibold text-white text-xl sm:text-2xl">Performance</h2>
          <div className="text-left sm:text-right">
            <div className="font-bold text-2xl text-white sm:text-3xl">
              ${currentValue.toFixed(2)}
            </div>
            <div className={`text-sm ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {change >= 0 ? "+" : ""}
              {changePercent.toFixed(2)}% (${change >= 0 ? "+" : ""}${change.toFixed(2)})
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[160px] sm:h-[240px] md:h-[280px] lg:h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  vertical={false}
                  horizontal={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  interval="preserveStartEnd"
                  className="text-xs sm:text-sm"
                />
                <YAxis
                  domain={["dataMin - 5", "dataMax + 5"]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  tickFormatter={(value) => `$${value}`}
                  className="text-xs sm:text-sm"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="border-gray-700 bg-gray-800 text-white"
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      }}
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, "Performance"]}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#22c55e" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Time Filters */}
        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
          {timeFilters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className={`px-2 py-1 text-xs sm:px-3 sm:py-2 ${
                activeFilter === filter
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {filter}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
