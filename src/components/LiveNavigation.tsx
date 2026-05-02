import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, Navigation, LocateFixed, CheckCircle2, ChevronRight, MapPin } from "lucide-react";
import confetti from "canvas-confetti";
import { RoutePoint } from "@/lib/routeTypes";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const lat1R = (lat1 * Math.PI) / 180;
  const lat2R = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2R);
  const x = Math.cos(lat1R) * Math.sin(lat2R) - Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// Decode Valhalla's encoded polyline6 format
function decodePolyline6(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let shift = 0, result = 0, byte: number;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / 1e6, lng / 1e6]);
  }
  return coords;
}

// ─── Arrow Icon (Google Maps style blue circle) ──────────────────────────────

const createArrowIcon = () => L.divIcon({
  html: `<div class="navigation-arrow" style="
    width:60px;height:60px;transform:rotate(0deg);
    transition:transform 0.15s linear;
    filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5));">
    <svg viewBox="0 0 100 100" width="60" height="60">
      <circle cx="50" cy="50" r="45" fill="#4285F4" stroke="white" stroke-width="4"/>
      <polygon points="50,12 78,72 50,58 22,72" fill="white"/>
    </svg>
  </div>`,
  iconSize: [60, 60], iconAnchor: [30, 30], className: "",
});

// ─── Destination Pin (proper Google Maps red teardrop) ───────────────────────

const createDestinationIcon = (label: string) => L.divIcon({
  html: `<div style="position:relative;width:36px;height:48px;">
    <svg viewBox="0 0 36 48" width="36" height="48">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="#EA4335"/>
      <circle cx="18" cy="18" r="8" fill="white"/>
    </svg>
    <div style="position:absolute;top:-28px;left:50%;transform:translateX(-50%);
      background:#1a1a1a;color:white;font-size:11px;font-weight:600;
      padding:2px 7px;border-radius:10px;white-space:nowrap;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);">${label}</div>
  </div>`,
  iconSize: [36, 48], iconAnchor: [18, 48], className: "",
});

// ─── Map auto-recenter ────────────────────────────────────────────────────────

const MapController = ({ center, zoom, shouldRecenter }: { center: [number, number]; zoom: number; shouldRecenter: boolean }) => {
  const map = useMap();
  useEffect(() => { if (shouldRecenter) map.flyTo(center, zoom, { duration: 1 }); }, [center, zoom, shouldRecenter, map]);
  return null;
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface LiveNavigationProps {
  stops: RoutePoint[];
  onExit: () => void;
  onComplete?: () => void;
}

export default function LiveNavigation({ stops, onExit, onComplete }: LiveNavigationProps) {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(1);
  const [routePolyline, setRoutePolyline]       = useState<[number, number][]>([]);
  const [startSnap, setStartSnap]               = useState<[number, number][] | null>(null);
  const [endSnap, setEndSnap]                   = useState<[number, number][] | null>(null);
  const [routingFailed, setRoutingFailed]       = useState(false);
  const [routeLoading, setRouteLoading]         = useState(false);
  const [instruction, setInstruction]           = useState("Acquiring GPS…");
  const [etaText, setEtaText]                   = useState("-- min");
  const [distText, setDistText]                 = useState("-- km");
  const [isCompleted, setIsCompleted]           = useState(false);
  const [shouldRecenter, setShouldRecenter]     = useState(true);
  const [arrivedToast, setArrivedToast]         = useState<string | null>(null);
  const [distToTarget, setDistToTarget]         = useState<number | null>(null);
  const [showDebug, setShowDebug]               = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  const watchIdRef  = useRef<number | null>(null);
  const markerRef   = useRef<L.Marker>(null);
  const bearingRef  = useRef<number>(0);
  const prevLocRef  = useRef<[number, number] | null>(null);
  const isSimulatingRef = useRef(false);

  const arrowIcon = useMemo(() => createArrowIcon(), []);

  // ── Arrow rotation (DOM-direct for 60fps) ──
  const updateBearing = (deg: number) => {
    bearingRef.current = deg;
    const el = markerRef.current?.getElement();
    if (el) {
      const div = el.querySelector(".navigation-arrow") as HTMLElement | null;
      if (div) div.style.transform = `rotate(${deg}deg)`;
    }
  };

  // ── 1. GPS Tracking ──
  useEffect(() => {
    if (!navigator.geolocation) { setInstruction("Geolocation not supported."); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (isSimulatingRef.current) return; // Block real GPS if simulating
        const { latitude, longitude, heading } = pos.coords;
        setCurrentLocation((prev) => {
          if (heading !== null && !isNaN(heading)) {
            updateBearing(heading);
          } else if (prev) {
            const dist = getDistance(prev[0], prev[1], latitude, longitude);
            if (dist > 2) updateBearing(calculateBearing(prev[0], prev[1], latitude, longitude));
          }
          prevLocRef.current = prev;
          return [latitude, longitude];
        });
      },
      (err) => {
        console.warn("GPS error:", err.message);
        setInstruction("Waiting for GPS signal…");
        if (stops[0]?.lat) setCurrentLocation([stops[0].lat, stops[0].lng]);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 },
    );
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  // ── 2. Compass / deviceorientation ──
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      let deg: number | null = (e as any).webkitCompassHeading ?? null;
      if (deg === null && e.alpha !== null) deg = (360 - e.alpha) % 360;
      if (deg !== null) updateBearing(deg);
    };
    window.addEventListener("deviceorientationabsolute", handler as EventListener, true);
    window.addEventListener("deviceorientation", handler as EventListener, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handler as EventListener, true);
      window.removeEventListener("deviceorientation", handler as EventListener, true);
    };
  }, []);

  // ── 3. Route Fetching (Valhalla → OSRM fallbacks → straight line) ──
  useEffect(() => {
    if (!currentLocation || currentStopIndex >= stops.length || isCompleted) return;

    const fetchRoute = async () => {
      const [startLat, startLng] = currentLocation;
      const target = stops[currentStopIndex];
      const { lat: destLat, lng: destLng, label } = target;

      if (!destLat || !destLng || destLat === 0 || destLng === 0) {
        setInstruction(`⚠️ "${label}" has no saved coordinates.`);
        return;
      }

      setRouteLoading(true);
      setRoutingFailed(false);
      let loaded = false;

      // ── Try Valhalla (most reliable, full India OSM data) ──
      try {
        const body = JSON.stringify({
          locations: [{ lon: startLng, lat: startLat }, { lon: destLng, lat: destLat }],
          costing: "auto",
          units: "km",
        });
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch("https://valhalla1.openstreetmap.de/route", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body, signal: ctrl.signal,
        });
        clearTimeout(t);
        if (res.ok) {
          const data = await res.json();
          if (data?.trip?.legs?.[0]?.shape) {
            const path = decodePolyline6(data.trip.legs[0].shape);
            console.log(`✅ Valhalla route: ${path.length} pts`);
            if (path.length > 0) {
              setStartSnap([[startLat, startLng], path[0]]);
              setEndSnap([path[path.length - 1], [destLat, destLng]]);
            }
            setRoutePolyline(path);
            const summary = data.trip.summary;
            setEtaText(`${Math.ceil(summary.time / 60)} min`);
            setDistText(`${summary.length.toFixed(1)} km`);
            const maneuver = data.trip.legs[0].maneuvers?.[0];
            setInstruction(maneuver?.instruction || `Head toward ${label}`);
            loaded = true;
          }
        }
      } catch (e: any) { console.warn("Valhalla failed:", e.message); }

      // ── OSRM fallbacks ──
      if (!loaded) {
        const servers = [
          `https://routing.openstreetmap.de/routed-car/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?steps=true&geometries=geojson&overview=full`,
          `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?steps=true&geometries=geojson&overview=full`,
        ];
        for (const url of servers) {
          try {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 6000);
            const res = await fetch(url, { signal: ctrl.signal });
            clearTimeout(t);
            if (!res.ok) continue;
            const data = await res.json();
            if (data.code === "Ok" && data.routes?.length > 0) {
              const route = data.routes[0];
              const path: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
              console.log(`✅ OSRM route: ${path.length} pts from ${url.split("/")[2]}`);
              if (path.length > 0) {
                setStartSnap([[startLat, startLng], path[0]]);
                setEndSnap([path[path.length - 1], [destLat, destLng]]);
              }
              setRoutePolyline(path);
              setEtaText(`${Math.ceil(route.duration / 60)} min`);
              setDistText(`${(route.distance / 1000).toFixed(1)} km`);
              const step = route.legs[0].steps?.[0];
              setInstruction(step?.maneuver?.instruction || `Head toward ${label}`);
              loaded = true;
              break;
            }
          } catch (e: any) { console.warn("OSRM failed:", e.message); }
        }
      }

      // ── Last resort: straight line (shown as dashed, not a road) ──
      if (!loaded) {
        console.warn("All routing failed — using direction arrow");
        setRoutePolyline([[startLat, startLng], [destLat, destLng]]);
        setRoutingFailed(true);
        setStartSnap(null); setEndSnap(null);
        const d = getDistance(startLat, startLng, destLat, destLng);
        setEtaText(`~${Math.ceil(d / 1000 / 0.5)} min`);
        setDistText(`${(d / 1000).toFixed(1)} km`);
        setInstruction(`Head toward ${label}`);
      }
      setRouteLoading(false);
    };

    fetchRoute();
    const interval = setInterval(fetchRoute, 20000);
    return () => clearInterval(interval);
  }, [currentLocation, currentStopIndex, isCompleted]);

  // ── 4. Auto Stop Detection (50m radius) ──
  useEffect(() => {
    if (!currentLocation || currentStopIndex >= stops.length || isCompleted) return;
    const target = stops[currentStopIndex];
    const dist = getDistance(currentLocation[0], currentLocation[1], target.lat, target.lng);
    setDistToTarget(dist);
    // 500m radius — works reliably with DevTools GPS simulation
    if (dist < 500) {
      const stopNum = currentStopIndex;
      const stopName = target.label || target.address?.split(",")[0] || `Stop ${stopNum}`;
      if (currentStopIndex === stops.length - 1) {
        setIsCompleted(true);
        triggerConfetti();
      } else {
        const msg = `✅ Reached ${stopName}! Navigating to next stop…`;
        setArrivedToast(msg);
        setTimeout(() => setArrivedToast(null), 4000);
        setCurrentStopIndex((p) => p + 1);
        setShouldRecenter(true);
        setRoutePolyline([]); setStartSnap(null); setEndSnap(null);
      }
    }
  }, [currentLocation, currentStopIndex, stops, isCompleted]);

  // ── Auto-redirect after completion ──
  useEffect(() => {
    if (isCompleted) {
      if (redirectCountdown > 0) {
        const timer = setTimeout(() => setRedirectCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        if (onComplete) onComplete();
        else onExit();
      }
    }
  }, [isCompleted, redirectCountdown]); // removed onComplete/onExit to prevent timer resets

  const triggerConfetti = () => {
    const end = Date.now() + 5000;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60,  spread: 55, origin: { x: 0 }, colors: ["#26ccff","#a25afd","#ff5e7e","#88ff5a","#ffa62d"] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#26ccff","#a25afd","#ff5e7e","#88ff5a","#ffa62d"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  // ─── JSX ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col font-sans">

      {/* TOP BANNER */}
      <div className="bg-[#0F9D58] text-white p-4 shadow-lg z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Navigation className="h-7 w-7 animate-pulse flex-shrink-0" />
          <div>
            <h1 className="text-xl font-bold leading-tight">
              {isCompleted ? "All Delivered! 🎉" : instruction}
            </h1>
            {!isCompleted && (
              <p className="text-green-100 text-sm flex items-center gap-1 mt-0.5">
                <span className="font-semibold">
                  Stop {currentStopIndex}/{stops.length - 1}:
                </span>
                {stops[currentStopIndex]?.label || "Destination"}
                <ChevronRight className="h-3 w-3" />
                {stops[currentStopIndex]?.address?.split(",")[0]}
              </p>
            )}
          </div>
        </div>
        <button onClick={onExit} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors flex-shrink-0">
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* ARRIVED TOAST */}
      {arrivedToast && (
        <div className="absolute top-24 left-4 right-4 z-30 bg-[#0F9D58] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
          <span className="font-semibold text-base">{arrivedToast}</span>
        </div>
      )}

      {/* LOADING TOAST */}
      {routeLoading && !arrivedToast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-gray-900/90 text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-medium">Calculating route…</span>
        </div>
      )}

      {/* MAP */}
      <div className="flex-1 relative" onTouchStart={() => setShouldRecenter(false)} onMouseDown={() => setShouldRecenter(false)}>
        {currentLocation ? (
          <MapContainer center={currentLocation} zoom={17} maxZoom={22} zoomControl={false} attributionControl={false} className="w-full h-full">
            <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution="Google" maxZoom={22} />
            <MapController center={currentLocation} zoom={17} shouldRecenter={shouldRecenter} />

            {/* User Arrow */}
            <Marker position={currentLocation} icon={arrowIcon} ref={markerRef} />

            {/* Destination Pin with popup */}
            {!isCompleted && stops[currentStopIndex] && (
              <Marker
                position={[stops[currentStopIndex].lat, stops[currentStopIndex].lng]}
                icon={createDestinationIcon(`Stop ${currentStopIndex}`)}
              >
                <Popup>
                  <div className="text-sm font-semibold">{stops[currentStopIndex].label || `Stop ${currentStopIndex}`}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{stops[currentStopIndex].address}</div>
                </Popup>
              </Marker>
            )}

            {/* ✅ Main Road Route — thick solid blue */}
            {routePolyline.length > 0 && !isCompleted && !routingFailed && (
              <>
                <Polyline positions={routePolyline} pathOptions={{ color: "#1557C0", weight: 14, opacity: 0.85, lineJoin: "round", lineCap: "round" }} />
                <Polyline positions={routePolyline} pathOptions={{ color: "#4285F4", weight: 9,  opacity: 1,    lineJoin: "round", lineCap: "round" }} />
              </>
            )}

            {/* ⚠️ Routing failed — thin dashed orange (direction only, not a road) */}
            {routePolyline.length > 0 && !isCompleted && routingFailed && (
              <>
                <Polyline positions={routePolyline} pathOptions={{ color: "#7B3F00", weight: 7, opacity: 0.8, dashArray: "1,16", lineCap: "round" }} />
                <Polyline positions={routePolyline} pathOptions={{ color: "#FF8C00", weight: 4, opacity: 0.9, dashArray: "1,16", lineCap: "round" }} />
              </>
            )}

            {/* Blue dot snap lines (off-road gap) */}
            {[startSnap, endSnap].map((snap, i) =>
              snap && !isCompleted ? (
                <span key={i}>
                  <Polyline positions={snap} pathOptions={{ color: "#1557C0", weight: 12, dashArray: "0,22", lineCap: "round", opacity: 0.9 }} />
                  <Polyline positions={snap} pathOptions={{ color: "#4285F4", weight: 8,  dashArray: "0,22", lineCap: "round", opacity: 1   }} />
                </span>
              ) : null
            )}
          </MapContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
            <div className="flex flex-col items-center gap-4 text-white/70">
              <MapPin className="h-12 w-12 animate-bounce" />
              <p className="text-xl font-medium">Acquiring GPS Signal…</p>
            </div>
          </div>
        )}

        {/* Re-centre button */}
        {!shouldRecenter && !isCompleted && currentLocation && (
          <button
            onClick={() => setShouldRecenter(true)}
            className="absolute bottom-6 left-6 z-20 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-white/20 transition-all shadow-lg"
          >
            <LocateFixed className="h-4 w-4" /> Re-centre
          </button>
        )}
      </div>

      {/* BOTTOM BAR */}
      <div className="bg-[#111] text-white border-t border-white/10 p-4 z-10 flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-[#0F9D58]">{isCompleted ? "0 min" : etaText}</span>
            <span className="text-lg text-gray-400">{isCompleted ? "0 km" : distText}</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Current Time</p>
            <p className="text-xl font-bold">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1.5 mt-1">
          <div className="flex justify-between text-sm font-medium text-gray-300">
            <span>Progress</span>
            <span>{Math.min(currentStopIndex, stops.length - 1)} of {stops.length - 1} stops</span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full flex gap-1 overflow-hidden">
            {stops.slice(1).map((_, idx) => {
              let cls = "bg-white/20";
              if (isCompleted || idx < currentStopIndex - 1) cls = "bg-[#0F9D58]";
              else if (idx === currentStopIndex - 1) cls = "bg-[#4285F4] animate-pulse";
              return <div key={idx} className={`h-full flex-1 rounded-full ${cls}`} />;
            })}
          </div>
        </div>

        {/* DEBUG / TEST PANEL */}
        {!isCompleted && stops[currentStopIndex] && (
          <div className="mt-1">
            <button
              onClick={() => setShowDebug(d => !d)}
              className="text-xs text-white/40 hover:text-white/70 underline transition-colors"
            >
              {showDebug ? "Hide" : "Show"} testing tools
            </button>
            {showDebug && (
              <div className="mt-2 bg-white/5 border border-white/10 rounded-xl p-3 text-xs space-y-2">
                <p className="text-yellow-400 font-semibold">🧪 Testing / Debug</p>

                {/* Exact target coordinates */}
                <div className="bg-black/30 rounded-lg p-2 space-y-1">
                  <p className="text-white/60">📍 Next stop target coordinates:</p>
                  <p className="text-green-400 font-mono font-bold">
                    Lat: {stops[currentStopIndex].lat.toFixed(6)}
                  </p>
                  <p className="text-green-400 font-mono font-bold">
                    Long: {stops[currentStopIndex].lng.toFixed(6)}
                  </p>
                  <p className="text-white/50 mt-1">
                    📏 Current distance to stop:{" "}
                    <span className={`font-bold ${
                      distToTarget !== null && distToTarget < 500 ? "text-green-400" : "text-red-400"
                    }`}>
                      {distToTarget !== null ? `${Math.round(distToTarget)} m` : "calculating…"}
                    </span>
                    {" "}<span className="text-white/30">(triggers at &lt;500m)</span>
                  </p>
                </div>

                <p className="text-white/50 leading-relaxed">
                  👆 Copy these into DevTools → Sensors → Other… to simulate arriving here.
                </p>

                {/* Simulate arrival button */}
                <button
                  onClick={() => {
                    isSimulatingRef.current = true; // Lock out real GPS
                    const target = stops[currentStopIndex];
                    setCurrentLocation([target.lat, target.lng]);
                  }}
                  className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors"
                >
                  ⚡ Simulate Arrival at Stop {currentStopIndex}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Completion overlay */}
      {isCompleted && (
        <div className="absolute inset-0 z-[9999] bg-[#0F9D58]/95 backdrop-blur-md flex flex-col items-center justify-center text-white p-8 text-center">
          <CheckCircle2 className="h-24 w-24 mb-4" />
          <h2 className="text-4xl font-bold mb-2">All Delivered! 🎉</h2>
          <p className="text-green-100 text-lg mb-8">You've completed all {stops.length - 1} stops.</p>
          <button
            onClick={() => (onComplete ? onComplete() : onExit())}
            className="px-8 py-4 bg-white text-[#0F9D58] font-bold rounded-2xl text-xl shadow-lg hover:bg-green-50 transition-colors"
          >
            Back to Dashboard
          </button>
          <p className="text-green-100/70 text-sm mt-6 font-medium tracking-wide">
            Auto-redirecting in {redirectCountdown}s...
          </p>
        </div>
      )}
    </div>
  );
}
