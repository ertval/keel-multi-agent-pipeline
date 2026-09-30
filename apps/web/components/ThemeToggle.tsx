"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

// `public/theme-init.js` runs before hydration and owns the `dark` class on
// <html>, so the class — not React state — is the source of truth for the theme.
const THEME_EVENT = "keel:themechange";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function getSnapshot(): "dark" | "light" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): "dark" | "light" {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div style={{ position: "relative", width: 16, height: 16 }}>
        <Sun
          size={16}
          style={{
            position: "absolute",
            inset: 0,
            transform: theme === "light" ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0)",
            opacity: theme === "light" ? 1 : 0,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            color: "var(--foreground)",
          }}
        />
        <Moon
          size={16}
          style={{
            position: "absolute",
            inset: 0,
            transform: theme === "dark" ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0)",
            opacity: theme === "dark" ? 1 : 0,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            color: "var(--foreground)",
          }}
        />
      </div>
    </Button>
  );
}
