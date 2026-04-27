import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock3,
  Fuel,
  MapPin,
  Navigation,
  PackageCheck,
  Plus,
  Route,
  Sparkles,
  TimerReset,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RouteMap from "@/components/RouteMap";
import { OptimizedRoute, RoutePoint, Stop } from "@/lib/routeTypes";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import NearbySuggestionCard from "@/components/NearbySuggestionCard";
import { useRoute } from "@/contexts/RouteContext";

const createStop = (address: string, lat: number | null = null, lng: number | null = null): Stop => ({
  id: `${address}-${Math.random().toString(36).slice(2)}`,
  address,
  lat,
  lng,
});

const generateNearbyStops = (coords: { lat: number; lng: number }) => {
  const offsets = [
    { lat: 0.018, lng: 0.026 },
    { lat: -0.015, lng: 0.022 },
    { lat: 0.021, lng: -0.023 },
    { lat: -0.019, lng: -0.027 },
  ];

  return offsets.map((offset) =>
    createStop(
      `Nearby Point`,
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

const Dashboard = () => {
  const {
    routeState,
    updatePickup,
    updateStops,
    updatePriority,
    updateVehicle,
    updateNearbyStops,
    updateRouteResult,
    updateStatusMessage,
  } = useRoute();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    updateRouteResult(null);
  }, [routeState.pickup.address, routeState.pickup.lat, routeState.pickup.lng, routeState.priority, routeState.vehicle, JSON.stringify(routeState.stops.map((stop) => stop.address))]);

  const activeStops = routeState.stops.filter((stop) => stop.address.trim());

  const fallbackRoute: OptimizedRoute = useMemo(() => {
    const baseLat = routeState.pickup.lat ?? 37.7749;
    const baseLng = routeState.pickup.lng ?? -122.4194;

    const orderedStops: RoutePoint[] = activeStops.map((stop, index) => ({
      label: `Stop ${index + 1}`,
      address: stop.address,
      lat: stop.lat ?? Number((baseLat + (index + 1) * 0.025).toFixed(6)),
      lng: stop.lng ?? Number((baseLng + (index + 1) * 0.035).toFixed(6)),
    }));

    const distance = activeStops.length === 0 ? 0 : Math.max(
      8,
      activeStops.length * 7.4 * (routeState.priority === "urgent" ? 1.08 : routeState.priority === "eco" ? 0.92 : 1) * (routeState.vehicle === "bike" ? 0.72 : routeState.vehicle === "truck" ? 1.18 : 1),
    );
    const speedKph = 30;
    const travelTimeMinutes = distance === 0 ? 0 : Math.max(5, Math.round((distance / speedKph) * 60 + activeStops.length * 5));
    const mileage = routeState.vehicle === "truck" ? 8 : routeState.vehicle === "bike" ? 45 : 15;
    const fuelGallons = Number((distance / mileage).toFixed(2));
    const fuelCost = Number((fuelGallons * 103).toFixed(2));
    const baseCharge = 150 + distance * 12 + activeStops.length * 80;
    const priorityModifier = routeState.priority === "urgent" ? 1.18 : routeState.priority === "eco" ? 0.88 : 1;
    const routeCost = distance === 0 ? 0 : Number((baseCharge * priorityModifier + fuelCost).toFixed(2));
    const estimatedArrival = new Date(Date.now() + travelTimeMinutes * 60000).toISOString();

    return {
      pickup: {
        label: "Pickup",
        address: routeState.pickup.address,
        lat: routeState.pickup.lat ?? baseLat,
        lng: routeState.pickup.lng ?? baseLng,
      },
      orderedStops,
      mapPoints: [
        {
          label: "Pickup",
          address: routeState.pickup.address,
          lat: routeState.pickup.lat ?? baseLat,
          lng: routeState.pickup.lng ?? baseLng,
        },
        ...orderedStops,
      ],
      totalDistanceKm: Number(distance.toFixed(1)),
      travelTimeMinutes,
      fuelGallons,
      fuelCost,
      routeCost,
      estimatedArrival,
      efficiency: Math.min(98, Math.max(60, Math.round(72 + activeStops.length * 2 + (routeState.priority === "eco" ? 8 : routeState.priority === "urgent" ? 2 : 4)))),
      fuelSaved: Math.min(100, Math.round(10 + activeStops.length * 2 + (routeState.priority === "eco" ? 10 : 3))),
      modelPrediction: {
        predictedTime: travelTimeMinutes,
        predictedFuel: fuelGallons,
        predictedCost: Number(routeCost.toFixed(2)),
        predictedScore: Math.min(100, Math.max(0, Math.round(72 + activeStops.length * 2 + (routeState.priority === "eco" ? 8 : routeState.priority === "urgent" ? 2 : 4)))),
      },
    };
  }, [routeState.pickup, activeStops, routeState.priority, routeState.vehicle]);

  const displayRoute = routeState.routeResult ?? fallbackRoute;

  const updateStop = (index: number, address: string) =>
    updateStops(routeState.stops.map((stop, stopIndex) =>
      stopIndex === index ? { ...stop, address, lat: null, lng: null } : stop,
    ));

  const addStop = () => updateStops([...routeState.stops, createStop("")]);

  const removeStop = (index: number) => updateStops(routeState.stops.filter((_, stopIndex) => stopIndex !== index));

  const importStops = () => {
    updateStops([
      createStop("88 Harbor Way, Brooklyn"),
      createStop("12 Market Street, Queens"),
      createStop("440 Hudson Ave, Manhattan"),
      createStop("Downtown Logistics Hub"),
    ]);
    updateStatusMessage("Sample stops imported. Customize the addresses or use your current location.");
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      updateStatusMessage("Geolocation is not available in this browser.");
      return;
    }

    updateStatusMessage("Requesting your current location…");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          console.log("Location obtained:", { lat, lng });

          const resolvedAddress = await reverseGeocode(lat, lng);
          console.log("Address resolved:", resolvedAddress);

          const rawNearby = generateNearbyStops({ lat, lng });
          console.log("Raw nearby stops:", rawNearby);

          const resolvedNearby = await resolveNearbyStops(rawNearby);
          console.log("Resolved nearby stops:", resolvedNearby);

          updatePickup({
            id: "current-location",
            address: resolvedAddress,
            lat,
            lng,
          });

          updateNearbyStops(resolvedNearby);
          updateStatusMessage(`Current location loaded: ${resolvedAddress}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          console.error("Error in geolocation:", errorMsg);
          updateStatusMessage(`Error loading location: ${errorMsg}`);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        updateStatusMessage(`Unable to access location: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const addNearbyStop = (stop: Stop) => {
    updateStops([...routeState.stops, stop]);
    updateStatusMessage("Nearby stop added to the route.");
  };

  const optimizeRoute = async () => {
    if (activeStops.length === 0) {
      updateStatusMessage("Add at least one valid stop before optimizing.");
      return;
    }

    setLoading(true);
    updateStatusMessage("Optimizing route on the backend…");

    try {
      const response = await fetch("/api/optimize-route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup: routeState.pickup,
          stops: activeStops.map((stop) => ({ address: stop.address, lat: stop.lat, lng: stop.lng })),
          priority: routeState.priority,
          vehicle: routeState.vehicle,
          fuelPrice: 103,
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || response.statusText);
      }

      const result = await response.json();
      updateRouteResult(result as OptimizedRoute);
      updateStatusMessage("Route optimized successfully with ML predictions.");
    } catch (error) {
      updateStatusMessage(`Unable to optimize route: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Dashboard</p>
          <h1 className="text-4xl font-bold">SmartRoute AI - Route Operations</h1>
          <p className="mt-2 text-muted-foreground">Optimize multi-stop delivery routes with AI-assisted sequencing, distance estimates, and logistics performance insights.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="panel" onClick={importStops}><PackageCheck /> Import Stops</Button>
          <Button variant="command" onClick={optimizeRoute} disabled={loading}><Zap /> Optimize Now</Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Deliveries", activeStops.length.toString(), PackageCheck, "Active stops"],
          ["Estimated Distance", activeStops.length === 0 ? "0 km" : `${displayRoute.totalDistanceKm} km`, Navigation, "AI calculated"],
          ["Estimated Time", activeStops.length === 0 ? "0 min" : `${displayRoute.travelTimeMinutes} min`, Clock3, "Current ETA"],
          ["Route Cost", activeStops.length === 0 ? "₹0.00" : `₹${displayRoute.routeCost.toFixed(2)}`, Fuel, "Projected expense"],
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
              <LocationAutocomplete
                value={routeState.pickup.address}
                onChange={(address, lat, lng) => updatePickup({ ...routeState.pickup, address, lat, lng })}
                placeholder="Enter pickup location"
              />
              <Button variant="panel" onClick={handleUseCurrentLocation}><MapPin /> Use My Current Location</Button>
            </div>
            <div className="space-y-3">
              <Label>Delivery stops</Label>
              {routeState.stops.map((stop, index) => (
                <div key={stop.id} className="flex flex-wrap items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">{index + 1}</div>
                  <LocationAutocomplete
                    value={stop.address}
                    onChange={(address, lat, lng) => updateStop(index, address)}
                    placeholder="Enter delivery address"
                  />
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
                <Select value={routeState.priority} onValueChange={updatePriority}>
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
                <Select value={routeState.vehicle} onValueChange={updateVehicle}>
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
              {routeState.statusMessage}
            </div>
            <Button className="w-full" variant="command" size="lg" onClick={optimizeRoute} disabled={loading}><Sparkles /> {loading ? "Optimizing…" : "Optimize Route"}</Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="text-primary" /> Route Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <RouteMap points={displayRoute.mapPoints} currentLocation={routeState.pickup.lat && routeState.pickup.lng ? { lat: routeState.pickup.lat, lng: routeState.pickup.lng } : undefined} />
          </CardContent>
        </Card>
      </section>

      {routeState.nearbyStops.length > 0 && (
        <section className="grid gap-6">
          <Card className="rounded-xl shadow-soft">
            <CardHeader>
              <CardTitle>Suggested nearby locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Choose a nearby location to add to your route.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {routeState.nearbyStops.map((stop) => (
                  <NearbySuggestionCard key={stop.id} stop={stop} onAdd={() => addNearbyStop(stop)} />
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
                ["Distance", activeStops.length === 0 ? "0 km" : `${displayRoute.totalDistanceKm} km`],
                ["Travel time", activeStops.length === 0 ? "0 min" : `${displayRoute.travelTimeMinutes} min`],
                ["Route cost", activeStops.length === 0 ? "₹0.00" : `₹${displayRoute.routeCost.toFixed(2)}`],
                ["ETA", activeStops.length === 0 ? "--:--" : new Date(displayRoute.estimatedArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })],
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
      </section>
    </div>
  );
};

export default Dashboard;