// Charting wrappers around Recharts for the auto-generated analytics and the
// inline AI-model visualizations. All inputs are mocked data.
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { DatasetAnalytics, InlineModelResult } from '../types';

const PALETTE = ['#2f6bff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function DistributionChart({ data }: { data: DatasetAnalytics['distribution'] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
        <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#2f6bff" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({ data }: { data: DatasetAnalytics['trend'] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
        <XAxis dataKey="period" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryPie({ data }: { data: DatasetAnalytics['categories'] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Render the appropriate chart for an inline model result. */
export function InlineModelChart({ model }: { model: InlineModelResult }) {
  if (model.name === 'Clustering' || model.name === 'Anomaly Detection') {
    // Group the scatter points by their label and color each group.
    const groups = Array.from(new Set(model.points.map((p) => p.group ?? 'All')));
    return (
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis type="number" dataKey="x" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis type="number" dataKey="y" fontSize={11} tickLine={false} axisLine={false} />
          <ZAxis range={[40, 40]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          {groups.map((g, i) => (
            <Scatter
              key={g}
              name={g}
              data={model.points.filter((p) => (p.group ?? 'All') === g)}
              fill={g === 'Anomaly' ? '#ef4444' : PALETTE[i % PALETTE.length]}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    );
  }
  // Regression → scatter of points with a fitted line feel (line chart).
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={model.points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
        <XAxis dataKey="x" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis dataKey="y" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip />
        <Line type="monotone" dataKey="y" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
