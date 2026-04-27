import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

type AnalyticsChartProps = {
  title: string;
  data: Array<{ label: string; value: number }>; 
  color: string;
};

const AnalyticsChart = ({ title, data, color }: AnalyticsChartProps) => (
  <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
    <h2 className="text-lg font-semibold">{title}</h2>
    <div className="mt-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke={color} fill={`${color}33`} strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default AnalyticsChart;
