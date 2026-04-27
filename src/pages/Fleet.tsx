import { useEffect, useState } from "react";
import { Truck, User, Fuel, Activity, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import VehicleForm from "@/components/VehicleForm";
import VehicleCard from "@/components/VehicleCard";
import { Vehicle } from "@/lib/routeTypes";
import { addVehicle, deleteVehicle, getFleet } from "@/lib/api";

const Fleet = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>(undefined);

  useEffect(() => {
    getFleet().then(setVehicles).catch(console.error);
  }, []);

  const refreshVehicles = async () => {
    const next = await getFleet();
    setVehicles(next);
  };

  const handleSave = async (vehicle: Vehicle) => {
    await addVehicle(vehicle);
    await refreshVehicles();
    setSelectedVehicle(undefined);
  };

  const handleRemove = async (id: string) => {
    await deleteVehicle(id);
    await refreshVehicles();
  };

  const handleAssignDriver = (vehicleId: string, driver: string) => {
    // In a real app, this would update the vehicle
    console.log(`Assigning ${driver} to vehicle ${vehicleId}`);
  };

  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'available').length;
  const activeDeliveries = vehicles.filter(v => v.status === 'in-use').length;
  const averageMPG = vehicles.length ? vehicles.reduce((sum, v) => sum + v.mpg, 0) / vehicles.length : 0;
  const assignedDrivers = vehicles.filter(v => v.driver).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Fleet</p>
          <h1 className="text-4xl font-bold">Fleet Management Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Monitor vehicles, assign drivers, and track fleet performance.</p>
        </div>
        <Button variant="command" onClick={() => setSelectedVehicle({} as Vehicle)}>
          <Truck className="mr-2 h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      {/* Fleet Overview Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border-border bg-card shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Vehicles</p>
                <p className="mt-2 text-3xl font-bold">{totalVehicles}</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-secondary text-primary">
                <Truck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="mt-2 text-3xl font-bold">{availableVehicles}</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-green-100 text-green-600">
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Deliveries</p>
                <p className="mt-2 text-3xl font-bold">{activeDeliveries}</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-blue-100 text-blue-600">
                <MapPin className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg MPG</p>
                <p className="mt-2 text-3xl font-bold">{averageMPG.toFixed(1)}</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-orange-100 text-orange-600">
                <Fuel className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
        <div className="space-y-6">
          {/* Fleet Utilization */}
          <Card className="rounded-xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Fleet Utilization Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-secondary p-4">
                  <p className="text-sm text-muted-foreground">Utilization Rate</p>
                  <p className="mt-2 text-2xl font-bold">{totalVehicles ? Math.round((activeDeliveries / totalVehicles) * 100) : 0}%</p>
                </div>
                <div className="rounded-xl bg-secondary p-4">
                  <p className="text-sm text-muted-foreground">Drivers Assigned</p>
                  <p className="mt-2 text-2xl font-bold">{assignedDrivers}</p>
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                <p className="text-sm font-semibold text-blue-900">Fleet Performance</p>
                <p className="mt-1 text-sm text-blue-700">
                  {availableVehicles} vehicles ready for dispatch, {activeDeliveries} currently on route.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Inventory */}
          <Card className="rounded-xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Vehicle Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold">No vehicles in fleet</p>
                  <p className="text-sm text-muted-foreground mt-2">Add your first vehicle to get started.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {vehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      onRemove={handleRemove}
                      onAssignDriver={handleAssignDriver}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <VehicleForm initialData={selectedVehicle} onSave={handleSave} />
      </section>
    </div>
  );
};

export default Fleet;
