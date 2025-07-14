import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useComparisonSettings } from "../contexts/ComparisonSettingsContext";
import ComparisonResult from "./ComparisonResult";
import LoadingSpinner from "./LoadingSpinner";
import apiClient from "../config/api";
import toast from "react-hot-toast";
import {
  Send,
  RotateCcw,
  Settings,
  Download,
  GitCompare,
  Sparkles,
  Bot,
  AlertCircle,
  Paperclip,
  CheckSquare,
  Square,
} from "lucide-react";

const AIComparison = () => {
  const { userData, refreshUserData } = useAuth();
  const { settings } = useComparisonSettings();
  const [comparisons, setComparisons] = useState([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [showKeySelector, setShowKeySelector] = useState(false);
  const comparisonsEndRef = useRef(null);
  const textareaRef = useRef(null);
  const didAutoSelect = useRef(false);

  useEffect(() => {
    if (!userData?.apiKeys?.length) return;
    if (didAutoSelect.current) return;
    const activeKeys = userData.apiKeys.filter((key) => key.isActive);
    if (activeKeys.length > 0) {
      setSelectedKeys(activeKeys.slice(0, 3).map((key) => key.id));
    }
    didAutoSelect.current = true;
  }, [userData]);
  useEffect(() => {
    didAutoSelect.current = false;
  }, [userData]);

  const scrollToBottom = useCallback(() => {
    comparisonsEndRef.current?.scrollIntoView({
      behavior: settings.animations ? "smooth" : "auto",
    });
  }, [settings.animations]);

  const autoResizeTextarea = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    if (settings.autoScroll) {
      scrollToBottom();
    }
  }, [comparisons, settings.autoScroll, scrollToBottom]);

  useEffect(() => {
    autoResizeTextarea();
  }, [inputPrompt, autoResizeTextarea]);

  const handleSendPrompt = async () => {
    if (!inputPrompt.trim() || isLoading || selectedKeys.length === 0) return;

    const comparisonId = Date.now();
    const userPrompt = {
      id: comparisonId,
      content: inputPrompt,
      timestamp: new Date(),
    };

    setComparisons((prev) => [...prev, userPrompt]);
    setInputPrompt("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const requests = selectedKeys.map(async (keyId) => {
        try {
          const response = await apiClient.post("/api/chat", {
            message: inputPrompt,
            keyId: keyId,
            systemPrompt: settings.systemPrompt,
            temperature: settings.temperature,
          });

          return {
            keyId,
            success: true,
            data: response.data,
          };
        } catch (error) {
          return {
            keyId,
            success: false,
            error: error.response?.data?.message || error.message,
          };
        }
      });

      const results = await Promise.all(requests);

      const comparisonResults = results.map((result) => {
        const key = userData.apiKeys.find((k) => k.id === result.keyId);
        return {
          id: `${comparisonId}-${result.keyId}`,
          comparisonId,
          content: result.success ? result.data.response : result.error,
          success: result.success,
          timestamp: new Date(),
          metadata: result.success
            ? {
                provider: result.data.provider,
                model: result.data.model,
                keyName: result.data.keyName,
                tokensUsed: result.data.tokensUsed,
              }
            : {
                provider: key?.provider,
                model: key?.model,
                keyName: key?.name,
              },
        };
      });

      setComparisons((prev) => [...prev, ...comparisonResults]);
      await refreshUserData();
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 400) {
        toast.error("Invalid request. Please check your prompt and try again.");
      } else if (error.response?.status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else if (error.response?.status === 500) {
        toast.error("AI service error. Please try again later.");
      } else if (error.code === "NETWORK_ERROR") {
        toast.error(
          "Network error. Please check your connection and try again."
        );
      } else {
        toast.error("Failed to send prompt to AIs. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const clearComparisons = () => {
    if (comparisons.length > 0) {
      if (window.confirm("Are you sure you want to clear all comparisons?")) {
        setComparisons([]);
        toast.success("Comparisons cleared");
      }
    }
  };

  const exportComparisons = () => {
    const comparisonData = {
      comparisons: comparisons.map((comp) => ({
        content: comp.content,
        timestamp: comp.timestamp,
        metadata: comp.metadata,
        success: comp.success,
      })),
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(comparisonData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-comparison-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Comparisons exported successfully");
  };

  const toggleKeySelection = (keyId) => {
    setSelectedKeys((prev) => {
      if (prev.includes(keyId)) {
        return prev.filter((id) => id !== keyId);
      } else {
        return [...prev, keyId];
      }
    });
  };

  const selectAllKeys = () => {
    const activeKeys = userData.apiKeys.filter((key) => key.isActive);
    setSelectedKeys(activeKeys.map((key) => key.id));
  };

  const deselectAllKeys = () => {
    setSelectedKeys([]);
  };

  if (!userData?.apiKeys?.length) {
    return (
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 dark:from-blue-600 dark:to-purple-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Bot className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-theme-text mb-4">
          Welcome to AI Comparison
        </h2>
        <p className="text-lg text-theme-text-secondary mb-8 leading-relaxed">
          Compare multiple AI models side by side to see how they respond to the
          same prompts.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => (window.location.href = "/api-manager")}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center justify-center"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Get Started
          </button>
          <p className="text-sm text-theme-text-tertiary">
            You'll need to add API keys first
          </p>
        </div>
      </div>
    );
  }

  const activeKeys = userData.apiKeys.filter((key) => key.isActive);
  if (activeKeys.length === 0) {
    return (
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 dark:from-orange-600 dark:to-red-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <AlertCircle className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-theme-text mb-4">
          No Active API Keys
        </h2>
        <p className="text-lg text-theme-text-secondary mb-8 leading-relaxed">
          You have API keys but none are active. Activate at least one to start
          comparing AI models.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => (window.location.href = "/api-manager")}
            className="w-full bg-warning-500 hover:bg-warning-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center justify-center"
          >
            <Settings className="h-5 w-5 mr-2" />
            Manage Keys
          </button>
          <p className="text-sm text-theme-text-tertiary">
            Go to API Manager to activate your keys
          </p>
        </div>
      </div>
    );
  }

  const groupedComparisons = comparisons.reduce((groups, comp) => {
    if (comp.comparisonId) {
      if (!groups[comp.comparisonId]) {
        groups[comp.comparisonId] = [];
      }
      groups[comp.comparisonId].push(comp);
    } else {
      if (!groups[comp.id]) {
        groups[comp.id] = [];
      }
      groups[comp.id].unshift(comp);
    }
    return groups;
  }, {});

  return (
    <div
      className={`flex-1 flex flex-col h-full ${
        settings.compactMode ? "compact-mode" : ""
      }`}
    >
      <div className="bg-theme-surface border-b border-theme-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-theme-text flex items-center">
              <GitCompare className="h-5 w-5 mr-2" />
              AI Comparison
            </h1>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowKeySelector(!showKeySelector)}
                className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 font-medium
                  ${
                    showKeySelector
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md"
                      : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 shadow-sm"
                  }
                `}
              >
                {selectedKeys.length} AI{selectedKeys.length !== 1 ? "s" : ""}{" "}
                selected
              </button>

              {showKeySelector && (
                <div className="absolute top-16 left-6 bg-theme-surface border border-theme-border rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-theme-text">
                      Select AI Models
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={selectAllKeys}
                        className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllKeys}
                        className="text-xs px-2 py-1 bg-theme-bg-secondary text-theme-text-secondary rounded hover:bg-theme-bg-tertiary"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activeKeys.map((key) => (
                      <label
                        key={key.id}
                        className="flex items-center space-x-3 p-2 hover:bg-theme-bg-tertiary rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedKeys.includes(key.id)}
                          onChange={() => toggleKeySelection(key.id)}
                          className="sr-only"
                        />
                        {selectedKeys.includes(key.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary-600" />
                        ) : (
                          <Square className="h-4 w-4 text-theme-text-tertiary" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-theme-text text-sm">
                            {key.name}
                          </div>
                          <div className="text-xs text-theme-text-secondary">
                            {key.provider} • {key.model}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportComparisons}
              className="p-2 text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-tertiary rounded-lg transition-colors"
              title="Export comparisons"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={clearComparisons}
              className="p-2 text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-tertiary rounded-lg transition-colors"
              title="Clear comparisons"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {settings.showWelcomeMessage && comparisons.length === 0 && (
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <GitCompare className="h-10 w-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-theme-text mb-2">
              Compare AI Models Side by Side
            </h2>
            <p className="text-theme-text-secondary">
              Send the same prompt to multiple AI models and see how they
              respond differently.
            </p>
          </div>
        )}

        {Object.entries(groupedComparisons).map(([comparisonId, comps]) => (
          <div key={comparisonId} className="space-y-4">
            {comps.find((c) => !c.comparisonId) && (
              <div className="bg-theme-surface border border-theme-border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-theme-text">
                    Your Prompt
                  </span>
                  {settings.showTimestamps && (
                    <span className="text-xs text-theme-text-secondary">
                      {new Date(
                        comps.find((c) => !c.comparisonId).timestamp
                      ).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p className="text-theme-text">
                  {comps.find((c) => !c.comparisonId).content}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comps
                .filter((c) => c.comparisonId)
                .map((result) => (
                  <ComparisonResult key={result.id} result={result} />
                ))}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center justify-center space-x-3 text-theme-text-muted py-8">
            <LoadingSpinner />
            <span>Comparing AI responses...</span>
          </div>
        )}
        <div ref={comparisonsEndRef} />
      </div>

      <div className="bg-theme-surface border-t border-theme-border p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-theme-bg-secondary rounded-2xl p-4 shadow-sm border border-theme-border">
            <div className="flex items-center space-x-3">
              <button
                className="h-12 w-12 text-theme-text-muted hover:text-theme-text hover:bg-theme-surface rounded-xl transition-all duration-200 shadow-sm border border-theme-border hover:shadow-md flex-shrink-0 flex items-center justify-center"
                title="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your prompt to compare AI responses..."
                  className="input-field resize-none"
                  rows={1}
                  disabled={isLoading || selectedKeys.length === 0}
                  style={{ minHeight: "48px", maxHeight: "200px" }}
                />
              </div>

              <button
                onClick={handleSendPrompt}
                disabled={
                  !inputPrompt.trim() || isLoading || selectedKeys.length === 0
                }
                className="h-12 w-12 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm flex-shrink-0 flex items-center justify-center"
                title="Send prompt to selected AIs"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showKeySelector && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowKeySelector(false)}
        />
      )}
    </div>
  );
};

export default AIComparison;
