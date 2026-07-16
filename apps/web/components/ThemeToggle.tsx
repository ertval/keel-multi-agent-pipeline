"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read the theme on mount
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    const currentTheme = savedTheme || "light";
    setTheme(currentTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) {
    // Render a skeleton button during SSR/hydration to prevent layout shift
    return (
      <Button
        variant="ghost"
        size="icon"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          opacity: 0.5,
        }}
      >
        <Sun size={16} />
      </Button>
    );
  }

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
