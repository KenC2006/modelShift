import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useComparisonSettings } from "../contexts/ComparisonSettingsContext";
import ComparisonResult from "./ComparisonResult";
import KeySelector from "./KeySelector";

import LoadingSpinner from "./LoadingSpinner";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Send,
  RotateCcw,
  Settings,
  Download,
  Upload,
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

  useEffect(() => {
    if (userData?.apiKeys?.length > 0 && selectedKeys.length === 0) {
      const activeKeys = userData.apiKeys.filter((key) => key.isActive);
      if (activeKeys.length > 0) {
        // Select first 3 active keys by default
        setSelectedKeys(activeKeys.slice(0, 3).map((key) => key.id));
      }
    }
  }, [userData, selectedKeys.length]);

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

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      console.log("Sending prompt to multiple AIs:", {
        prompt: inputPrompt,
        keyIds: selectedKeys,
        systemPrompt: settings.systemPrompt,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      });

      // Send requests to all selected AIs in parallel
      const requests = selectedKeys.map(async (keyId) => {
        try {
          const response = await axios.post("/api/chat", {
            message: inputPrompt,
            keyId: keyId,
            systemPrompt: settings.systemPrompt,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
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

      // Create comparison results
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
      console.error("Error sending prompt:", error);
      toast.error("Failed to send prompt to AIs");
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

  const importComparisons = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const comparisonData = JSON.parse(e.target.result);
        if (
          comparisonData.comparisons &&
          Array.isArray(comparisonData.comparisons)
        ) {
          setComparisons(comparisonData.comparisons);
          toast.success("Comparisons imported successfully");
        } else {
          toast.error("Invalid comparison file format");
        }
      } catch (error) {
        toast.error("Failed to import comparison file");
      }
    };
    reader.readAsText(file);
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
        <h2 className="text-3xl font-bold text-black dark:text-white mb-4">
          Welcome to AI Comparison
        </h2>
        <p className="text-lg text-black dark:text-gray-300 mb-8 leading-relaxed">
          Compare multiple AI models side by side to see how they respond to the
          same prompts.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => (window.location.href = "/api-manager")}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center justify-center"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Get Started
          </button>
          <p className="text-sm text-gray-700 dark:text-gray-500">
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
        <h2 className="text-3xl font-bold text-black dark:text-white mb-4">
          No Active API Keys
        </h2>
        <p className="text-lg text-black dark:text-gray-300 mb-8 leading-relaxed">
          You have API keys but none are active. Activate at least one to start
          comparing AI models.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => (window.location.href = "/api-manager")}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center justify-center"
          >
            <Settings className="h-5 w-5 mr-2" />
            Manage Keys
          </button>
          <p className="text-sm text-gray-700 dark:text-gray-500">
            Go to API Manager to activate your keys
          </p>
        </div>
      </div>
    );
  }

  // Group comparisons by comparison ID
  const groupedComparisons = comparisons.reduce((groups, comp) => {
    if (comp.comparisonId) {
      if (!groups[comp.comparisonId]) {
        groups[comp.comparisonId] = [];
      }
      groups[comp.comparisonId].push(comp);
    } else {
      // This is a user prompt
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <GitCompare className="h-5 w-5 mr-2" />
              AI Comparison
            </h1>

            {/* Key Selection */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowKeySelector(!showKeySelector)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {selectedKeys.length} AI{selectedKeys.length !== 1 ? "s" : ""}{" "}
                selected
              </button>

              {showKeySelector && (
                <div className="absolute top-16 left-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Select AI Models</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={selectAllKeys}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllKeys}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activeKeys.map((key) => (
                      <label
                        key={key.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedKeys.includes(key.id)}
                          onChange={() => toggleKeySelection(key.id)}
                          className="sr-only"
                        />
                        {selectedKeys.includes(key.id) ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{key.name}</div>
                          <div className="text-xs text-gray-500">
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
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export comparisons"
            >
              <Download className="h-4 w-4" />
            </button>
            <label className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
              <Upload className="h-4 w-4" />
              <input
                type="file"
                accept=".json"
                onChange={importComparisons}
                className="hidden"
              />
            </label>
            <button
              onClick={clearComparisons}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear comparisons"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Comparisons */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {settings.showWelcomeMessage && comparisons.length === 0 && (
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <GitCompare className="h-10 w-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Compare AI Models Side by Side
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Send the same prompt to multiple AI models and see how they
              respond differently.
            </p>
          </div>
        )}

        {Object.entries(groupedComparisons).map(([comparisonId, comps]) => (
          <div key={comparisonId} className="space-y-4">
            {/* User Prompt */}
            {comps.find((c) => !c.comparisonId) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    Your Prompt
                  </span>
                  {settings.showTimestamps && (
                    <span className="text-xs text-blue-700">
                      {new Date(
                        comps.find((c) => !c.comparisonId).timestamp
                      ).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p className="text-blue-800">
                  {comps.find((c) => !c.comparisonId).content}
                </p>
              </div>
            )}

            {/* AI Responses */}
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
          <div className="flex items-center justify-center space-x-3 text-gray-500 py-8">
            <LoadingSpinner />
            <span>Comparing AI responses...</span>
          </div>
        )}
        <div ref={comparisonsEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              {/* File Upload */}
              <button
                className="h-12 w-12 text-gray-500 hover:text-gray-700 hover:bg-white rounded-xl transition-all duration-200 shadow-sm border border-gray-200 hover:shadow-md flex-shrink-0 flex items-center justify-center"
                title="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              {/* Text Input */}
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

              {/* Send Button */}
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

      {/* Click outside to close dropdowns */}
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
