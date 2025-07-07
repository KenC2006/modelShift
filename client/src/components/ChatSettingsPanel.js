import React from "react";
import { useChatSettings } from "../contexts/ChatSettingsContext";
import {
  X,
  Palette,
  Monitor,
  Type,
  MessageSquare,
  Eye,
  Volume2,
  Zap,
  Settings,
} from "lucide-react";

const ChatSettingsPanel = ({ isOpen, onClose }) => {
  const { settings, updateMultipleSettings } = useChatSettings();

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    updateMultipleSettings({ [key]: value });
  };

  const colorSchemes = [
    { value: "blue", label: "Blue", color: "#3b82f6" },
    { value: "purple", label: "Purple", color: "#a855f7" },
    { value: "green", label: "Green", color: "#22c55e" },
    { value: "orange", label: "Orange", color: "#f97316" },
    { value: "pink", label: "Pink", color: "#ec4899" },
    { value: "gray", label: "Gray", color: "#6b7280" },
  ];

  const themes = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "auto", label: "Auto" },
  ];

  const fontSizes = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ];

  const bubbleStyles = [
    { value: "rounded", label: "Rounded" },
    { value: "sharp", label: "Sharp" },
    { value: "minimal", label: "Minimal" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Chat Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-primary-600" />
              Settings
            </h3>

            {/* Color Scheme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Scheme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {colorSchemes.map((scheme) => (
                  <button
                    key={scheme.value}
                    onClick={() => handleChange("colorScheme", scheme.value)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      settings.colorScheme === scheme.value
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: scheme.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {scheme.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => handleChange("theme", theme.value)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      settings.theme === theme.value
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Monitor className="h-5 w-5 mx-auto mb-2 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {theme.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <div className="grid grid-cols-3 gap-3">
                {fontSizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => handleChange("fontSize", size.value)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      settings.fontSize === size.value
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Type className="h-5 w-5 mx-auto mb-2 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {size.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Display */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Eye className="h-5 w-5 mr-2 text-primary-600" />
              Display
            </h3>

            {/* Message Bubble Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Bubble Style
              </label>
              <div className="grid grid-cols-3 gap-3">
                {bubbleStyles.map((style) => (
                  <button
                    key={style.value}
                    onClick={() =>
                      handleChange("messageBubbleStyle", style.value)
                    }
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      settings.messageBubbleStyle === style.value
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <MessageSquare className="h-5 w-5 mx-auto mb-2 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {style.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Settings */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showAvatars}
                  onChange={(e) =>
                    handleChange("showAvatars", e.target.checked)
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">Show avatars</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showTimestamps}
                  onChange={(e) =>
                    handleChange("showTimestamps", e.target.checked)
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Show timestamps
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showMetadata}
                  onChange={(e) =>
                    handleChange("showMetadata", e.target.checked)
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Show message metadata
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showMessageActions}
                  onChange={(e) =>
                    handleChange("showMessageActions", e.target.checked)
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Show message actions
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showWelcomeMessage}
                  onChange={(e) =>
                    handleChange("showWelcomeMessage", e.target.checked)
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Show welcome message
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) =>
                    handleChange("compactMode", e.target.checked)
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">Compact mode</span>
              </label>
            </div>
          </div>

          {/* Input */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-primary-600" />
              Input
            </h3>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enterToSend}
                  onChange={(e) =>
                    handleChange("enterToSend", e.target.checked)
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Enter to send message
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.shiftEnterToNewLine}
                  onChange={(e) =>
                    handleChange("shiftEnterToNewLine", e.target.checked)
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Shift+Enter for new line
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoResize}
                  onChange={(e) => handleChange("autoResize", e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Auto-resize input field
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Placeholder Text
                </label>
                <input
                  type="text"
                  value={settings.placeholderText}
                  onChange={(e) =>
                    handleChange("placeholderText", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Type your message..."
                />
              </div>
            </div>
          </div>

          {/* AI Behavior */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-primary-600" />
              AI Behavior
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Prompt
                </label>
                <textarea
                  value={settings.systemPrompt}
                  onChange={(e) => handleChange("systemPrompt", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="You are a helpful AI assistant..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {settings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) =>
                    handleChange("temperature", parseFloat(e.target.value))
                  }
                  className="w-full slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Focused</span>
                  <span>Balanced</span>
                  <span>Creative</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens: {settings.maxTokens}
                </label>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={settings.maxTokens}
                  onChange={(e) =>
                    handleChange("maxTokens", parseInt(e.target.value))
                  }
                  className="w-full slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Short</span>
                  <span>Medium</span>
                  <span>Long</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interface */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-primary-600" />
              Interface
            </h3>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.animations}
                  onChange={(e) => handleChange("animations", e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Enable animations
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoScroll}
                  onChange={(e) => handleChange("autoScroll", e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Auto-scroll to new messages
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.soundEffects}
                  onChange={(e) =>
                    handleChange("soundEffects", e.target.checked)
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Sound effects
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableMarkdown}
                  onChange={(e) =>
                    handleChange("enableMarkdown", e.target.checked)
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Enable markdown rendering
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSettingsPanel;
