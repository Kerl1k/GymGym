import { Outlet } from "react-router-dom";
import { AppHeader } from "@/features/header";
import { useState, useEffect } from "react";
import { Loader } from "@/shared/ui/kit/loader";

export function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    // Simulate initial loading (in real app, this would be based on actual loading state)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col font-brand transition-colors duration-300 relative">
      <AppHeader darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="flex-1 bg-background text-foreground">
        <Outlet />
      </main>

      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader size="large" />
        </div>
      )}
    </div>
  );
}
