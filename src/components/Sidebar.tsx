import { NavLink, Link } from "react-router-dom";
import { LayoutDashboard, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },

];

const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <Link to="/dashboard" onClick={onClose} className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer mb-2">
          <img src="/logo.svg" alt="SmartRoute AI Logo" className="w-9 h-9 rounded-xl shadow-sm" />
          <p className="text-2xl font-bold text-foreground">SmartRoute AI</p>
        </Link>
        <p className="text-sm text-muted-foreground">Delivery route optimization</p>
      </div>
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
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
