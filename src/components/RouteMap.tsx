import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type RoutePoint = {
  label: string;
  address: string;
  lat: number;
  lng: number;
};

type RouteMapProps = {
  points: RoutePoint[];
  currentLocation?: { lat: number; lng: number };
};

const createCustomIcon = (isPickup: boolean, label: string) => {
  const color = isPickup ? "#22c55e" : "#ef4444"; // green vs red
  const darkColor = isPickup ? "#15803d" : "#b91c1c"; // darker green vs darker red
  const size = isPickup ? 42 : 36;
  const innerSize = isPickup ? 24 : 20;

  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: -2px 2px 6px rgba(0,0,0,0.3);
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          width: ${innerSize}px;
          height: ${innerSize}px;
          background-color: ${darkColor};
          border-radius: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: ${isPickup ? 14 : 12}px;
        ">
          ${label}
        </div>
      </div>
    `,
    iconSize: [size, size],
    // The point of the teardrop extends beyond the square box after rotation
    iconAnchor: [size / 2, size * 1.2],
    popupAnchor: [0, -size * 1.2],
    className: "bg-transparent border-0", // Clears default leaflet background
  });
};

// ── Quadratic Bezier: arc between two lat/lng points ──────────────────────
function bezierPoints(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  steps = 32,
  offsetFraction = 0.25
): [number, number][] {
  // Midpoint
  const midLat = (a.lat + b.lat) / 2;
  const midLng = (a.lng + b.lng) / 2;
  // Perpendicular direction (rotate the segment vector 90°)
  const dLat = b.lat - a.lat;
  const dLng = b.lng - a.lng;
  const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;
  // Control point offset perpendicular to segment
  const ctrlLat = midLat + (-dLng / len) * offsetFraction * len;
  const ctrlLng = midLng + (dLat / len) * offsetFraction * len;

  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = (1 - t) * (1 - t) * a.lat + 2 * (1 - t) * t * ctrlLat + t * t * b.lat;
    const lng = (1 - t) * (1 - t) * a.lng + 2 * (1 - t) * t * ctrlLng + t * t * b.lng;
    pts.push([lat, lng]);
  }
  return pts;
}

// ── Draws one curved arc per consecutive pair of points ───────────────────
const CurvedPolylines = ({ points }: { points: RoutePoint[] }) => {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    // Clean up previous arcs
    if (layerRef.current) {
      layerRef.current.clearLayers();
      layerRef.current.remove();
    }
    if (points.length < 2) return;

    const group = L.layerGroup().addTo(map);
    layerRef.current = group;

    for (let i = 0; i < points.length - 1; i++) {
      // Alternate the arc direction so adjacent segments are distinguishable
      const offset = i % 2 === 0 ? 0.28 : -0.22;
      const curvePts = bezierPoints(points[i], points[i + 1], 32, offset);
      L.polyline(curvePts, {
        color: "#3b82f6",
        weight: 3,
        opacity: 0.85,
        // @ts-ignore
        smoothFactor: 1,
      }).addTo(group);
    }

    return () => {
      group.clearLayers();
      group.remove();
    };
  }, [points, map]);

  return null;
};

// ── Auto-fit map bounds to all visible points ─────────────────────────────
const FitBounds = ({ points }: { points: RoutePoint[] }) => {
  const map = useMap();
  const prevKey = useRef("");

  useEffect(() => {
    if (points.length < 2) return;
    const key = points.map((p) => `${p.lat},${p.lng}`).join("|");
    if (key === prevKey.current) return;
    prevKey.current = key;
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [40, 40] });
  }, [points, map]);

  return null;
};

// ── Main RouteMap ──────────────────────────────────────────────────────────
const RouteMap = ({ points, currentLocation }: RouteMapProps) => {
  const mapCenter: [number, number] = currentLocation
    ? [currentLocation.lat, currentLocation.lng]
    : points.length > 0
    ? [points[0].lat, points[0].lng]
    : [37.7749, -122.4194];

  return (
    <div className="rounded-3xl border border-border bg-card/90 p-4 shadow-soft">
      {/* @ts-ignore - react-leaflet v4 type definitions issue */}
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={false}
        className="h-[420px] w-full rounded-3xl"
        key={`${mapCenter[0]}-${mapCenter[1]}`}
        style={{ height: "420px" }}
      >
        {/* @ts-ignore */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Auto-fit bounds when points change */}
        <FitBounds points={points} />

        {/* Curved arcs — one smooth bezier arc per consecutive pair */}
        {points.length > 1 && <CurvedPolylines points={points} />}

        {/* Markers rendered on top of the arcs */}
        {points.map((point, index) => {
          const isPickup = index === 0;
          const displayLabel = isPickup ? "S" : String(index);
          const icon = createCustomIcon(isPickup, displayLabel);
          return (
            // @ts-ignore
            <Marker
              key={`${point.address}-${index}`}
              position={[point.lat, point.lng]}
              icon={icon}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{point.label}</strong>
                  <div className="text-xs text-muted-foreground">{point.address}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default RouteMap;
