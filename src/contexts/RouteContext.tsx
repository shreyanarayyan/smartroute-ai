import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { OptimizedRoute, RoutePoint, Stop } from "@/lib/routeTypes";

export interface RouteState {
  pickup: Stop;
  stops: Stop[];
  priority: string;
  vehicle: string;
  nearbyStops: Stop[];
  routeResult: OptimizedRoute | null;
  statusMessage: string;
}

interface RouteContextType {
  routeState: RouteState;
  updatePickup: (pickup: Stop) => void;
  updateStops: (stops: Stop[]) => void;
  updatePriority: (priority: string) => void;
  updateVehicle: (vehicle: string) => void;
  updateNearbyStops: (nearbyStops: Stop[]) => void;
  updateRouteResult: (routeResult: OptimizedRoute | null) => void;
  updateStatusMessage: (message: string) => void;
  resetRoute: () => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

const initialPickup: Stop = {
  id: "pickup-default",
  address: "Phagwara Tahsil, Kapurthala, Punjab",
  lat: 31.2240,
  lng: 75.7708,
};

const initialStops: Stop[] = [
  { id: "stop-1", address: "Athouli, Phagwara Tahsil, Kapurthala, Punjab, 144402, India", lat: 31.2060, lng: 75.7470 },
  { id: "stop-2", address: "Mehtan, Phagwara Tahsil, Kapurthala, Punjab, 144402, India", lat: 31.2330, lng: 75.7830 },
  { id: "stop-3", address: "Jalandhar, Punjab, India", lat: 31.3260, lng: 75.5762 },
  { id: "stop-4", address: "Kapurthala, Punjab, India", lat: 31.3803, lng: 75.3826 },
];

const initialState: RouteState = {
  pickup: initialPickup,
  stops: initialStops,
  priority: "balanced",
  vehicle: "van",
  nearbyStops: [],
  routeResult: null,
  statusMessage: "Enter your pickup and stops, then optimize.",
};

const STORAGE_KEY = "smartroute-route-state";

export const RouteProvider = ({ children }: { children: ReactNode }) => {
  const [routeState, setRouteState] = useState<RouteState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...initialState, ...JSON.parse(stored) } : initialState;
    } catch {
      return initialState;
    }
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routeState));
  }, [routeState]);

  const updatePickup = (pickup: Stop) => {
    setRouteState(prev => ({ ...prev, pickup }));
  };

  const updateStops = (stops: Stop[]) => {
    setRouteState(prev => ({ ...prev, stops }));
  };

  const updatePriority = (priority: string) => {
    setRouteState(prev => ({ ...prev, priority }));
  };

  const updateVehicle = (vehicle: string) => {
    setRouteState(prev => ({ ...prev, vehicle }));
  };

  const updateNearbyStops = (nearbyStops: Stop[]) => {
    setRouteState(prev => ({ ...prev, nearbyStops }));
  };

  const updateRouteResult = (routeResult: OptimizedRoute | null) => {
    setRouteState(prev => ({ ...prev, routeResult }));
  };

  const updateStatusMessage = (message: string) => {
    setRouteState(prev => ({ ...prev, statusMessage: message }));
  };

  const resetRoute = () => {
    setRouteState(initialState);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: RouteContextType = {
    routeState,
    updatePickup,
    updateStops,
    updatePriority,
    updateVehicle,
    updateNearbyStops,
    updateRouteResult,
    updateStatusMessage,
    resetRoute,
  };

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
};

export const useRoute = () => {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error("useRoute must be used within a RouteProvider");
  }
  return context;
};