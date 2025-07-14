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

  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }

    document.body.className = document.body.className.replace(
      /text-size-\w+/g,
      ""
    );
    document.body.classList.add(`text-size-${settings.fontSize}`);

    if (!settings.animations) {
      document.documentElement.style.setProperty("--transition-fast", "0ms");
      document.documentElement.style.setProperty("--transition-normal", "0ms");
      document.documentElement.style.setProperty("--transition-slow", "0ms");
    } else {
      document.documentElement.style.removeProperty("--transition-fast");
      document.documentElement.style.removeProperty("--transition-normal");
      document.documentElement.style.removeProperty("--transition-slow");
    }

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
