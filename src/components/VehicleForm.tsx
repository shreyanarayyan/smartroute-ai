import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Vehicle } from "@/lib/routeTypes";

type VehicleFormProps = {
  initialData?: Vehicle;
  onSave: (vehicle: Vehicle) => void;
};

const defaultVehicle = {
  id: "",
  name: "",
  type: "van" as const,
  driver: "",
  mpg: 10,
  status: "available" as const,
};

const VehicleForm = ({ initialData, onSave }: VehicleFormProps) => {
  const [vehicle, setVehicle] = useState<Vehicle>(initialData ?? defaultVehicle);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({ ...vehicle, id: vehicle.id || crypto.randomUUID() });
  };

  return (
    <form className="grid gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label>Vehicle name</Label>
        <Input value={vehicle.name} onChange={(event) => setVehicle({ ...vehicle, name: event.target.value })} placeholder="Fleet van 01" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Vehicle type</Label>
          <Select value={vehicle.type} onValueChange={(value) => setVehicle({ ...vehicle, type: value as Vehicle["type"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="truck">Truck</SelectItem>
              <SelectItem value="bike">Bike</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Driver</Label>
          <Input value={vehicle.driver} onChange={(event) => setVehicle({ ...vehicle, driver: event.target.value })} placeholder="Alex Patel" />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>km/L / efficiency</Label>
          <Input type="number" value={vehicle.mpg} onChange={(event) => setVehicle({ ...vehicle, mpg: Number(event.target.value) })} placeholder="Kilometers per litre" />
        </div>
        <div className="grid gap-2">
          <Label>Status</Label>
          <Select value={vehicle.status} onValueChange={(value) => setVehicle({ ...vehicle, status: value as Vehicle["status"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" className="mt-3">Save vehicle</Button>
    </form>
  );
};

export default VehicleForm;
