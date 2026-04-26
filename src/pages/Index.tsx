import { useEffect, useMemo, useState } from "react";
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
  Trash2,
  Truck,
  Zap,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RouteMap from "@/components/RouteMap";

type Stop = {
  id: string;
  address: string;
  lat: number | null;
  lng: number | null;
};

type RoutePoint = {
  label: string;
  address: string;
  lat: number;
  lng: number;
};

type OptimizedRoute = {
  pickup: RoutePoint;
  orderedStops: RoutePoint[];
  mapPoints: RoutePoint[];
  totalDistanceMiles: number;
  travelTimeMinutes: number;
  fuelGallons: number;
  fuelCost: number;
  routeCost: number;
  estimatedArrival: string;
  efficiency: number;
  fuelSaved: number;
  modelPrediction?: {
    predictedTime: number;
    predictedFuel: number;
    predictedCost: number;
    predictedScore: number;
  };
};

const createStop = (address: string, lat: number | null = null, lng: number | null = null): Stop => ({
  id: `${address}-${Math.random().toString(36).slice(2)}`,
  address,
  lat,
  lng,
});

const baseStops: Stop[] = [
  createStop("88 Harbor Way, Brooklyn"),
  createStop("12 Market Street, Queens"),
  createStop("440 Hudson Ave, Manhattan"),
];

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

const initialPickup = createStop("125 Distribution Drive, Newark");

const generateNearbyStops = (coords: { lat: number; lng: number }) => {
  const offsets = [
    { lat: 0.018, lng: 0.026 },
    { lat: -0.015, lng: 0.022 },
    { lat: 0.021, lng: -0.023 },
    { lat: -0.019, lng: -0.027 },
  ];

  return offsets.map((offset) =>
    createStop(
      `Unresolved nearby point`,
      Number((coords.lat + offset.lat).toFixed(6)),
      Number((coords.lng + offset.lng).toFixed(6)),
    ),
  );
};

const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    );
    const data = await response.json();
    return data?.display_name || `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
  } catch {
    return `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
  }
};

const resolveNearbyStops = async (rawStops: Stop[]) => {
  return Promise.all(
    rawStops.map(async (stop) => ({
      ...stop,
      address: await reverseGeocode(stop.lat ?? 0, stop.lng ?? 0),
    })),
  );
};

const Index = () => {
  const [pickup, setPickup] = useState<Stop>(initialPickup);
  const [stops, setStops] = useState<Stop[]>(baseStops);
  const [priority, setPriority] = useState("balanced");
  const [vehicle, setVehicle] = useState("van");
  const [nearbyStops, setNearbyStops] = useState<Stop[]>([]);
  const [routeResult, setRouteResult] = useState<OptimizedRoute | null>(null);
  const [statusMessage, setStatusMessage] = useState("Enter your pickup and stops, then optimize.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRouteResult(null);
  }, [pickup.address, pickup.lat, pickup.lng, priority, vehicle, JSON.stringify(stops.map((stop) => stop.address))]);

  const activeStops = stops.filter((stop) => stop.address.trim());

  const fallbackRoute: OptimizedRoute = useMemo(() => {
    const baseLat = pickup.lat ?? 37.7749;
    const baseLng = pickup.lng ?? -122.4194;

    const orderedStops: RoutePoint[] = activeStops.map((stop, index) => ({
      label: `Stop ${index + 1}`,
      address: stop.address,
      lat: stop.lat ?? Number((baseLat + (index + 1) * 0.025).toFixed(6)),
      lng: stop.lng ?? Number((baseLng + (index + 1) * 0.035).toFixed(6)),
    }));

    const distance = Math.max(
      8,
      activeStops.length * 7.4 * (priority === "urgent" ? 1.08 : priority === "eco" ? 0.92 : 1) * (vehicle === "bike" ? 0.72 : vehicle === "truck" ? 1.18 : 1),
    );
    const travelTimeMinutes = Math.max(10, Math.round(distance * (vehicle === "bike" ? 4.8 : vehicle === "truck" ? 3.6 : 3.2)));
    const fuelGallons = vehicle === "bike" ? 0 : Math.max(0.3, distance / (vehicle === "truck" ? 8 : 24));
    const fuelCost = Number((fuelGallons * 3.95).toFixed(2));
    const routeCost = Number((distance * 1.7 + fuelCost + activeStops.length * 4).toFixed(2));
    const estimatedArrival = new Date(Date.now() + travelTimeMinutes * 60000).toISOString();

    return {
      pickup: {
        label: "Pickup",
        address: pickup.address,
        lat: pickup.lat ?? baseLat,
        lng: pickup.lng ?? baseLng,
      },
      orderedStops,
      mapPoints: [
        {
          label: "Pickup",
          address: pickup.address,
          lat: pickup.lat ?? baseLat,
          lng: pickup.lng ?? baseLng,
        },
        ...orderedStops,
      ],
      totalDistanceMiles: Number(distance.toFixed(1)),
      travelTimeMinutes,
      fuelGallons: Number(fuelGallons.toFixed(1)),
      fuelCost,
      routeCost,
      estimatedArrival,
      efficiency: Math.min(98, Math.max(60, Math.round(72 + activeStops.length * 2 + (priority === "eco" ? 8 : priority === "urgent" ? 2 : 4)))),
      fuelSaved: Math.min(100, Math.round(10 + activeStops.length * 2 + (priority === "eco" ? 10 : 3))),
      modelPrediction: {
        predictedTime: travelTimeMinutes,
        predictedFuel: Number(fuelGallons.toFixed(1)),
        predictedCost: Number(routeCost.toFixed(2)),
        predictedScore: Math.min(100, Math.max(0, Math.round(72 + activeStops.length * 2 + (priority === "eco" ? 8 : priority === "urgent" ? 2 : 4)))),
      },
    };
  }, [pickup, activeStops, priority, vehicle]);

  const displayRoute = routeResult ?? fallbackRoute;

  const updateStop = (index: number, address: string) =>
    setStops((current) =>
      current.map((stop, stopIndex) =>
        stopIndex === index ? { ...stop, address, lat: null, lng: null } : stop,
      ),
    );

  const addStop = () => setStops((current) => [...current, createStop("")]);

  const removeStop = (index: number) => setStops((current) => current.filter((_, stopIndex) => stopIndex !== index));

  const importStops = () => {
    setStops([
      createStop("88 Harbor Way, Brooklyn"),
      createStop("12 Market Street, Queens"),
      createStop("440 Hudson Ave, Manhattan"),
      createStop("Downtown Logistics Hub"),
    ]);
    setStatusMessage("Sample stops imported. Customize the addresses or use your current location.");
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatusMessage("Geolocation is not available in this browser.");
      return;
    }

    setStatusMessage("Requesting your current location…");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const resolvedAddress = await reverseGeocode(lat, lng);
        const rawNearby = generateNearbyStops({ lat, lng });
        const resolvedNearby = await resolveNearbyStops(rawNearby);

        setPickup({
          id: "current-location",
          address: resolvedAddress,
          lat,
          lng,
        });

        setNearbyStops(resolvedNearby);
        setStatusMessage(`Current location loaded: ${resolvedAddress}`);
      },
      (error) => {
        setStatusMessage(`Unable to access location: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const addNearbyStop = (stop: Stop) => {
    setStops((current) => [...current, stop]);
    setStatusMessage("Nearby stop added to the route.");
  };

  const optimizeRoute = async () => {
    if (activeStops.length === 0) {
      setStatusMessage("Add at least one valid stop before optimizing.");
      return;
    }

    setLoading(true);
    setStatusMessage("Optimizing route on the backend…");

    try {
      const response = await fetch("/api/optimize-route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup,
          stops: activeStops.map((stop) => ({ address: stop.address, lat: stop.lat, lng: stop.lng })),
          priority,
          vehicle,
          fuelPrice: 3.95,
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || response.statusText);
      }

      const result = await response.json();
      setRouteResult(result as OptimizedRoute);
      setStatusMessage("Route optimized successfully with ML predictions.");
    } catch (error) {
      setStatusMessage(`Unable to optimize route: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

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
                <Button variant="panel" onClick={importStops}><PackageCheck /> Import Stops</Button>
                <Button variant="command" onClick={optimizeRoute} disabled={loading}><Zap /> Optimize Now</Button>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-4 md:p-8">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Total Deliveries", activeStops.length.toString(), PackageCheck, "Active stops"],
                ["Estimated Distance", `${displayRoute.totalDistanceMiles} mi`, Navigation, "AI calculated"],
                ["Estimated Time", `${displayRoute.travelTimeMinutes} min`, Clock3, "Current ETA"],
                ["Fuel Cost", `$${displayRoute.fuelCost.toFixed(2)}`, Fuel, "Projected expense"],
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
                    <Input value={pickup.address} onChange={(event) => setPickup({ ...pickup, address: event.target.value, lat: null, lng: null })} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="panel" onClick={handleUseCurrentLocation}><MapPin /> Use my current location</Button>
                    <Button variant="panel" onClick={importStops}><PackageCheck /> Load sample stop list</Button>
                  </div>
                  <div className="space-y-3">
                    <Label>Delivery stops</Label>
                    {stops.map((stop, index) => (
                      <div key={stop.id} className="flex flex-wrap items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">{index + 1}</div>
                        <Input className="flex-1 min-w-[220px]" value={stop.address} onChange={(event) => updateStop(index, event.target.value)} placeholder="Enter delivery address" />
                        <Button variant="ghost" className="h-9 px-3" onClick={() => removeStop(index)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </Button>
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
                  <div className="rounded-xl border border-border bg-secondary/10 p-4 text-sm text-muted-foreground">
                    {statusMessage}
                  </div>
                  <Button className="w-full" variant="command" size="lg" onClick={optimizeRoute} disabled={loading}><Sparkles /> {loading ? "Optimizing…" : "Optimize Route"}</Button>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-xl shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MapPin className="text-primary" /> Route Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <RouteMap points={displayRoute.mapPoints} currentLocation={pickup.lat && pickup.lng ? { lat: pickup.lat, lng: pickup.lng } : undefined} />
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4">
              <Card className="rounded-xl shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> ML Prediction Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-secondary p-4">
                    <p className="text-xs text-muted-foreground">Estimated travel time</p>
                    <p className="mt-1 text-xl font-bold">{displayRoute.modelPrediction?.predictedTime ?? displayRoute.travelTimeMinutes} min</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-4">
                    <p className="text-xs text-muted-foreground">Predicted fuel usage</p>
                    <p className="mt-1 text-xl font-bold">{displayRoute.modelPrediction?.predictedFuel ?? displayRoute.fuelGallons} gal</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-4">
                    <p className="text-xs text-muted-foreground">Predicted route cost</p>
                    <p className="mt-1 text-xl font-bold">${displayRoute.modelPrediction?.predictedCost ?? displayRoute.routeCost}</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-4">
                    <p className="text-xs text-muted-foreground">ML route score</p>
                    <p className="mt-1 text-xl font-bold">{displayRoute.modelPrediction?.predictedScore ?? displayRoute.efficiency}%</p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {nearbyStops.length > 0 && (
              <section className="grid gap-6">
                <Card className="rounded-xl shadow-soft">
                  <CardHeader>
                    <CardTitle>Nearby delivery suggestions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">Choose a nearby location to add to your route.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {nearbyStops.map((stop) => (
                        <div key={stop.id} className="rounded-xl border border-border bg-card p-4">
                          <p className="font-semibold">{stop.address}</p>
                          <p className="mt-2 text-sm text-muted-foreground">Located close to your current position.</p>
                          <Button className="mt-3" variant="panel" size="sm" onClick={() => addNearbyStop(stop)}>Add stop</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
              <Card className="rounded-xl shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Activity className="text-primary" /> Optimization Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Distance", `${displayRoute.totalDistanceMiles} mi`],
                      ["Travel time", `${displayRoute.travelTimeMinutes} min`],
                      ["Route cost", `$${displayRoute.routeCost.toFixed(2)}`],
                      ["ETA", new Date(displayRoute.estimatedArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })],
                    ].map(([label, value]) => (
                      <div key={label as string} className="rounded-lg bg-secondary p-4">
                        <p className="text-xs text-muted-foreground">{label as string}</p>
                        <p className="mt-1 text-xl font-bold">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {displayRoute.orderedStops.map((stop, index) => (
                      <div key={`${stop.label}-${index}`} className="flex gap-3 rounded-lg border bg-card p-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground text-sm font-bold">{index + 1}</span>
                        <div>
                          <p className="font-semibold">{stop.address}</p>
                          <p className="text-sm text-muted-foreground">Stop {index + 1} in the optimized route.</p>
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
                    <p className="rounded-lg bg-secondary p-4 text-foreground">Routes are optimized by distance and order, with fuel-efficient sequencing for your chosen vehicle type.</p>
                    <div className="flex gap-3"><TimerReset className="h-5 w-5 shrink-0 text-success" /> Keep urgent stops at the front for the fastest completion.</div>
                    <div className="flex gap-3"><Fuel className="h-5 w-5 shrink-0 text-success" /> Eco mode reduces fuel spend and route cost.</div>
                    <div className="flex gap-3"><Zap className="h-5 w-5 shrink-0 text-warning" /> Refresh the route if addresses change or new stops arrive.</div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl bg-gradient-command text-primary-foreground shadow-command">
                  <CardHeader>
                    <CardTitle>Fuel Consumption Estimate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-5xl font-bold">{Math.max(0.5, displayRoute.fuelGallons).toFixed(1)} gal</p>
                    <p className="mt-4 text-primary-foreground/76">Projected for current vehicle, route distance, and stop count.</p>
                    <div className="mt-8 rounded-lg bg-primary-foreground/12 p-4">
                      <p className="text-sm font-semibold">Route summary</p>
                      <p className="mt-1 text-sm text-primary-foreground/72">{displayRoute.efficiency}% efficiency and {displayRoute.fuelSaved}% projected fuel savings.</p>
                    </div>
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
                  <p className="font-display text-5xl font-bold">{Math.max(0.5, displayRoute.fuelGallons).toFixed(1)} gal</p>
                  <p className="mt-4 text-primary-foreground/76">Projected for current vehicle, route distance, and stop count.</p>
                  <div className="mt-8 rounded-lg bg-primary-foreground/12 p-4">
                    <p className="text-sm font-semibold">Route summary</p>
                    <p className="mt-1 text-sm text-primary-foreground/72">{displayRoute.efficiency}% efficiency and {displayRoute.fuelSaved}% projected fuel savings.</p>
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
