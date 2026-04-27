import { useEffect, useState } from "react";
import { MapPin, Filter, Plus, Search, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NearbyStopCard from "@/components/NearbyStopCard";
import { NearbyStop, Stop } from "@/lib/routeTypes";
import { getNearbyStops } from "@/lib/api";

const NearbyStops = () => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyStops, setNearbyStops] = useState<NearbyStop[]>([]);
  const [filteredStops, setFilteredStops] = useState<NearbyStop[]>([]);
  const [routeStops, setRouteStops] = useState<Stop[]>([]);
  const [status, setStatus] = useState("Click the button to detect your location.");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [distanceFilter, setDistanceFilter] = useState("all");

  useEffect(() => {
    if (!currentLocation) return;
    getNearbyStops(currentLocation.lat, currentLocation.lng)
      .then((stops) => {
        setNearbyStops(stops);
        setFilteredStops(stops);
      })
      .catch(() => setStatus("Unable to load nearby stops."));
  }, [currentLocation]);

  useEffect(() => {
    let filtered = nearbyStops;

    if (categoryFilter !== "all") {
      filtered = filtered.filter(stop => stop.category === categoryFilter);
    }

    if (distanceFilter !== "all") {
      const maxDistance = distanceFilter === "1km" ? 1 : distanceFilter === "5km" ? 5 : 10;
      filtered = filtered.filter(stop => stop.distance <= maxDistance);
    }

    setFilteredStops(filtered);
  }, [nearbyStops, categoryFilter, distanceFilter]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setStatus("Geolocation is not available in this browser.");
      return;
    }

    setStatus("Loading your current location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setStatus("Current location detected. Fetching nearby stops...");
      },
      () => setStatus("Unable to detect your location."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleAddStop = (stop: NearbyStop) => {
    setRouteStops((current) => [...current, { id: stop.id, address: stop.address, lat: stop.lat, lng: stop.lng }]);
    setStatus(`Added "${stop.name}" to your route.`);
  };

  const categories = ["all", "restaurant", "store", "office", "residential", "warehouse"];
  const distances = ["all", "1km", "5km", "10km"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Nearby Stops</p>
          <h1 className="text-4xl font-bold">Discover Nearby Locations</h1>
          <p className="mt-2 text-muted-foreground">Find pickup points, delivery hubs, and stops near your current location.</p>
        </div>
        <Button variant="command" onClick={handleLocate}>
          <MapPin className="mr-2 h-4 w-4" /> Detect Location
        </Button>
      </div>

      {/* Current Location Status */}
      <Card className="rounded-xl shadow-soft">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Current Location Status</p>
              <p className="text-sm text-muted-foreground">{status}</p>
            </div>
            {currentLocation && (
              <Badge variant="secondary">
                {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {nearbyStops.length > 0 && (
        <Card className="rounded-xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Nearby Stops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Distance</label>
                <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {distances.map(dist => (
                      <SelectItem key={dist} value={dist}>
                        {dist === "all" ? "Any Distance" : `Within ${dist}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
        <div className="space-y-6">
          {/* Nearby Recommendations */}
          <Card className="rounded-xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Nearby Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredStops.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold">No nearby stops found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {currentLocation ? "Try adjusting your filters or search in a different area." : "Detect your location to find nearby stops."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredStops.map((stop) => (
                    <NearbyStopCard key={stop.id} stop={stop} onAdd={() => handleAddStop(stop)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggested Pickup Hubs */}
          {currentLocation && (
            <Card className="rounded-xl shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Suggested Pickup Hubs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="rounded-xl bg-secondary p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Central Distribution Center</p>
                        <p className="text-sm text-muted-foreground">2.3 km away • High capacity hub</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-xl bg-secondary p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Downtown Logistics Point</p>
                        <p className="text-sm text-muted-foreground">4.1 km away • Quick turnaround</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Route Imports Sidebar */}
        <Card className="rounded-xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Added to Route ({routeStops.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {routeStops.length === 0 ? (
              <div className="text-center py-8">
                <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No stops added yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Click "Add" on nearby locations to include them in your route.</p>
              </div>
            ) : (
              routeStops.map((stop, index) => (
                <div key={stop.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                      <p className="font-semibold text-sm">{stop.address}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      ×
                    </Button>
                  </div>
                </div>
              ))
            )}
            {routeStops.length > 0 && (
              <Button className="w-full" variant="command">
                Optimize Route with {routeStops.length} Stops
              </Button>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default NearbyStops;
