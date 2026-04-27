const fetchJson = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }

  return response.json();
};

export const optimizeRoute = (payload: unknown) =>
  fetchJson("/api/optimize-route", { method: "POST", body: JSON.stringify(payload) });

export const getSavedRoutes = () => fetchJson("/api/routes");
export const saveRoute = (route: unknown) =>
  fetchJson("/api/routes", { method: "POST", body: JSON.stringify(route) });
export const updateRoute = (id: string, route: unknown) =>
  fetchJson(`/api/routes/${id}`, { method: "PUT", body: JSON.stringify(route) });
export const deleteRoute = (id: string) => fetchJson(`/api/routes/${id}`, { method: "DELETE" });

export const getFleet = () => fetchJson("/api/fleet");
export const addVehicle = (vehicle: unknown) =>
  fetchJson("/api/fleet", { method: "POST", body: JSON.stringify(vehicle) });
export const updateVehicle = (id: string, vehicle: unknown) =>
  fetchJson(`/api/fleet/${id}`, { method: "PUT", body: JSON.stringify(vehicle) });
export const deleteVehicle = (id: string) => fetchJson(`/api/fleet/${id}`, { method: "DELETE" });

export const getNearbyStops = (lat: number, lng: number) =>
  fetchJson(`/api/nearby?lat=${lat}&lng=${lng}`);
export const importNearbyStop = (stop: unknown) =>
  fetchJson("/api/nearby/import", { method: "POST", body: JSON.stringify(stop) });

export const getHistory = () => fetchJson("/api/history");
export const saveHistory = (entry: unknown) =>
  fetchJson("/api/history", { method: "POST", body: JSON.stringify(entry) });

export const getAnalytics = () => fetchJson("/api/analytics");
export const getPredictionInsights = () => fetchJson("/api/analytics/prediction-insights");
