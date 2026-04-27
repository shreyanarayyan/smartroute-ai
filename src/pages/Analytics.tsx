import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, DollarSign, Clock, Zap, MapPin, Activity, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AnalyticsChart from "@/components/AnalyticsChart";
import { AnalyticsSnapshot } from "@/lib/routeTypes";
import { getAnalytics } from "@/lib/api";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const deliveryTrendData = [
  { day: "Mon", deliveries: 42, cost: 125.50, time: 45 },
  { day: "Tue", deliveries: 58, cost: 156.80, time: 52 },
  { day: "Wed", deliveries: 51, cost: 142.30, time: 48 },
  { day: "Thu", deliveries: 76, cost: 189.90, time: 61 },
  { day: "Fri", deliveries: 69, cost: 173.40, time: 55 },
  { day: "Sat", deliveries: 48, cost: 134.20, time: 42 },
  { day: "Sun", deliveries: 35, cost: 98.70, time: 38 },
];

const costAnalysisData = [
  { month: "Jan", fuel: 1200, labor: 2800, maintenance: 450 },
  { month: "Feb", fuel: 1350, labor: 2900, maintenance: 520 },
  { month: "Mar", fuel: 1180, labor: 2750, maintenance: 480 },
  { month: "Apr", fuel: 1420, labor: 3100, maintenance: 550 },
];

const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);

  useEffect(() => {
    getAnalytics().then(setAnalytics).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Analytics</p>
          <h1 className="text-4xl font-bold">Delivery Performance Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Track delivery trends, costs, and ML-driven insights for optimal fleet performance.</p>
        </div>
        <Button variant="command">
          <BarChart3 className="mr-2 h-4 w-4" />
          Refresh Metrics
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border-border bg-card shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Deliveries</p>
                <p className="mt-2 text-3xl font-bold">{analytics?.totalDeliveries ?? 428}</p>
                <p className="text-xs text-green-600 mt-1">+12% from last week</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-blue-100 text-blue-600">
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Fuel Cost</p>
                <p className="mt-2 text-3xl font-bold">₹{analytics?.averageFuelCost.toFixed(2) ?? "103.00"}</p>
                <p className="text-xs text-green-600 mt-1">-8% efficiency gain</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-green-100 text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Delivery Time</p>
                <p className="mt-2 text-3xl font-bold">{analytics?.averageETA ?? 48} min</p>
                <p className="text-xs text-orange-600 mt-1">+5 min avg</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-orange-100 text-orange-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ML Route Score</p>
                <p className="mt-2 text-3xl font-bold">{analytics?.mlScore ?? 87}%</p>
                <p className="text-xs text-blue-600 mt-1">AI optimized</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-purple-100 text-purple-600">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Delivery Trend Charts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Delivery Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={deliveryTrendData}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="deliveries" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costAnalysisData}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="fuel" fill="#ef4444" />
                <Bar dataKey="labor" fill="#3b82f6" />
                <Bar dataKey="maintenance" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* ML Insights and Performance */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              ML Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-4">
              <p className="text-sm font-semibold text-purple-900">Route Optimization</p>
              <p className="mt-1 text-sm text-purple-700">
                AI predicts 15% fuel savings on average routes with 3+ stops.
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
              <p className="text-sm font-semibold text-blue-900">Time Efficiency</p>
              <p className="mt-1 text-sm text-blue-700">
                ML models suggest optimal departure times reduce delays by 22%.
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-4">
              <p className="text-sm font-semibold text-green-900">Cluster Analysis</p>
              <p className="mt-1 text-sm text-green-700">
                Delivery zones identified for 18% improved routing efficiency.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">On-Time Delivery</span>
                <Badge variant="secondary">94.2%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Route Completion</span>
                <Badge variant="secondary">98.7%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Customer Satisfaction</span>
                <Badge variant="secondary">4.8/5</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Fuel Efficiency</span>
                <Badge variant="secondary">+12%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Zone Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-secondary p-4">
              <p className="text-sm font-semibold">High-Density Areas</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Downtown: 45 deliveries/day<br />
                Residential: 32 deliveries/day<br />
                Industrial: 28 deliveries/day
              </p>
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <p className="text-sm font-semibold">Heat Map Analysis</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Peak hours: 9AM-11AM<br />
                Rush zones: City Center<br />
                Optimal routes: 23 identified
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Route Optimization Performance */}
      <Card className="rounded-xl shadow-soft">
        <CardHeader>
          <CardTitle>Route Optimization Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-4">Before vs After Optimization</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[
                  { name: 'Distance', before: 45.2, after: 38.7 },
                  { name: 'Time', before: 62, after: 48 },
                  { name: 'Cost', before: 142.50, after: 118.90 }
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="before" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="after" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-900">Optimization Results</p>
                <ul className="mt-2 text-sm text-green-700 space-y-1">
                  <li>• 14.5% reduction in distance</li>
                  <li>• 22.6% time savings</li>
                  <li>• 16.6% cost reduction</li>
                  <li>• 89% route efficiency score</li>
                </ul>
              </div>
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">ML Predictions</p>
                <p className="mt-1 text-sm text-blue-700">
                  TensorFlow.js models predict optimal sequencing with 94% accuracy based on historical data patterns.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
