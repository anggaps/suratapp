"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  date: string;
  incoming: number;
  outgoing: number;
}

interface DashboardChartProps {
  data: ChartData[];
}

export function DashboardChart({ data }: DashboardChartProps) {
  const [mounted, setMounted] = useState(false);
  const [height, setHeight] = useState(300);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (containerRef.current) {
      setHeight(containerRef.current.clientHeight || 300);
    }
  }, []);

  return (
    <div ref={containerRef} className="h-[300px] w-full min-w-0">
      {mounted && height > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="incoming" name="Surat Masuk" fill="#3b82f6" />
            <Bar dataKey="outgoing" name="Surat Keluar" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full" />
      )}
    </div>
  );
}
