"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "darkMode";

function getSystemPreference() {
  if (typeof window === "undefined") {
    return true;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)");

  if (prefersDark.matches) {
    return true;
  }

  if (prefersLight.matches) {
    return false;
  }

  return true;
}

function readStoredPreference() {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === null) {
    return null;
  }

  try {
    return JSON.parse(stored) as boolean;
  } catch {
    return null;
  }
}

function applyTheme(isDarkMode: boolean) {
  document.documentElement.setAttribute(
    "data-theme",
    isDarkMode ? "dark" : "light",
  );
}

export function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document !== "undefined") {
      const theme = document.documentElement.getAttribute("data-theme");
      if (theme === "dark") {
        return true;
      }
      if (theme === "light") {
        return false;
      }
    }

    const storedPreference = readStoredPreference();
    return storedPreference === null ? getSystemPreference() : storedPreference;
  });

  useEffect(() => {
    const storedPreference = readStoredPreference();
    const currentPreference =
      storedPreference === null ? getSystemPreference() : storedPreference;

    applyTheme(currentPreference);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = () => {
      if (readStoredPreference() !== null) {
        return;
      }

      const nextPreference = getSystemPreference();
      setIsDarkMode(nextPreference);
      applyTheme(nextPreference);
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  function toggleDarkMode() {
    setIsDarkMode((currentValue) => {
      const nextValue = !currentValue;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextValue));
      applyTheme(nextValue);
      return nextValue;
    });
  }

  return (
    <button
      type="button"
      className="dark-mode-toggle"
      onClick={toggleDarkMode}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="toggle-track">
        <span className="toggle-icon sun" aria-hidden="true">
          ☀️
        </span>
        <span className="toggle-icon moon" aria-hidden="true">
          🌙
        </span>
        <span
          className={`toggle-thumb ${isDarkMode ? "dark" : "light"}`}
          suppressHydrationWarning
          aria-hidden="true"
        />
      </span>
    </button>
  );
}
