import { useEffect, useState } from "react";

// Light/dark theme. The choice is saved per browser; without one we follow the OS setting.
// public/index.html applies it before React loads so the page never flashes the wrong theme.
const KEY = "theme";

const systemTheme = () =>
  window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";

export function getTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch (e) {
    // storage blocked: fall through to the OS setting
  }
  return systemTheme();
}

export function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme !== "light");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#f6f7f3" : "#0b0b0c");
}

export function useTheme() {
  const [theme, setTheme] = useState(getTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Follow OS changes until the user picks a theme themselves.
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      let saved = null;
      try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
      if (!saved) setTheme(systemTheme());
    };
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange));
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
    setTheme(next);
  };

  return { theme, toggle };
}
