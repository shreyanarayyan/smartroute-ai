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
    <div className="bg-card text-card-foreground rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-none dark:border border-border p-7 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-2 flex items-center justify-center">
          <Navigation className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="m-0 text-lg font-bold text-foreground">
            Route Navigation Guide
          </h2>
          <p className="m-0 text-sm text-muted-foreground">
            Step-by-step delivery instructions
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-green-500 via-blue-500 to-red-500 rounded-full" />

        {/* START */}
        <TimelineRow
          dot={
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-[0_2px_8px_rgba(34,197,94,0.4)] shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          }
          label={<span className="font-bold text-green-600 dark:text-green-500 text-xs tracking-wider">START</span>}
          address={shortAddr(route.pickup.address)}
          meta={<span className="text-muted-foreground text-xs">Pickup location</span>}
        />

        {/* Segments + stops */}
        {segments.map((seg, i) => (
          <div key={i}>
            {/* Distance arrow between stops */}
            <DistanceRow distKm={seg.distKm} />

            {/* Stop */}
            <TimelineRow
              dot={
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-[0_2px_8px_rgba(239,68,68,0.35)] font-bold text-white text-base shrink-0">
                  {i + 1}
                </div>
              }
              label={<span className="font-bold text-red-600 dark:text-red-500 text-xs tracking-wider">STOP {i + 1}</span>}
              address={shortAddr(seg.to.address)}
              meta={
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">
                    ETA +{seg.cumMinutes} min from start
                  </span>
                </div>
              }
            />
          </div>
        ))}
      </div>

      {/* Summary footer */}
      <div className="mt-6 border-t border-border pt-5 grid grid-cols-3 gap-3">
        <SummaryCell
          icon={<MapPin className="w-4 h-4 text-blue-500" />}
          label="Total Distance"
          value={`${totalDistKm.toFixed(1)} km`}
          colorClass="text-blue-500"
        />
        <SummaryCell
          icon={<Clock className="w-4 h-4 text-purple-500" />}
          label="Total Time"
          value={`~${totalMinutes} min`}
          colorClass="text-purple-500"
        />
        <SummaryCell
          icon={<Fuel className="w-4 h-4 text-amber-500" />}
          label="Fuel Cost"
          value={`₹${route.fuelCost.toFixed(0)}`}
          colorClass="text-amber-500"
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
  <div className="flex gap-4 items-start relative z-10">
    {dot}
    <div className="bg-muted/30 border border-border rounded-xl p-3 flex-1 min-w-0 transition-colors">
      {label}
      <p
        className="mt-0.5 mb-0 text-sm font-semibold text-foreground whitespace-nowrap overflow-hidden text-ellipsis"
        title={address}
      >
        {address}
      </p>
      <div className="mt-1">{meta}</div>
    </div>
  </div>
);

const DistanceRow = ({ distKm }: { distKm: number }) => (
  <div className="flex items-center gap-2.5 py-1.5 pl-2.5 relative z-10">
    <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
      <ArrowDown className="w-3 h-3 text-blue-500 dark:text-blue-400" />
    </div>
    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full px-2.5 py-0.5 border border-blue-200 dark:border-blue-800">
      {distKm.toFixed(2)} km
    </span>
  </div>
);

const SummaryCell = ({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
}) => (
  <div className="bg-muted/30 rounded-xl p-3 border border-border text-center flex flex-col items-center transition-colors">
    <div className="flex justify-center mb-1.5">{icon}</div>
    <p className="m-0 text-[11px] text-muted-foreground font-medium">{label}</p>
    <p className={`mt-1 mb-0 text-lg font-bold ${colorClass}`}>{value}</p>
  </div>
);

export default RouteNavigationGuide;
