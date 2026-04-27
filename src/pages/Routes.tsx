import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Save, Trash2, History, Edit, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RouteCard from "@/components/RouteCard";
import { OptimizedRoute } from "@/lib/routeTypes";
import { getSavedRoutes, saveRoute } from "@/lib/api";
import { useRoute } from "@/contexts/RouteContext";

const RoutesPage = () => {
  const { routeState, updatePickup, updateStops, updatePriority, updateVehicle } = useRoute();
  const [savedRoutes, setSavedRoutes] = useState<OptimizedRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSavedRoutes().then(setSavedRoutes).catch(console.error);
  }, []);

  const activeStops = routeState.stops.filter((stop) => stop.address.trim());

  const fallbackRoute: OptimizedRoute = useMemo(() => {
    const baseLat = routeState.pickup.lat ?? 37.7749;
    const baseLng = routeState.pickup.lng ?? -122.4194;

    const orderedStops = activeStops.map((stop, index) => ({
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
  const routeName = useMemo(() => `Route ${activeStops.length} stops`, [activeStops.length]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveRoute({ ...displayRoute, name: routeName, id: crypto.randomUUID() });
      setSaved(true);
      const next = await getSavedRoutes();
      setSavedRoutes(next);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const content = JSON.stringify(displayRoute, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${routeName.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleLoadRoute = (loadedRoute: OptimizedRoute) => {
    updatePickup(loadedRoute.pickup);
    updateStops(loadedRoute.orderedStops.map(stop => ({
      id: crypto.randomUUID(),
      address: stop.address,
      lat: stop.lat,
      lng: stop.lng,
    })));
    // Note: Priority and vehicle would need to be inferred or stored with the route
  };

  const handleReloadRoute = async (routeToReload: OptimizedRoute) => {
    // Simulate reloading/optimizing the route
    setLoading(true);
    try {
      // In a real app, this would call the optimization API
      setTimeout(() => {
        handleLoadRoute(routeToReload);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Routes</p>
          <h1 className="text-4xl font-bold">Advanced Route Management</h1>
          <p className="mt-2 text-muted-foreground">Create, save, edit, and export optimized delivery routes.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export Route
          </Button>
          <Button variant="command" onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" /> {saved ? "Saved!" : "Save Route"}
          </Button>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
        <Card className="rounded-xl border-border bg-card shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Active Route Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="rounded-xl bg-secondary p-4">
                <p className="text-sm text-muted-foreground">Route Name</p>
                <p className="mt-2 text-lg font-semibold">{routeName}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-secondary p-4">
                  <p className="text-xs text-muted-foreground">Stops</p>
                  <p className="mt-2 text-xl font-bold">{activeStops.length}</p>
                </div>
                <div className="rounded-xl bg-secondary p-4">
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="mt-2 text-xl font-bold">{displayRoute.totalDistanceKm} km</p>
                </div>
                <div className="rounded-xl bg-secondary p-4">
                  <p className="text-xs text-muted-foreground">Efficiency</p>
                  <p className="mt-2 text-xl font-bold">{displayRoute.efficiency}%</p>
                </div>
              </div>
              <div className="rounded-xl bg-secondary p-4">
                <p className="text-xs text-muted-foreground">Estimated Arrival</p>
                <p className="mt-2 text-xl font-semibold">{new Date(displayRoute.estimatedArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Saved Routes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {savedRoutes.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No saved routes yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Save your first route to see it here.</p>
              </div>
            ) : (
              savedRoutes.map((savedRoute) => (
                <div key={savedRoute.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <p className="font-semibold">{savedRoute.name || "Saved Route"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {savedRoute.orderedStops.length} stops
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {savedRoute.totalDistanceKm} km
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleLoadRoute(savedRoute)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleReloadRoute(savedRoute)} disabled={loading}>
                      <Play className="h-3 w-3 mr-1" />
                      Reload
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Route Editor</h2>
            <p className="text-sm text-muted-foreground">Edit stops and recalculate using the backend optimization engine.</p>
          </div>
          <Button variant="secondary">
            <Plus className="mr-2 h-4 w-4" /> Add Stop
          </Button>
        </div>
        <div className="grid gap-3">
          {activeStops.map((stop, index) => (
            <div key={stop.id} className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold">{stop.address}</p>
                  <p className="text-sm text-muted-foreground">Stop {index + 1} in sequence</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default RoutesPage;
