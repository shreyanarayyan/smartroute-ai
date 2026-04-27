import { NavLink } from "react-router-dom";
import { LayoutDashboard, Route, Truck, BarChart3, MapPin, Clock, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Routes", icon: Route, path: "/routes" },
  { label: "Fleet", icon: Truck, path: "/fleet" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Nearby Stops", icon: MapPin, path: "/nearby" },
  { label: "History", icon: Clock, path: "/history" },
];

const Sidebar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <p className="text-2xl font-bold">SmartRoute AI</p>
        <p className="mt-1 text-sm text-muted-foreground">Delivery route optimization</p>
      </div>
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-border">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary transition w-full text-left"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
