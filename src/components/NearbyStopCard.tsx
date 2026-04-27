import { Button } from "@/components/ui/button";
import { NearbyStop } from "@/lib/routeTypes";

type NearbyStopCardProps = {
  stop: NearbyStop;
  onAdd: () => void;
};

const NearbyStopCard = ({ stop, onAdd }: NearbyStopCardProps) => (
  <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
    <p className="font-semibold">{stop.address}</p>
    <p className="mt-2 text-sm text-muted-foreground">{stop.distanceMiles.toFixed(1)} mi from current location</p>
    <Button className="mt-4" variant="panel" onClick={onAdd}>Add stop</Button>
  </div>
);

export default NearbyStopCard;
