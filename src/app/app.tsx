import { Outlet } from "react-router-dom";
import { AppHeader } from "@/features/header";

export function App() {
  return (
    <div className="min-h-screen flex flex-col font-brand">
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
