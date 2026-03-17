import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";

const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
