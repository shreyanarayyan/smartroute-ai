import { ReactNode, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ChatAssistant from "./ChatAssistant";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { useLocation } from "react-router-dom";

type AppShellProps = {
  children: ReactNode;
};

const AppShell = ({ children }: AppShellProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu automatically when the route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card z-50 flex items-center justify-between px-4 shadow-sm">
        <span className="font-bold text-xl tracking-tight">SmartRoute AI</span>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Overlay for mobile when menu is open */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-all"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless toggled, visible fixed on md+ */}
      <aside className={`
        fixed left-0 top-0 h-screen w-72 shrink-0 border-r border-border bg-card p-6 overflow-y-auto z-50 transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        md:translate-x-0 md:shadow-none
      `}>
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
      </aside>

      {/* Main Content - add top padding for mobile header, margin left on md+ */}
      <main className="flex-1 overflow-auto p-4 pt-20 md:p-6 md:pt-6 md:ml-72 w-full transition-all duration-300">
        {children}
      </main>

      <ChatAssistant />
    </div>
  );
};

export default AppShell;
