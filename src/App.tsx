import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RouteProvider } from "@/contexts/RouteContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AppShell from "@/components/AppShell";
import Dashboard from "./pages/Dashboard.tsx";
import RoutesPage from "./pages/Routes.tsx";
import Fleet from "./pages/Fleet.tsx";
import Analytics from "./pages/Analytics.tsx";
import NearbyStops from "./pages/NearbyStops.tsx";
import History from "./pages/History.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <RouteProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppShell>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/routes" element={<RoutesPage />} />
                <Route path="/fleet" element={<Fleet />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/nearby" element={<NearbyStops />} />
                <Route path="/history" element={<History />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
        </TooltipProvider>
      </RouteProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
