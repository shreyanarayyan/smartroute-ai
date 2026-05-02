import { MapPin, Navigation, Clock, Fuel, ArrowDown, CheckCircle2, Timer, Loader2 } from "lucide-react";
import { RoutePoint, OptimizedRoute } from "@/lib/routeTypes";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import LiveNavigation from "./LiveNavigation";
import { useRoute } from "@/contexts/RouteContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type SegmentData = {
  to: RoutePoint;
  roadDistKm: number;  // REAL road distance from routing API
  legMins: number;     // REAL driving time from routing API
  cumMins: number;     // cumulative from start
  cumDistKm: number;   // cumulative from start
  isEstimate: boolean; // true = haversine fallback, false = real road data
};

type Props = { route: OptimizedRoute };

// ─── Straight-line fallback (only used if API fails) ─────────────────────────

function haversineKm(a: RoutePoint, b: RoutePoint): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function haversineFallbackSegments(allPoints: RoutePoint[]): SegmentData[] {
  const segs: SegmentData[] = [];
  let cumMins = 0, cumDistKm = 0;
  for (let i = 0; i < allPoints.length - 1; i++) {
    const d = haversineKm(allPoints[i], allPoints[i + 1]) * 1.25; // road factor
    const mins = Math.round((d / 30) * 60) + 3;
    cumMins += mins;
    cumDistKm += d;
    segs.push({ to: allPoints[i + 1], roadDistKm: d, legMins: mins, cumMins, cumDistKm, isEstimate: true });
  }
  return segs;
}

// ─── Fetch REAL road distances from Valhalla ─────────────────────────────────

async function fetchRoadSegments(allPoints: RoutePoint[]): Promise<SegmentData[]> {
  // Build locations array for Valhalla
  const locations = allPoints.map((p) => ({ lon: p.lng, lat: p.lat }));

  const body = JSON.stringify({ locations, costing: "auto", units: "km" });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);

  const res = await fetch("https://valhalla1.openstreetmap.de/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: ctrl.signal,
  });
  clearTimeout(timer);

  if (!res.ok) throw new Error(`Valhalla ${res.status}`);

  const data = await res.json();
  const legs = data?.trip?.legs as { summary: { length: number; time: number } }[];
  if (!legs || legs.length !== allPoints.length - 1) throw new Error("Unexpected Valhalla response");

  const segs: SegmentData[] = [];
  let cumMins = 0, cumDistKm = 0;
  for (let i = 0; i < legs.length; i++) {
    const roadDistKm = legs[i].summary.length;           // already in km
    const legMins = Math.ceil(legs[i].summary.time / 60) + 3; // seconds → min + 3 min stop
    cumMins += legMins;
    cumDistKm += roadDistKm;
    segs.push({ to: allPoints[i + 1], roadDistKm, legMins, cumMins, cumDistKm, isEstimate: false });
  }
  return segs;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const RouteNavigationGuide = ({ route }: Props) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [segments, setSegments] = useState<SegmentData[] | null>(null);
  const [loadingDist, setLoadingDist] = useState(true);
  const { resetRoute } = useRoute();

  const stopsToRender =
    route.optimizedStops?.length > 0 ? route.optimizedStops : route.orderedStops;
  const allPoints: RoutePoint[] = [route.pickup, ...stopsToRender];

  // Fetch real road distances on mount
  useEffect(() => {
    setLoadingDist(true);
    fetchRoadSegments(allPoints)
      .then((segs) => {
        setSegments(segs);
        setLoadingDist(false);
      })
      .catch((err) => {
        console.warn("Road distance API failed, using estimate:", err.message);
        setSegments(haversineFallbackSegments(allPoints));
        setLoadingDist(false);
      });
  }, [route]);

  if (isNavigating) {
    return (
      <LiveNavigation
        stops={allPoints}
        onExit={() => setIsNavigating(false)}
        onComplete={() => {
          setIsNavigating(false);
          resetRoute(); // Completely clear the route state
          window.location.href = "/dashboard"; // Hard redirect to ensure clean dashboard
        }}
      />
    );
  }

  const totalDistKm = segments?.at(-1)?.cumDistKm ?? 0;
  const totalMins   = segments?.at(-1)?.cumMins ?? 0;
  const isEstimate  = segments?.some((s) => s.isEstimate) ?? true;

  const now = new Date();
  const etaClock = (addMins: number) =>
    new Date(now.getTime() + addMins * 60_000).toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit",
    });

  const shortAddr = (addr: string) => addr.split(",").slice(0, 2).join(",").trim();

  return (
    <div className="bg-card text-card-foreground rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-none dark:border border-border p-7 sm:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-2 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="m-0 text-lg font-bold text-foreground">Route Navigation Guide</h2>
            <p className="m-0 text-sm text-muted-foreground">
              {loadingDist ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Calculating real road distances…
                </span>
              ) : isEstimate ? (
                "Step-by-step guide (estimated distances)"
              ) : (
                "Step-by-step guide · Real road distances ✓"
              )}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsNavigating(true)}
          className="bg-[#0F9D58] hover:bg-[#0d8a4d] text-white shadow-lg gap-2 rounded-full px-6"
        >
          <Navigation className="w-4 h-4 fill-current" />
          Start Navigation 🧭
        </Button>
      </div>

      {/* Timeline */}
      <div className="relative">
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
          meta={<span className="text-muted-foreground text-xs">📦 Pickup location · Departs now ({now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})</span>}
        />

        {/* Stops */}
        {loadingDist
          ? // Loading skeleton
            Array.from({ length: stopsToRender.length }).map((_, i) => (
              <div key={i}>
                <SkeletonLegRow />
                <SkeletonStopRow index={i + 1} label={shortAddr(stopsToRender[i]?.address ?? "")} />
              </div>
            ))
          : segments!.map((seg, i) => (
              <div key={i}>
                <LegRow distKm={seg.roadDistKm} driveMins={seg.legMins - 3} isEstimate={seg.isEstimate} />
                <TimelineRow
                  dot={
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-[0_2px_8px_rgba(239,68,68,0.35)] font-bold text-white text-base shrink-0">
                      {i + 1}
                    </div>
                  }
                  label={<span className="font-bold text-red-600 dark:text-red-500 text-xs tracking-wider">STOP {i + 1}</span>}
                  address={shortAddr(seg.to.address)}
                  meta={
                    <div className="flex flex-wrap items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        <Timer className="w-3 h-3" />
                        ~{seg.legMins - 3} min drive from prev. stop
                      </span>
                      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Clock className="w-3 h-3" />
                        Arrives ~{etaClock(seg.cumMins)}
                      </span>
                    </div>
                  }
                />
              </div>
            ))
        }
      </div>

      {/* Summary Footer */}
      {!loadingDist && segments && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
            Full Route Summary {isEstimate && <span className="text-amber-500 normal-case">(estimated — road API unavailable)</span>}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <SummaryCell
              icon={<MapPin className="w-4 h-4 text-blue-500" />}
              label="Total Road Distance"
              sublabel={isEstimate ? "Est. road distance" : "Actual road distance"}
              value={`${totalDistKm.toFixed(1)} km`}
              colorClass="text-blue-500"
            />
            <SummaryCell
              icon={<Clock className="w-4 h-4 text-purple-500" />}
              label="Total Drive Time"
              sublabel="Inc. 3 min/stop delivery"
              value={`~${totalMins} min`}
              colorClass="text-purple-500"
            />
            <SummaryCell
              icon={<Fuel className="w-4 h-4 text-amber-500" />}
              label="Fuel Cost"
              sublabel="Estimated"
              value={`₹${route.fuelCost.toFixed(0)}`}
              colorClass="text-amber-500"
            />
          </div>

          {/* Plain-language guide */}
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3 text-xs text-blue-700 dark:text-blue-300 space-y-1.5">
            <p className="font-semibold text-sm text-blue-800 dark:text-blue-200 mb-1">📖 How to read this guide</p>
            <p>📍 <strong>Distance between stops</strong> = actual road distance your vehicle will travel.</p>
            <p>⏱ <strong>"~X min drive"</strong> = driving time for just that one leg (previous stop → this stop).</p>
            <p>🕐 <strong>"Arrives ~HH:MM"</strong> = expected clock time you'll reach this stop if you leave now.</p>
            <p>🏁 <strong>Total Time includes</strong> driving + 3 minutes per stop for delivery handoff.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const TimelineRow = ({
  dot, label, address, meta,
}: {
  dot: React.ReactNode; label: React.ReactNode; address: string; meta: React.ReactNode;
}) => (
  <div className="flex gap-4 items-start relative z-10">
    {dot}
    <div className="bg-muted/30 border border-border rounded-xl p-3 flex-1 min-w-0">
      {label}
      <p className="mt-0.5 mb-0 text-sm font-semibold text-foreground whitespace-nowrap overflow-hidden text-ellipsis" title={address}>
        {address}
      </p>
      <div className="mt-1">{meta}</div>
    </div>
  </div>
);

const LegRow = ({ distKm, driveMins, isEstimate }: { distKm: number; driveMins: number; isEstimate: boolean }) => (
  <div className="flex items-center gap-2 py-1.5 pl-2.5 relative z-10">
    <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
      <ArrowDown className="w-3 h-3 text-blue-500" />
    </div>
    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full px-2.5 py-0.5 border border-blue-200 dark:border-blue-800">
      {distKm.toFixed(2)} km {isEstimate ? "(est.)" : ""}
    </span>
    <span className="text-xs text-muted-foreground">·</span>
    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-full px-2.5 py-0.5 border border-purple-200 dark:border-purple-800">
      ~{driveMins} min drive
    </span>
  </div>
);

const SkeletonLegRow = () => (
  <div className="flex items-center gap-2 py-1.5 pl-2.5">
    <div className="w-5 h-5 rounded-full bg-muted animate-pulse shrink-0" />
    <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
    <div className="h-5 w-24 bg-muted animate-pulse rounded-full" />
  </div>
);

const SkeletonStopRow = ({ index, label }: { index: number; label: string }) => (
  <div className="flex gap-4 items-start">
    <div className="w-10 h-10 rounded-full bg-red-200 dark:bg-red-900/40 flex items-center justify-center font-bold text-red-400 shrink-0">
      {index}
    </div>
    <div className="bg-muted/30 border border-border rounded-xl p-3 flex-1">
      <div className="h-3 w-12 bg-muted animate-pulse rounded mb-2" />
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="h-3 w-40 bg-muted animate-pulse rounded mt-2" />
    </div>
  </div>
);

const SummaryCell = ({
  icon, label, sublabel, value, colorClass,
}: {
  icon: React.ReactNode; label: string; sublabel: string; value: string; colorClass: string;
}) => (
  <div className="bg-muted/30 rounded-xl p-3 border border-border text-center flex flex-col items-center">
    <div className="flex justify-center mb-1">{icon}</div>
    <p className="m-0 text-[11px] text-muted-foreground font-medium">{label}</p>
    <p className="m-0 text-[9px] text-muted-foreground/60">{sublabel}</p>
    <p className={`mt-1.5 mb-0 text-lg font-bold ${colorClass}`}>{value}</p>
  </div>
);

export default RouteNavigationGuide;
