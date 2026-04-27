import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import ChatAssistant from "./ChatAssistant";

type AppShellProps = {
  children: ReactNode;
};

const AppShell = ({ children }: AppShellProps) => (
  <div className="min-h-screen flex bg-background text-foreground">
    <aside className="fixed left-0 top-0 h-screen w-72 shrink-0 border-r border-border bg-card p-6 overflow-y-auto z-10">
      <Sidebar />
    </aside>
    <main className="flex-1 ml-72 overflow-auto p-4 md:p-6">
      {children}
    </main>
    <ChatAssistant />
  </div>
);

export default AppShell;
