import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage/system preference after mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      setIsDark(saved === "true");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(isDark));
  }, [isDark, mounted]);

  const toggle = () => setIsDark((prev) => !prev);

  return { isDark, toggle };
}
