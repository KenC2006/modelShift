import React, { createContext, useContext, useState, useEffect } from "react";

const ComparisonSettingsContext = createContext();

export function useComparisonSettings() {
  return useContext(ComparisonSettingsContext);
}

export function ComparisonSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    // Theme settings
    theme: "light", // light, dark, auto

    // Comparison appearance
    fontSize: "medium", // small, medium, large
    compactMode: false,
    showTimestamps: true,
    showProviderInfo: true,
    showTokenCount: true,
    showMessageActions: true,

    // AI behavior
    systemPrompt:
      "You are a helpful AI assistant. Provide clear, accurate, and helpful responses.",
    temperature: 0.7,
    maxTokens: 1000,

    // UI preferences
    showWelcomeMessage: true,
    animations: true,
    autoScroll: true,
    markdownRendering: true,

    // Comparison specific settings
    defaultMaxComparisons: 3,
    showResponseTime: true,
    highlightDifferences: false,
    autoExpandResponses: false,
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("comparisonSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Error loading comparison settings:", error);
      }
    }
  }, []);

  // Save settings to localStorage
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
      maxTokens: 1000,
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
