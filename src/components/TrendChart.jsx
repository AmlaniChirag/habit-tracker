import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { addDays, fromISODate } from '../hooks/useHabits.js';

const WINDOW = 60;
const ROLLING = 7;

export default function TrendChart({ habits, completions, today, theme }) {
  const data = useMemo(() => {
    // Build per-day pct for the last (WINDOW + ROLLING - 1) days so the rolling
    // average has enough lead-in.
    const total = WINDOW + ROLLING - 1;
    const start = addDays(today, -(total - 1));
    const daily = [];
    for (let i = 0; i < total; i++) {
      const date = addDays(start, i);
      const active = habits.filter((h) => h.createdAt <= date);
      const done = active.length
        ? (completions[date] || []).filter((id) => active.some((h) => h.id === id)).length
        : 0;
      const pct = active.length ? (done / active.length) * 100 : 0;
      daily.push({ date, pct });
    }
    const out = [];
    for (let i = ROLLING - 1; i < daily.length; i++) {
      let sum = 0;
      for (let j = 0; j < ROLLING; j++) sum += daily[i - j].pct;
      const avg = sum / ROLLING;
      const dt = fromISODate(daily[i].date);
      out.push({
        date: daily[i].date,
        label: `${dt.getMonth() + 1}/${dt.getDate()}`,
        avg: Math.round(avg),
      });
    }
    return out;
  }, [habits, completions, today]);

  const isDark = theme === 'dark';
  const axisColor = isDark ? '#737373' : '#a3a3a3';
  const gridColor = isDark ? '#262626' : '#e5e5e5';

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: axisColor, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: gridColor }}
            interval="preserveStartEnd"
            minTickGap={32}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tick={{ fill: axisColor, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: gridColor }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            cursor={{ stroke: '#6366f1', strokeOpacity: 0.2 }}
            contentStyle={{
              background: isDark ? '#0a0a0a' : '#ffffff',
              border: `1px solid ${gridColor}`,
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: axisColor }}
            formatter={(value) => [`${value}%`, '7-day avg']}
          />
          <Line
            type="monotone"
            dataKey="avg"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
