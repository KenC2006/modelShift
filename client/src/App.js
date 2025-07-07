import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import {
  useComparisonSettings,
  ComparisonSettingsProvider,
} from "./contexts/ComparisonSettingsContext";
import Login from "./components/Login";
import AIComparison from "./components/AIComparison";
import KeyManager from "./components/KeyManager";
import Settings from "./components/Settings";
import Layout from "./components/Layout";
import LoadingSpinner from "./components/LoadingSpinner";

function AppContent() {
  const { currentUser, loading } = useAuth();
  const { settings } = useComparisonSettings();

  // Apply theme settings
  useEffect(() => {
    // Apply theme
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else if (settings.theme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else if (settings.theme === "auto") {
      // Auto theme based on system preference
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      if (mediaQuery.matches) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    }

    // Apply font size
    document.body.className = document.body.className.replace(
      /font-size-\w+/g,
      ""
    );
    document.body.classList.add(`font-size-${settings.fontSize}`);

    // Apply animations
    if (!settings.animations) {
      document.documentElement.style.setProperty("--transition-fast", "0ms");
      document.documentElement.style.setProperty("--transition-normal", "0ms");
      document.documentElement.style.setProperty("--transition-slow", "0ms");
    } else {
      document.documentElement.style.removeProperty("--transition-fast");
      document.documentElement.style.removeProperty("--transition-normal");
      document.documentElement.style.removeProperty("--transition-slow");
    }

    // Apply compact mode
    if (settings.compactMode) {
      document.body.classList.add("compact-mode");
    } else {
      document.body.classList.remove("compact-mode");
    }
  }, [
    settings.theme,
    settings.fontSize,
    settings.animations,
    settings.compactMode,
  ]);

  // Listen for system theme changes when auto theme is enabled
  useEffect(() => {
    if (settings.theme !== "auto") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [settings.theme]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text">
      <Routes>
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/"
          element={
            currentUser ? (
              <Layout>
                <AIComparison />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/api-manager"
          element={
            currentUser ? (
              <Layout>
                <KeyManager />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/settings"
          element={
            currentUser ? (
              <Layout>
                <Settings />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ComparisonSettingsProvider>
      <AppContent />
    </ComparisonSettingsProvider>
  );
}

export default App;
