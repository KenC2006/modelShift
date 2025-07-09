import React, { createContext, useContext, useState, useEffect } from "react";

const ComparisonSettingsContext = createContext();

export function useComparisonSettings() {
  return useContext(ComparisonSettingsContext);
}

export function ComparisonSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    theme: "light",

    fontSize: "medium",
    compactMode: false,
    showTimestamps: true,
    showProviderInfo: true,
    showTokenCount: true,
    showMessageActions: true,

    systemPrompt:
      "You are a helpful AI assistant. Provide clear, accurate, and helpful responses.",
    temperature: 0.7,

    showWelcomeMessage: true,
    animations: true,
    autoScroll: true,
    markdownRendering: true,

    defaultMaxComparisons: 3,
    showResponseTime: true,
    highlightDifferences: false,
    autoExpandResponses: false,
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem("comparisonSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (error) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("comparisonSettings", JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateMultipleSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    const defaultSettings = {
      theme: "light",
      fontSize: "medium",
      compactMode: false,
      showTimestamps: true,
      showProviderInfo: true,
      showTokenCount: true,
      showMessageActions: true,
      systemPrompt:
        "You are a helpful AI assistant. Provide clear, accurate, and helpful responses.",
      temperature: 0.7,
      showWelcomeMessage: true,
      animations: true,
      autoScroll: true,
      markdownRendering: true,
      defaultMaxComparisons: 3,
      showResponseTime: true,
      highlightDifferences: false,
      autoExpandResponses: false,
    };
    setSettings(defaultSettings);
  };

  const value = {
    settings,
    updateSetting,
    updateMultipleSettings,
    resetSettings,
  };

  return (
    <ComparisonSettingsContext.Provider value={value}>
      {children}
    </ComparisonSettingsContext.Provider>
  );
}
