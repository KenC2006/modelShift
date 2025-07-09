import React, { createContext, useContext, useState, useEffect } from "react";

const ChatSettingsContext = createContext();

export function useChatSettings() {
  return useContext(ChatSettingsContext);
}

export function ChatSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    theme: "light",
    colorScheme: "blue",

    messageBubbleStyle: "rounded",
    fontSize: "medium",
    compactMode: false,
    showTimestamps: true,
    showAvatars: true,
    showMetadata: true,
    showMessageActions: true,

    autoResize: true,
    placeholderText: "Type your message...",
    enterToSend: true,
    shiftEnterToNewLine: true,

    systemPrompt:
      "You are a helpful AI assistant. Provide clear, accurate, and helpful responses.",
    temperature: 0.7,

    showWelcomeMessage: true,
    animations: true,
    soundEffects: false,
    autoScroll: true,
    enableMarkdown: true,
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem("chatSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (error) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chatSettings", JSON.stringify(settings));
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
      colorScheme: "blue",
      messageBubbleStyle: "rounded",
      fontSize: "medium",
      compactMode: false,
      showTimestamps: true,
      showAvatars: true,
      showMetadata: true,
      showMessageActions: true,
      autoResize: true,
      placeholderText: "Type your message...",
      enterToSend: true,
      shiftEnterToNewLine: true,
      systemPrompt:
        "You are a helpful AI assistant. Provide clear, accurate, and helpful responses.",
      temperature: 0.7,
      showWelcomeMessage: true,
      animations: true,
      soundEffects: false,
      autoScroll: true,
      enableMarkdown: true,
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
    <ChatSettingsContext.Provider value={value}>
      {children}
    </ChatSettingsContext.Provider>
  );
}
