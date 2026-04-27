import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Plus } from "lucide-react";
import { Stop } from "@/lib/routeTypes";

interface NearbySuggestionCardProps {
  stop: Stop;
  onAdd: () => void;
}

const NearbySuggestionCard = ({ stop, onAdd }: NearbySuggestionCardProps) => {
  return (
    <Card className="rounded-xl border-border bg-card shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="font-semibold text-sm">{stop.address}</p>
            </div>
            <p className="text-xs text-muted-foreground">Nearby delivery location</p>
          </div>
          <Button variant="panel" size="sm" onClick={onAdd}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NearbySuggestionCard;