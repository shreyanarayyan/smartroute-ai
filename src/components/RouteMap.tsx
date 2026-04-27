import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
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
  const color = isPickup ? "#22c55e" : "#ef4444";
  const textColor = "#fff";
  const size = isPickup ? 40 : 36;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        color: ${textColor};
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        ${label}
      </div>
    `,
    iconSize: [size, size],
    className: "custom-div-icon",
  });
};

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
        {/* @ts-ignore - react-leaflet v4 type definitions issue */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {points.length > 1 && (
          <Polyline
            positions={points.map((point) => [point.lat, point.lng] as [number, number])}
            pathOptions={{ color: "#38bdf8", weight: 5, opacity: 0.85 }}
          />
        )}
        {points.map((point, index) => {
          const isPickup = index === 0;
          const displayLabel = isPickup ? "S" : String(index);
          const icon = createCustomIcon(isPickup, displayLabel);

          return (
            // @ts-ignore - react-leaflet v4 type definitions issue
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
