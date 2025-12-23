import { Outlet } from "react-router-dom";
import { AppHeader } from "@/features/header";
import { useState, useEffect } from "react";

export function App() {
  const [darkMode, setDarkMode] = useState(false);

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
    <div className="min-h-screen flex flex-col font-brand transition-colors duration-300">
      <AppHeader darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="flex-1 bg-background text-foreground">
        <Outlet />
      </main>
    </div>
  );
}
