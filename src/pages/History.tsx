import { useEffect, useState } from "react";
import { History as HistoryIcon, Play, Calendar, Clock, MapPin, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import HistoryList from "@/components/HistoryList";
import { HistoryRecord } from "@/lib/routeTypes";
import { getHistory, saveHistory } from "@/lib/api";

const History = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<HistoryRecord[]>([]);
  const [viewMode, setViewMode] = useState<"timeline" | "cards">("timeline");

  useEffect(() => {
    getHistory().then(setHistory).catch(console.error);
  }, []);

  const handleReload = (record: HistoryRecord) => {
    window.localStorage.setItem("currentRoute", JSON.stringify(record.route));
    alert("Route loaded into planner. Open the Dashboard or Routes page to continue.");
  };

  const handleCompare = (record: HistoryRecord) => {
    setSelectedRecords(prev =>
      prev.includes(record)
        ? prev.filter(r => r.id !== record.id)
        : [...prev, record]
    );
  };

  const handleSaveSample = async () => {
    const sample: HistoryRecord = {
      id: crypto.randomUUID(),
      name: "Downtown pickup shift",
      createdAt: new Date().toISOString(),
      route: {
        pickup: { label: "Pickup", address: "125 Distribution Drive, Newark", lat: 40.7357, lng: -74.1724 },
        orderedStops: [
          { label: "Stop 1", address: "88 Harbor Way, Brooklyn", lat: 40.6895, lng: -73.9969 },
          { label: "Stop 2", address: "12 Market Street, Queens", lat: 40.7282, lng: -73.7949 },
        ],
        mapPoints: [],
        totalDistanceKm: 29.6,
        travelTimeMinutes: 62,
        fuelGallons: 3.8,
        fuelCost: 385.00,
        routeCost: 4250.00,
        estimatedArrival: new Date(Date.now() + 62 * 60000).toISOString(),
        efficiency: 84,
        fuelSaved: 12,
      },
    };

    await saveHistory(sample);
    const next = await getHistory();
    setHistory(next);
  };

  const sortedHistory = [...history].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">History</p>
          <h1 className="text-4xl font-bold">Route History & Analytics</h1>
          <p className="mt-2 text-muted-foreground">Review past routes, reload favorites, and compare performance metrics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === "timeline" ? "cards" : "timeline")}>
            {viewMode === "timeline" ? <BarChart3 className="mr-2 h-4 w-4" /> : <HistoryIcon className="mr-2 h-4 w-4" />}
            {viewMode === "timeline" ? "Card View" : "Timeline View"}
          </Button>
          <Button variant="command" onClick={handleSaveSample}>
            <Play className="mr-2 h-4 w-4" />
            Add Sample Route
          </Button>
        </div>
      </div>

      {/* Route Comparison */}
      {selectedRecords.length > 1 && (
        <Card className="rounded-xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Route Comparison ({selectedRecords.length} routes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-secondary p-4">
                <p className="text-sm text-muted-foreground">Avg Distance</p>
                <p className="mt-2 text-xl font-bold">
                  {(selectedRecords.reduce((sum, r) => sum + r.route.totalDistanceKm, 0) / selectedRecords.length).toFixed(1)} km
                </p>
              </div>
              <div className="rounded-xl bg-secondary p-4">
                <p className="text-sm text-muted-foreground">Avg Time</p>
                <p className="mt-2 text-xl font-bold">
                  {Math.round(selectedRecords.reduce((sum, r) => sum + r.route.travelTimeMinutes, 0) / selectedRecords.length)} min
                </p>
              </div>
              <div className="rounded-xl bg-secondary p-4">
                <p className="text-sm text-muted-foreground">Avg Cost</p>
                <p className="mt-2 text-xl font-bold">
                  ₹{(selectedRecords.reduce((sum, r) => sum + r.route.routeCost, 0) / selectedRecords.length).toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl bg-secondary p-4">
                <p className="text-sm text-muted-foreground">Avg Efficiency</p>
                <p className="mt-2 text-xl font-bold">
                  {Math.round(selectedRecords.reduce((sum, r) => sum + r.route.efficiency, 0) / selectedRecords.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Content */}
      <Card className="rounded-xl shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5" />
            Saved Route History ({history.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12">
              <HistoryIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold">No route history yet</p>
              <p className="text-sm text-muted-foreground mt-2">Save your first route to see it here, or add a sample route.</p>
            </div>
          ) : viewMode === "timeline" ? (
            <div className="space-y-6">
              {sortedHistory.map((record, index) => (
                <div key={record.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    {index < sortedHistory.length - 1 && <div className="w-px h-16 bg-border mt-2" />}
                  </div>
                  <div className="flex-1 pb-6">
                    <Card className="rounded-xl border-border bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{record.name}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(record.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(record.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={selectedRecords.includes(record) ? "default" : "outline"}
                              onClick={() => handleCompare(record)}
                            >
                              Compare
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleReload(record)}>
                              <Play className="h-3 w-3 mr-1" />
                              Reload
                            </Button>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-4">
                          <div className="rounded-lg bg-secondary p-3">
                            <p className="text-xs text-muted-foreground">Stops</p>
                            <p className="text-lg font-bold">{record.route.orderedStops.length}</p>
                          </div>
                          <div className="rounded-lg bg-secondary p-3">
                            <p className="text-xs text-muted-foreground">Distance</p>
                            <p className="text-lg font-bold">{record.route.totalDistanceKm} km</p>
                          </div>
                          <div className="rounded-lg bg-secondary p-3">
                            <p className="text-xs text-muted-foreground">Time</p>
                            <p className="text-lg font-bold">{record.route.travelTimeMinutes} min</p>
                          </div>
                          <div className="rounded-lg bg-secondary p-3">
                            <p className="text-xs text-muted-foreground">Efficiency</p>
                            <p className="text-lg font-bold">{record.route.efficiency}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedHistory.map((record) => (
                <Card key={record.id} className="rounded-xl border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{record.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {record.route.orderedStops.length} stops
                      </Badge>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Distance:</span>
                        <span className="font-medium">{record.route.totalDistanceKm} km</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium">{record.route.travelTimeMinutes} min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cost:</span>
                        <span className="font-medium">₹{record.route.routeCost.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={selectedRecords.includes(record) ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => handleCompare(record)}
                      >
                        Compare
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleReload(record)}>
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default History;
