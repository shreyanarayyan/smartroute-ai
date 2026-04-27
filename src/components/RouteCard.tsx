import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoutePoint } from "@/lib/routeTypes";

type RouteCardProps = {
  route: {
    id?: string;
    name?: string;
    orderedStops: RoutePoint[];
    totalDistanceKm: number;
    travelTimeMinutes: number;
    fuelCost: number;
    routeCost: number;
  };
  onEdit?: () => void;
  onExport?: () => void;
};

const RouteCard = ({ route, onEdit, onExport }: RouteCardProps) => (
  <Card className="rounded-2xl border-border bg-card shadow-soft">
    <CardHeader>
      <CardTitle>{route.name || "Saved route"}</CardTitle>
      <p className="text-sm text-muted-foreground">{route.orderedStops.length} stops • {route.totalDistanceKm} km</p>
    </CardHeader>
    <CardContent>
      <div className="grid gap-3">
        <div className="rounded-xl bg-secondary p-4 text-sm">
          <p>Total time: <strong>{route.travelTimeMinutes} min</strong></p>
          <p>Fuel cost: <strong>₹{route.fuelCost.toFixed(2)}</strong></p>
          <p>Route cost: <strong>₹{route.routeCost.toFixed(2)}</strong></p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onEdit && <Button variant="secondary" onClick={onEdit}>Edit route</Button>}
          {onExport && <Button variant="outline" onClick={onExport}>Export</Button>}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default RouteCard;
