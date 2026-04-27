export type Stop = {
  id: string;
  address: string;
  lat: number | null;
  lng: number | null;
};

export type RoutePoint = {
  label: string;
  address: string;
  lat: number;
  lng: number;
};

export type OptimizedRoute = {
  id?: string;
  name?: string;
  pickup: RoutePoint;
  orderedStops: RoutePoint[];
  mapPoints: RoutePoint[];
  totalDistanceMiles: number;
  travelTimeMinutes: number;
  fuelGallons: number;
  fuelCost: number;
  routeCost: number;
  estimatedArrival: string;
  efficiency: number;
  fuelSaved: number;
  modelPrediction?: {
    predictedTime: number;
    predictedFuel: number;
    predictedCost: number;
    predictedScore: number;
  };
};

export type Vehicle = {
  id: string;
  name: string;
  type: "van" | "truck" | "bike";
  driver: string;
  mpg: number;
  status: "available" | "busy" | "offline";
};

export type NearbyStop = {
  id: string;
  address: string;
  lat: number;
  lng: number;
  distanceMiles: number;
};

export type HistoryRecord = {
  id: string;
  name: string;
  route: OptimizedRoute;
  createdAt: string;
};

export type AnalyticsSnapshot = {
  totalDeliveries: number;
  totalDistance: number;
  averageFuelCost: number;
  averageETA: number;
  mlScore: number;
  routeCount: number;
};
