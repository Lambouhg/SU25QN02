"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface DataPoint {
  date: string;
  value: number;
}

interface ChartSingleLineProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  title?: string;
  description?: string;
}

export function ChartSingleLine({ 
  data, 
  height = 288, 
  color = "#8b5cf6",
  title,
  description 
}: ChartSingleLineProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
      
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart 
          data={data} 
          margin={{ top: 16, right: 10, left: 4, bottom: 0 }}
        >
          <defs>
            <linearGradient id="fillOverall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={color} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) => {
              if (typeof value === "string") {
                if (value.includes("-")) {
                  const date = new Date(value);
                  if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }
                }
                return value.length > 3 ? value.substring(0, 3) : value;
              }
              return value as string;
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v) => v.toLocaleString()}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <p className="font-medium mb-2">
                      {typeof label === 'string' && label.includes('-')
                        ? (() => {
                            const date = new Date(label);
                            if (!isNaN(date.getTime())) {
                              return date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              });
                            }
                            return label;
                          })()
                        : label}
                    </p>
                    {payload.map((entry, index) => (
                      <p key={index} className="text-sm" style={{ color: entry.color }}>
                        Overall: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="natural"
            dataKey="value"
            fill="url(#fillOverall)"
            stroke={color}
            strokeWidth={2.5}
            name="Overall"
            fillOpacity={0.6}
            connectNulls={true}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="flex items-center justify-center gap-6 mt-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ background: color, borderRadius: 4 }}></div>
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
        </div>
      </div>
    </div>
  );
}
