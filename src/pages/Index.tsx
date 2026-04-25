import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Clock3,
  Fuel,
  LayoutDashboard,
  MapPin,
  Navigation,
  PackageCheck,
  Plus,
  Route,
  Sparkles,
  TimerReset,
  Truck,
  Zap,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const baseStops = ["88 Harbor Way, Brooklyn", "12 Market Street, Queens", "440 Hudson Ave, Manhattan"];

const deliveryData = [
  { day: "Mon", deliveries: 42, saved: 7 },
  { day: "Tue", deliveries: 58, saved: 10 },
  { day: "Wed", deliveries: 51, saved: 9 },
  { day: "Thu", deliveries: 76, saved: 14 },
  { day: "Fri", deliveries: 69, saved: 12 },
  { day: "Sat", deliveries: 48, saved: 8 },
];

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Routes", icon: Route },
  { label: "Fleet", icon: Truck },
  { label: "Analytics", icon: BarChart3 },
];

const Index = () => {
  const [pickup, setPickup] = useState("125 Distribution Drive, Newark");
  const [stops, setStops] = useState(baseStops);
  const [priority, setPriority] = useState("balanced");
  const [vehicle, setVehicle] = useState("van");
  const [optimized, setOptimized] = useState(false);

  const route = useMemo(() => {
    const priorityBoost = priority === "urgent" ? 1.08 : priority === "eco" ? 0.89 : 1;
    const vehicleFactor = vehicle === "bike" ? 0.72 : vehicle === "truck" ? 1.18 : 1;
    const activeStops = stops.filter(Boolean);
    const distance = Math.max(8, activeStops.length * 7.6 * priorityBoost * vehicleFactor);
    const time = Math.round(distance * (vehicle === "bike" ? 4.8 : vehicle === "truck" ? 3.6 : 3.1));
    const orderedStops = [...activeStops].sort((a, b) => (optimized ? a.length - b.length : 0));

    return {
      orderedStops,
      distance: distance.toFixed(1),
      time,
      fuelSaved: Math.round(activeStops.length * 1.8 + (optimized ? 8 : 3)),
      efficiency: Math.min(98, Math.round(72 + activeStops.length * 4 + (optimized ? 12 : 0))),
    };
  }, [stops, priority, vehicle, optimized]);

  const addStop = () => setStops((current) => [...current, ""]);
  const updateStop = (index: number, value: string) =>
    setStops((current) => current.map((stop, stopIndex) => (stopIndex === index ? value : stop)));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 bg-gradient-command p-6 text-primary-foreground shadow-command lg:flex lg:flex-col">
          <div className="mb-10 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary-foreground/15">
              <Navigation className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-xl font-bold">SmartRoute AI</p>
              <p className="text-sm text-primary-foreground/70">Logistics command</p>
            </div>
          </div>
          <nav className="space-y-2">
            {navItems.map((item, index) => (
              <button
                key={item.label}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition hover:bg-primary-foreground/12 ${
                  index === 0 ? "bg-primary-foreground/16" : "text-primary-foreground/76"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-xl border border-primary-foreground/14 bg-primary-foreground/10 p-4">
            <Sparkles className="mb-3 h-5 w-5" />
            <p className="text-sm font-semibold">AI dispatcher online</p>
            <p className="mt-1 text-xs leading-5 text-primary-foreground/70">Live route scoring, ETA clustering, and fuel-aware sequencing.</p>
          </div>
        </aside>

        <section className="flex-1 overflow-hidden">
          <header className="border-b bg-card/80 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-normal md:text-5xl">SmartRoute AI</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">Optimize multi-stop delivery routes with AI-assisted sequencing, distance estimates, and logistics performance insights.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="panel"><PackageCheck /> Import Stops</Button>
                <Button variant="command" onClick={() => setOptimized(true)}><Zap /> Optimize Now</Button>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-4 md:p-8">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Total Deliveries", stops.filter(Boolean).length.toString(), PackageCheck, "Active stops"],
                ["Estimated Distance", `${route.distance} mi`, Navigation, "AI calculated"],
                ["Estimated Time", `${route.time} min`, Clock3, "Current ETA"],
                ["Fuel Saved", `${route.fuelSaved}%`, Fuel, "Projected reduction"],
              ].map(([label, value, Icon, meta]) => (
                <Card key={label as string} className="animate-slide-up rounded-xl border-border bg-card shadow-soft">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{label as string}</p>
                        <p className="mt-2 font-display text-3xl font-bold">{value as string}</p>
                      </div>
                      <div className="grid h-12 w-12 place-items-center rounded-lg bg-secondary text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                    <p className="mt-4 text-xs font-semibold text-success">{meta as string}</p>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <Card className="rounded-xl shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Route className="text-primary" /> Delivery Route Input</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Pickup location</Label>
                    <Input value={pickup} onChange={(event) => setPickup(event.target.value)} />
                  </div>
                  <div className="space-y-3">
                    <Label>Delivery stops</Label>
                    {stops.map((stop, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">{index + 1}</div>
                        <Input value={stop} onChange={(event) => updateStop(index, event.target.value)} placeholder="Enter delivery address" />
                      </div>
                    ))}
                    <Button variant="panel" onClick={addStop}><Plus /> Add delivery stop</Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Delivery priority</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="balanced">Balanced</SelectItem>
                          <SelectItem value="urgent">Urgent first</SelectItem>
                          <SelectItem value="eco">Fuel efficient</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Vehicle type</Label>
                      <Select value={vehicle} onValueChange={setVehicle}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="van">Delivery van</SelectItem>
                          <SelectItem value="truck">Box truck</SelectItem>
                          <SelectItem value="bike">Cargo bike</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full" variant="command" size="lg" onClick={() => setOptimized(true)}><Sparkles /> Optimize Route</Button>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-xl shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MapPin className="text-primary" /> Route Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative min-h-[370px] overflow-hidden rounded-xl bg-gradient-map p-5">
                    <div className="absolute inset-x-10 top-1/2 h-1 -translate-y-1/2 rotate-[-16deg] rounded-full bg-primary/35" />
                    <div className="absolute left-[18%] top-[22%] h-24 w-1 rotate-[42deg] rounded-full bg-accent/50" />
                    {route.orderedStops.map((stop, index) => (
                      <div
                        key={`${stop}-${index}`}
                        className="absolute grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-command animate-route-pulse"
                        style={{ left: `${18 + index * 20}%`, top: `${24 + (index % 2) * 34}%`, animationDelay: `${index * 180}ms` }}
                      >
                        {index + 1}
                      </div>
                    ))}
                    <div className="absolute bottom-5 left-5 right-5 rounded-xl border bg-card/90 p-4 shadow-soft backdrop-blur">
                      <p className="font-semibold">Interactive route panel</p>
                      <p className="mt-1 text-sm text-muted-foreground">Pickup from {pickup || "origin"}, then complete {route.orderedStops.length} stops using the shortest available sequence.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
              <Card className="rounded-xl shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Activity className="text-primary" /> Optimization Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Distance", `${route.distance} mi`],
                      ["Travel time", `${route.time} min`],
                      ["Stops", route.orderedStops.length],
                      ["Efficiency", `${route.efficiency}%`],
                    ].map(([label, value]) => (
                      <div key={label as string} className="rounded-lg bg-secondary p-4">
                        <p className="text-xs text-muted-foreground">{label as string}</p>
                        <p className="mt-1 text-xl font-bold">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {route.orderedStops.map((stop, index) => (
                      <div key={`${stop}-sequence`} className="flex gap-3 rounded-lg border bg-card p-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground text-sm font-bold">{index + 1}</span>
                        <div>
                          <p className="font-semibold">{stop || "Unassigned delivery stop"}</p>
                          <p className="text-sm text-muted-foreground">ETA window optimized for traffic and route density</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-xl shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> AI Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <p className="rounded-lg bg-secondary p-4 text-foreground">AI prioritized clustered stops first, reduced cross-city backtracking, and balanced ETA risk against vehicle efficiency.</p>
                    <div className="flex gap-3"><TimerReset className="h-5 w-5 shrink-0 text-success" /> Start with dense zones before peak congestion.</div>
                    <div className="flex gap-3"><Fuel className="h-5 w-5 shrink-0 text-success" /> Use eco priority for lower idle time and fuel burn.</div>
                    <div className="flex gap-3"><Zap className="h-5 w-5 shrink-0 text-warning" /> Re-optimize when new urgent deliveries arrive.</div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl shadow-soft">
                  <CardHeader>
                    <CardTitle>Daily Deliveries</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deliveryData}>
                        <XAxis dataKey="day" tickLine={false} axisLine={false} />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: "hsl(var(--secondary))" }} />
                        <Bar dataKey="deliveries" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <Card className="rounded-xl shadow-soft lg:col-span-2">
                <CardHeader><CardTitle>Time Saved Analytics</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={deliveryData}>
                      <XAxis dataKey="day" tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <Tooltip />
                      <Area type="monotone" dataKey="saved" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.22)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="rounded-xl bg-gradient-command text-primary-foreground shadow-command">
                <CardHeader><CardTitle>Fuel Consumption Estimate</CardTitle></CardHeader>
                <CardContent>
                  <p className="font-display text-5xl font-bold">{Math.max(1.4, Number(route.distance) / 12).toFixed(1)} gal</p>
                  <p className="mt-4 text-primary-foreground/76">Projected for current vehicle, route density, and stop count.</p>
                  <div className="mt-8 rounded-lg bg-primary-foreground/12 p-4">
                    <p className="text-sm font-semibold">Route summary</p>
                    <p className="mt-1 text-sm text-primary-foreground/72">{route.efficiency}% efficient with {route.fuelSaved}% fuel savings.</p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Index;