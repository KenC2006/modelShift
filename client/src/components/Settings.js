import React from "react";
import { useComparisonSettings } from "../contexts/ComparisonSettingsContext";
import { Palette, Eye, RotateCcw, Zap, HelpCircle } from "lucide-react";

// Toggle Switch Component
const ToggleSwitch = ({
  checked,
  onChange,
  label,
  className = "",
  description = "",
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-theme-text-secondary cursor-pointer">
          {label}
        </label>
        {description && (
          <div className="tooltip">
            <HelpCircle className="h-4 w-4 text-theme-text-muted hover:text-theme-text-tertiary cursor-help" />
            <div className="tooltip-content">{description}</div>
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`toggle-switch ${checked ? "checked" : ""}`}
      />
    </div>
  );
};

const Settings = () => {
  const { settings, updateSetting, resetSettings } = useComparisonSettings();

  return (
    <div className="max-w-6xl mx-auto space-y-6 bg-theme-bg-secondary min-h-screen p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-theme-text mb-2">Settings</h1>
        <p className="text-theme-text-secondary">
          Customize the look and feel of your AI comparison interface
        </p>
      </div>

      {/* Theme Settings */}
      <div className="card card-elevated">
        <h2 className="text-xl font-semibold text-theme-text mb-6 flex items-center">
          <Palette className="h-6 w-6 mr-3 text-primary-500" />
          Theme & Appearance
        </h2>

        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <label className="block text-sm font-medium text-theme-text-secondary">
                Theme
              </label>
              <div className="tooltip">
                <HelpCircle className="h-4 w-4 text-theme-text-muted hover:text-theme-text-tertiary cursor-help" />
                <div className="tooltip-content">
                  Choose between light, dark, or automatic theme based on system
                  preference
                </div>
              </div>
            </div>
            <select
              value={settings.theme}
              onChange={(e) => updateSetting("theme", e.target.value)}
              className="input-field"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <label className="block text-sm font-medium text-theme-text-secondary">
                Font Size
              </label>
              <div className="tooltip">
                <HelpCircle className="h-4 w-4 text-theme-text-muted hover:text-theme-text-tertiary cursor-help" />
                <div className="tooltip-content">
                  Adjust the text size throughout the application for better
                  readability
                </div>
              </div>
            </div>
            <select
              value={settings.fontSize}
              onChange={(e) => updateSetting("fontSize", e.target.value)}
              className="input-field"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <ToggleSwitch
            checked={settings.compactMode}
            onChange={(checked) => updateSetting("compactMode", checked)}
            label="Compact Mode"
            description="Reduce spacing and padding for a more condensed layout"
          />
        </div>
      </div>

      {/* Display Settings */}
      <div className="card card-elevated">
        <h2 className="text-xl font-semibold text-theme-text mb-6 flex items-center">
          <Eye className="h-6 w-6 mr-3 text-primary-500" />
          Display Options
        </h2>

        <div className="space-y-4">
          <ToggleSwitch
            checked={settings.showTimestamps}
            onChange={(checked) => updateSetting("showTimestamps", checked)}
            label="Show Timestamps"
            description="Display when messages were sent with clock icons"
          />

          <ToggleSwitch
            checked={settings.showProviderInfo}
            onChange={(checked) => updateSetting("showProviderInfo", checked)}
            label="Show Provider Info"
            description="Display AI provider names in message footers"
          />

          <ToggleSwitch
            checked={settings.showTokenCount}
            onChange={(checked) => updateSetting("showTokenCount", checked)}
            label="Show Token Count"
            description="Display token usage for each AI response"
          />

          <ToggleSwitch
            checked={settings.markdownRendering}
            onChange={(checked) => updateSetting("markdownRendering", checked)}
            label="Markdown Rendering"
            description="Render markdown formatting in AI responses (bold, italic, code, etc.)"
          />
        </div>
      </div>

      {/* AI Behavior Settings */}
      <div className="card card-elevated">
        <h2 className="text-xl font-semibold text-theme-text mb-6 flex items-center">
          <Zap className="h-6 w-6 mr-3 text-primary-500" />
          AI Behavior
        </h2>

        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <label className="block text-sm font-medium text-theme-text-secondary">
                System Prompt
              </label>
              <div className="tooltip">
                <HelpCircle className="h-4 w-4 text-theme-text-muted hover:text-theme-text-tertiary cursor-help" />
                <div className="tooltip-content">
                  Custom instruction sent to AI models before your message
                </div>
              </div>
            </div>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => updateSetting("systemPrompt", e.target.value)}
              rows={3}
              className="input-field"
              placeholder="Enter your system prompt..."
            />
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <label className="block text-sm font-medium text-theme-text-secondary">
                Temperature: {settings.temperature}
              </label>
              <div className="tooltip">
                <HelpCircle className="h-4 w-4 text-theme-text-muted hover:text-theme-text-tertiary cursor-help" />
                <div className="tooltip-content">
                  Control AI creativity: Lower = focused, Higher = creative
                </div>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.temperature}
              onChange={(e) =>
                updateSetting("temperature", parseFloat(e.target.value))
              }
              className="slider"
            />
            <div className="flex justify-between text-xs text-theme-text-muted mt-2">
              <span>Focused</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <label className="block text-sm font-medium text-theme-text-secondary">
                Max Tokens: {settings.maxTokens}
              </label>
              <div className="tooltip">
                <HelpCircle className="h-4 w-4 text-theme-text-muted hover:text-theme-text-tertiary cursor-help" />
                <div className="tooltip-content">
                  Maximum length of AI responses (affects cost and response
                  length)
                </div>
              </div>
            </div>
            <input
              type="range"
              min="100"
              max="4000"
              step="100"
              value={settings.maxTokens}
              onChange={(e) =>
                updateSetting("maxTokens", parseInt(e.target.value))
              }
              className="slider"
            />
            <div className="flex justify-between text-xs text-theme-text-muted mt-2">
              <span>100</span>
              <span>2000</span>
              <span>4000</span>
            </div>
          </div>
        </div>
      </div>

      {/* UI Preferences */}
      <div className="card card-elevated">
        <h2 className="text-xl font-semibold text-theme-text mb-6 flex items-center">
          <Eye className="h-6 w-6 mr-3 text-primary-500" />
          UI Preferences
        </h2>

        <div className="space-y-4">
          <ToggleSwitch
            checked={settings.showWelcomeMessage}
            onChange={(checked) => updateSetting("showWelcomeMessage", checked)}
            label="Show Welcome Message"
            description="Display helpful welcome screen for new users"
          />

          <ToggleSwitch
            checked={settings.animations}
            onChange={(checked) => updateSetting("animations", checked)}
            label="Animations"
            description="Enable smooth transitions and visual effects"
          />

          <ToggleSwitch
            checked={settings.autoScroll}
            onChange={(checked) => updateSetting("autoScroll", checked)}
            label="Auto Scroll"
            description="Automatically scroll to new messages when they arrive"
          />
        </div>
      </div>

      {/* Reset Button */}
      <div className="card card-elevated">
        <button onClick={resetSettings} className="btn btn-secondary w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default Settings;
