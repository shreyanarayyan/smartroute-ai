import { Truck, User, Fuel, Activity, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vehicle } from "@/lib/routeTypes";

interface VehicleCardProps {
  vehicle: Vehicle;
  onRemove: (id: string) => void;
  onAssignDriver: (vehicleId: string, driver: string) => void;
}

const VehicleCard = ({ vehicle, onRemove, onAssignDriver }: VehicleCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'in-use': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="rounded-xl border-border bg-card shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{vehicle.name}</h3>
              <p className="text-sm text-muted-foreground">{vehicle.type}</p>
            </div>
          </div>
          <Badge className={getStatusColor(vehicle.status)}>
            {vehicle.status}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{vehicle.driver || 'No driver assigned'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            <span>{vehicle.mpg} MPG</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onAssignDriver(vehicle.id, 'New Driver')}
          >
            <User className="h-3 w-3 mr-1" />
            Assign Driver
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(vehicle.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleCard;