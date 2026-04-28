import { MapPin, Navigation, Clock, Fuel, ArrowDown, CheckCircle2 } from "lucide-react";
import { RoutePoint, OptimizedRoute } from "@/lib/routeTypes";

// ── Haversine distance formula ─────────────────────────────────────────────
function haversineKm(a: RoutePoint, b: RoutePoint): number {
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

// Estimate minutes based on 30 km/h average + 3 min stop overhead
function etaMinutes(distKm: number): number {
  return Math.round((distKm / 30) * 60) + 3;
}

type Props = {
  route: OptimizedRoute;
};

const RouteNavigationGuide = ({ route }: Props) => {
  const stopsToRender =
    route.optimizedStops && route.optimizedStops.length > 0
      ? route.optimizedStops
      : route.orderedStops;
  const allPoints: RoutePoint[] = [route.pickup, ...stopsToRender];

  // Build segment info: distance + cumulative ETA per leg
  type Segment = { from: RoutePoint; to: RoutePoint; distKm: number; cumMinutes: number };
  const segments: Segment[] = [];
  let cumMinutes = 0;
  for (let i = 0; i < allPoints.length - 1; i++) {
    const dist = haversineKm(allPoints[i], allPoints[i + 1]);
    cumMinutes += etaMinutes(dist);
    segments.push({ from: allPoints[i], to: allPoints[i + 1], distKm: dist, cumMinutes });
  }

  const totalDistKm = segments.reduce((s, seg) => s + seg.distKm, 0);
  const totalMinutes = segments.reduce((s, seg) => s + etaMinutes(seg.distKm), 0);

  // Short address helper — take first two comma-separated parts
  const shortAddr = (addr: string) => {
    const parts = addr.split(",");
    return parts.slice(0, 2).join(",").trim();
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        padding: "28px 32px",
        marginTop: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <div
          style={{
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            borderRadius: 10,
            padding: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Navigation size={20} color="#fff" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
            Route Navigation Guide
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
            Step-by-step delivery instructions
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: "relative" }}>
        {/* Vertical line */}
        <div
          style={{
            position: "absolute",
            left: 19,
            top: 40,
            bottom: 40,
            width: 2,
            background: "linear-gradient(to bottom, #22c55e 0%, #3b82f6 50%, #ef4444 100%)",
            borderRadius: 2,
          }}
        />

        {/* START */}
        <TimelineRow
          dot={
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(34,197,94,0.4)",
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={20} color="#fff" />
            </div>
          }
          label={<span style={{ fontWeight: 700, color: "#16a34a", fontSize: 12, letterSpacing: "0.08em" }}>START</span>}
          address={shortAddr(route.pickup.address)}
          meta={<span style={{ color: "#6b7280", fontSize: 12 }}>Pickup location</span>}
        />

        {/* Segments + stops */}
        {segments.map((seg, i) => (
          <div key={i}>
            {/* Distance arrow between stops */}
            <DistanceRow distKm={seg.distKm} />

            {/* Stop */}
            <TimelineRow
              dot={
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(239,68,68,0.35)",
                    fontWeight: 700,
                    color: "#fff",
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
              }
              label={<span style={{ fontWeight: 700, color: "#dc2626", fontSize: 12, letterSpacing: "0.08em" }}>STOP {i + 1}</span>}
              address={shortAddr(seg.to.address)}
              meta={
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={12} color="#6b7280" />
                  <span style={{ color: "#6b7280", fontSize: 12 }}>
                    ETA +{seg.cumMinutes} min from start
                  </span>
                </div>
              }
            />
          </div>
        ))}
      </div>

      {/* Summary footer */}
      <div
        style={{
          marginTop: 24,
          borderTop: "1px solid #f3f4f6",
          paddingTop: 20,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        <SummaryCell
          icon={<MapPin size={16} color="#3b82f6" />}
          label="Total Distance"
          value={`${totalDistKm.toFixed(1)} km`}
          color="#3b82f6"
        />
        <SummaryCell
          icon={<Clock size={16} color="#8b5cf6" />}
          label="Total Time"
          value={`~${totalMinutes} min`}
          color="#8b5cf6"
        />
        <SummaryCell
          icon={<Fuel size={16} color="#f59e0b" />}
          label="Fuel Cost"
          value={`₹${route.fuelCost.toFixed(0)}`}
          color="#f59e0b"
        />
      </div>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────

const TimelineRow = ({
  dot,
  label,
  address,
  meta,
}: {
  dot: React.ReactNode;
  label: React.ReactNode;
  address: string;
  meta: React.ReactNode;
}) => (
  <div style={{ display: "flex", gap: 16, alignItems: "flex-start", position: "relative", zIndex: 1 }}>
    {dot}
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "10px 14px",
        flex: 1,
        minWidth: 0,
      }}
    >
      {label}
      <p
        style={{
          margin: "2px 0 0",
          fontSize: 14,
          fontWeight: 600,
          color: "#111827",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={address}
      >
        {address}
      </p>
      <div style={{ marginTop: 4 }}>{meta}</div>
    </div>
  </div>
);

const DistanceRow = ({ distKm }: { distKm: number }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "6px 0",
      paddingLeft: 10,
      position: "relative",
      zIndex: 1,
    }}
  >
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "#eff6ff",
        border: "1.5px solid #93c5fd",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <ArrowDown size={11} color="#3b82f6" />
    </div>
    <span
      style={{
        fontSize: 12,
        color: "#3b82f6",
        fontWeight: 600,
        background: "#eff6ff",
        borderRadius: 20,
        padding: "2px 10px",
        border: "1px solid #bfdbfe",
      }}
    >
      {distKm.toFixed(2)} km
    </span>
  </div>
);

const SummaryCell = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) => (
  <div
    style={{
      background: "#f9fafb",
      borderRadius: 10,
      padding: "12px 14px",
      border: "1px solid #e5e7eb",
      textAlign: "center",
    }}
  >
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{icon}</div>
    <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>{label}</p>
    <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 700, color }}>{value}</p>
  </div>
);

export default RouteNavigationGuide;
