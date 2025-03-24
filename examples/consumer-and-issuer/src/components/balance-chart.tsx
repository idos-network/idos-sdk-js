"use client";

import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

// Function to generate random balance data
const generateRandomData = (days: number) => {
  const startBalance = Math.floor(Math.random() * 5000) + 5000;
  const data = [];
  let currentBalance = startBalance;

  for (let i = 0; i < days; i++) {
    const change = Math.floor(Math.random() * 500) - 200;
    currentBalance += change;
    currentBalance = Math.max(currentBalance, 1000);
    data.push(currentBalance);
  }

  return data;
};

export default function SimpleBalanceChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [days, setDays] = useState(7);
  const [balanceData, setBalanceData] = useState<number[]>([]);

  // Generate new random data
  const regenerateData = () => {
    setBalanceData(generateRandomData(days));
  };

  // Change time range and regenerate data
  const changeTimeRange = () => {
    const ranges = [7, 14, 30];
    const nextIndex = (ranges.indexOf(days) + 1) % ranges.length;
    setDays(ranges[nextIndex]);
    setBalanceData(generateRandomData(ranges[nextIndex]));
  };

  // Initialize data
  useEffect(() => {
    regenerateData();
  }, []);

  // Draw the chart whenever data changes
  useEffect(() => {
    if (!canvasRef.current || balanceData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Chart dimensions
    const padding = 30;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;

    // Find min and max values for scaling
    const minValue = Math.min(...balanceData) * 0.95;
    const maxValue = Math.max(...balanceData) * 1.05;
    const valueRange = maxValue - minValue;

    // Draw axes (very subtle)
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, rect.height - padding);
    ctx.lineTo(rect.width - padding, rect.height - padding);
    ctx.stroke();

    // Draw Y-axis labels with more values
    ctx.fillStyle = "#666";
    ctx.font = "7px sans-serif";
    ctx.textAlign = "right";

    // Add more y-axis labels (5 total)
    const yLabelCount = 4;
    for (let i = 0; i <= yLabelCount; i++) {
      const value = minValue + (valueRange * i) / yLabelCount;
      const y = rect.height - padding - (chartHeight * i) / yLabelCount;

      ctx.fillText(`$${Math.round(value).toLocaleString()}`, padding - 5, y + 3);

      // Add subtle horizontal grid lines
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
    }

    // Draw minimal X-axis labels
    ctx.textAlign = "center";
    ctx.font = "8px sans-serif";

    // Just first and last date
    const firstDay = new Date();
    firstDay.setDate(firstDay.getDate() - (days - 1));
    const lastDay = new Date();

    ctx.fillText(
      firstDay.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      padding,
      rect.height - padding + 12,
    );

    ctx.fillText(
      lastDay.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      rect.width - padding,
      rect.height - padding + 12,
    );

    // Draw line chart
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let i = 0; i < balanceData.length; i++) {
      const x = padding + (chartWidth * i) / (balanceData.length - 1);
      const y = rect.height - padding - ((balanceData[i] - minValue) / valueRange) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }, [balanceData, days]);

  return (
    <div className="rounded-lg bg-[#0a0b14] p-4 text-white">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-medium text-gray-400 text-sm">Balance ({days} days)</h2>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-gray-400 text-xs hover:text-white"
            onPress={changeTimeRange}
          >
            {days}d
          </Button>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>
    </div>
  );
}
