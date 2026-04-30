import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { useRoute } from "@/contexts/RouteContext";
import { Navigation, CheckCircle2, X } from "lucide-react";
import { Button } from "./ui/button";
import { RoutePoint } from "@/lib/routeTypes";

// ── Haversine distance formula ─────────────────────────────────────────────
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// ── Custom Icons ─────────────────────────────────────────────────────────
const driverIcon = L.divIcon({
  html: `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <div style="width: 20px; height: 20px; background-color: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.6); position: relative; z-index: 2;"></div>
      <div style="position: absolute; width: 100%; height: 100%; background-color: rgba(59,130,246,0.2); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: "bg-transparent border-0",
});

const stopIcon = L.divIcon({
  html: `
    <div style="width: 24px; height: 24px; background-color: #ef4444; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: -1px 1px 4px rgba(0,0,0,0.3);">
      <div style="position: absolute; top: 50%; left: 50%; width: 10px; height: 10px; background-color: white; border-radius: 50%; transform: translate(-50%, -50%) rotate(45deg);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 28],
  className: "bg-transparent border-0",
});

// ── Auto-center Map ───────────────────────────────────────────────────────
const AutoCenter = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 16, { animate: true, duration: 0.5 });
  }, [position, map]);
  return null;
};

// ── Main Component ────────────────────────────────────────────────────────
const LiveNavigation = () => {
  const { routeState, setIsNavigating, setCurrentStopIndex } = useRoute();
  const { pickup, routeResult, currentStopIndex } = routeState;

  const stops = routeResult?.optimizedStops || [];
  const allPoints: RoutePoint[] = [pickup, ...stops];
  const targetStop = allPoints[currentStopIndex + 1]; // next stop

  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number }>({
    lat: pickup.lat,
    lng: pickup.lng,
  });

  const [simulating, setSimulating] = useState(false);
  const simulationRef = useRef<number>();

  // End navigation if all stops completed
  useEffect(() => {
    if (currentStopIndex >= stops.length) {
      alert("Route Completed!");
      setIsNavigating(false);
      setCurrentStopIndex(0);
    }
  }, [currentStopIndex, stops.length, setIsNavigating, setCurrentStopIndex]);

  // Simulation Logic: Smoothly interpolate between current location and next stop
  useEffect(() => {
    if (!simulating || !targetStop) return;

    let progress = 0;
    const startLoc = { ...liveLocation };
    
    const animate = () => {
      progress += 0.002; // speed of simulation
      if (progress >= 1) {
        setLiveLocation({ lat: targetStop.lat, lng: targetStop.lng });
        setSimulating(false);
        return;
      }

      setLiveLocation({
        lat: startLoc.lat + (targetStop.lat - startLoc.lat) * progress,
        lng: startLoc.lng + (targetStop.lng - startLoc.lng) * progress,
      });

      simulationRef.current = requestAnimationFrame(animate);
    };

    simulationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(simulationRef.current!);
  }, [simulating, targetStop]);

  if (!targetStop) return null;

  const distToNext = haversineKm(liveLocation, targetStop);

  const handleMarkDelivered = () => {
    setSimulating(false);
    cancelAnimationFrame(simulationRef.current!);
    setLiveLocation({ lat: targetStop.lat, lng: targetStop.lng });
    setCurrentStopIndex(currentStopIndex + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top Bar */}
      <div className="bg-card text-card-foreground p-4 shadow-md z-10 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-500" />
            Live Navigation
          </h2>
          <p className="text-sm text-muted-foreground">
            Stop {currentStopIndex + 1} of {stops.length}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsNavigating(false)}>
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <MapContainer
          center={[liveLocation.lat, liveLocation.lng]}
          zoom={16}
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <AutoCenter position={[liveLocation.lat, liveLocation.lng]} />

          {/* Route Polyline (from driver to next stop, and to all remaining stops) */}
          <Polyline
            positions={[
              [liveLocation.lat, liveLocation.lng],
              [targetStop.lat, targetStop.lng],
              ...allPoints.slice(currentStopIndex + 2).map((p) => [p.lat, p.lng] as [number, number]),
            ]}
            color="#3b82f6"
            weight={6}
            opacity={0.7}
          />

          {/* Driver Location */}
          <Marker position={[liveLocation.lat, liveLocation.lng]} icon={driverIcon} />

          {/* Target Stop */}
          <Marker position={[targetStop.lat, targetStop.lng]} icon={stopIcon}>
            <Popup>{targetStop.address}</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Bottom Dashboard */}
      <div className="bg-card p-6 shadow-[0_-4px_24px_rgba(0,0,0,0.1)] rounded-t-3xl z-10 relative">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-muted-foreground text-sm font-semibold mb-1 uppercase tracking-wider">Next Stop</p>
            <h3 className="text-2xl font-bold leading-tight">{targetStop.address.split(",")[0]}</h3>
            <p className="text-muted-foreground">{targetStop.address}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-blue-600">{distToNext.toFixed(1)}</span>
            <span className="text-muted-foreground font-semibold ml-1">km</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setSimulating(!simulating)}
          >
            {simulating ? "Pause Drive" : "Simulate Drive"}
          </Button>
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleMarkDelivered}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Arrived
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveNavigation;
