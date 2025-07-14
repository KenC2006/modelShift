import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Eye, EyeOff, Key, AlertTriangle } from "lucide-react";
import apiClient from "../config/api";
import toast from "react-hot-toast";
import { getDefaultRateLimit } from "../utils/defaultRateLimits";

const AddKeyModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    provider: "openai",
    model: "",
    rateLimits: {
      requestsPerMinute: "",
      requestsPerDay: "",
      tokensPerMinute: "",
      maxTokensPerRequest: "",
    },
  });
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customRequestsPerMinute, setCustomRequestsPerMinute] = useState("");
  const [customRequestsPerDay, setCustomRequestsPerDay] = useState("");
  const [customTokensPerMinute, setCustomTokensPerMinute] = useState("");
  const [customMaxTokensPerRequest, setCustomMaxTokensPerRequest] =
    useState("");
  const [showPricingWarning, setShowPricingWarning] = useState(false);

  const providers = [
    { value: "openai", label: "OpenAI", defaultModel: "gpt-4o" },
    {
      value: "gemini",
      label: "Google Gemini",
      defaultModel: "gemini-2.0-flash",
    },
    {
      value: "claude",
      label: "Anthropic Claude",
      defaultModel: "claude-3-5-sonnet-20241022",
    },
  ];

  const openaiModels = [
    {
      value: "gpt-4o",
      label: "GPT-4o",
      description: "Latest and most capable model, best for complex tasks",
    },
    {
      value: "gpt-4o-mini",
      label: "GPT-4o Mini",
      description: "Fast and efficient, great for most use cases",
    },
    {
      value: "gpt-4-turbo",
      label: "GPT-4 Turbo",
      description: "Previous generation, still very capable",
    },
    { value: "gpt-4", label: "GPT-4", description: "Classic GPT-4 model" },
    {
      value: "gpt-3.5-turbo",
      label: "GPT-3.5 Turbo",
      description: "Fast and cost-effective",
    },
    {
      value: "gpt-3.5-turbo-16k",
      label: "GPT-3.5 Turbo 16K",
      description: "Extended context window",
    },
  ];

  const geminiModels = [
    {
      value: "gemini-2.0-flash",
      label: "Gemini 2.0 Flash",
      description: "15 requests/min, 1500 requests/day",
    },
    {
      value: "gemini-2.0-flash-lite",
      label: "Gemini 2.0 Flash Lite",
      description: "30 requests/min, 1500 requests/day",
    },
    {
      value: "gemini-2.5-flash",
      label: "Gemini 2.5 Flash",
      description: "10 requests/min, 500 requests/day",
    },
  ];

  const claudeModels = [
    {
      value: "claude-3-5-sonnet-20241022",
      label: "Claude 3.5 Sonnet",
      description: "Latest and most capable Claude model",
    },
    {
      value: "claude-3-5-haiku-20241022",
      label: "Claude 3.5 Haiku",
      description: "Fast and efficient for most tasks",
    },
    {
      value: "claude-3-opus-20240229",
      label: "Claude 3 Opus",
      description: "Most powerful model for complex reasoning",
    },
    {
      value: "claude-3-sonnet-20240229",
      label: "Claude 3 Sonnet",
      description: "Balanced performance and speed",
    },
    {
      value: "claude-3-haiku-20240307",
      label: "Claude 3 Haiku",
      description: "Fastest model for simple tasks",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.key.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const currentProvider = providers.find(
      (p) => p.value === formData.provider
    );
    const modelToUse = formData.model || currentProvider?.defaultModel;

    // Prepare rate limits data
    const rateLimits = {};
    if (formData.rateLimits.requestsPerMinute === "custom") {
      rateLimits.requestsPerMinute = parseInt(customRequestsPerMinute);
    } else if (formData.rateLimits.requestsPerMinute === "unlimited") {
      rateLimits.requestsPerMinute = null;
    }

    if (formData.rateLimits.requestsPerDay === "custom") {
      rateLimits.requestsPerDay = parseInt(customRequestsPerDay);
    } else if (formData.rateLimits.requestsPerDay === "unlimited") {
      rateLimits.requestsPerDay = null;
    }

    if (formData.rateLimits.tokensPerMinute === "custom") {
      rateLimits.tokensPerMinute = parseInt(customTokensPerMinute);
    } else if (formData.rateLimits.tokensPerMinute === "unlimited") {
      rateLimits.tokensPerMinute = null;
    }

    if (formData.rateLimits.maxTokensPerRequest === "custom") {
      rateLimits.maxTokensPerRequest = parseInt(customMaxTokensPerRequest);
    } else if (formData.rateLimits.maxTokensPerRequest === "unlimited") {
      rateLimits.maxTokensPerRequest = null;
    }

    try {
      setLoading(true);
      await apiClient.post("/api/auth/api-keys", {
        name: formData.name.trim(),
        key: formData.key.trim(),
        provider: formData.provider,
        model: modelToUse,
        rateLimits: Object.keys(rateLimits).length > 0 ? rateLimits : undefined,
      });

      toast.success("API key added successfully");
      onSuccess();
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 400) {
        toast.error(
          "Invalid API key data. Please check your input and try again."
        );
      } else if (error.response?.status === 409) {
        toast.error(
          "An API key with this name already exists. Please choose a different name."
        );
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else if (error.code === "NETWORK_ERROR") {
        toast.error(
          "Network error. Please check your connection and try again."
        );
      } else {
        toast.error("Failed to add API key. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (provider) => {
    setFormData((prev) => ({
      ...prev,
      provider,
      model: providers.find((p) => p.value === provider)?.defaultModel || "",
      rateLimits: {
        requestsPerMinute: "",
        requestsPerDay: "",
        tokensPerMinute: "",
        maxTokensPerRequest: "",
      },
    }));
    setCustomRequestsPerMinute("");
    setCustomRequestsPerDay("");
    setCustomTokensPerMinute("");
    setCustomMaxTokensPerRequest("");
    setShowPricingWarning(false);
  };

  const getDropdownValue = (formValue) => {
    if (formValue === "unlimited") return "unlimited";
    if (formValue === "custom") return "custom";
    return "default";
  };

  const shouldShowCustomInput = (formValue) => {
    return formValue === "custom";
  };

  const handleRateLimitChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      rateLimits: {
        ...prev.rateLimits,
        [field]: value,
      },
    }));

    // Show pricing warning if any rate limit is set to custom or unlimited
    const hasCustomLimits = Object.values({
      ...formData.rateLimits,
      [field]: value,
    }).some((val) => val === "custom" || val === "unlimited");

    setShowPricingWarning(hasCustomLimits);
  };

  const getModelsForProvider = (provider) => {
    switch (provider) {
      case "openai":
        return openaiModels;
      case "gemini":
        return geminiModels;
      case "claude":
        return claudeModels;
      default:
        return [];
    }
  };

  const renderModelField = () => {
    const models = getModelsForProvider(formData.provider);

    if (models.length > 0) {
      const selectedModel = models.find((m) => m.value === formData.model);

      return (
        <div>
          <label
            htmlFor="model"
            className="block text-sm font-medium text-theme-text mb-1"
          >
            Model *
          </label>
          <select
            id="model"
            value={formData.model}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, model: e.target.value }))
            }
            className="input-field"
          >
            {models.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
          {selectedModel && (
            <p className="text-xs text-theme-text-muted mt-1">
              {selectedModel.description}
            </p>
          )}
        </div>
      );
    }

    return (
      <div>
        <label
          htmlFor="model"
          className="block text-sm font-medium text-theme-text mb-1"
        >
          Model
        </label>
        <input
          type="text"
          id="model"
          value={formData.model}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, model: e.target.value }))
          }
          className="input-field"
          placeholder="Enter model name"
          maxLength={50}
        />
        <p className="text-xs text-theme-text-muted mt-1">
          Leave empty to use the default model for the selected provider
        </p>
      </div>
    );
  };

  return createPortal(
    <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-theme-surface rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-theme-border">
          <h2 className="text-lg font-semibold text-theme-text">Add API Key</h2>
          <button
            onClick={onClose}
            className="text-theme-text-muted hover:text-theme-text-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-theme-text mb-1"
            >
              Key Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="input-field"
              placeholder="e.g., My OpenAI Key"
              maxLength={50}
            />
          </div>

          <div>
            <label
              htmlFor="provider"
              className="block text-sm font-medium text-theme-text mb-1"
            >
              Provider *
            </label>
            <select
              id="provider"
              value={formData.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="input-field"
            >
              {providers.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          {renderModelField()}

          <div>
            <label
              htmlFor="key"
              className="block text-sm font-medium text-theme-text mb-1"
            >
              API Key *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-theme-text-muted" />
              </div>
              <input
                type={showKey ? "text" : "password"}
                id="key"
                value={formData.key}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, key: e.target.value }))
                }
                className="input-field pl-10 pr-10"
                placeholder="Enter your API key"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showKey ? (
                  <EyeOff className="h-5 w-5 text-theme-text-muted" />
                ) : (
                  <Eye className="h-5 w-5 text-theme-text-muted" />
                )}
              </button>
            </div>
            <p className="text-xs text-theme-text-muted mt-1">
              Your API key is encrypted and stored securely
            </p>
          </div>

          {/* Rate Limits Configuration */}
          <div className="space-y-4 pt-4 border-t border-theme-border">
            <h3 className="text-lg font-medium text-theme-text">
              Rate Limits (Optional)
            </h3>
            <p className="text-sm text-theme-text-secondary">
              Configure custom rate limits or leave as default. Default limits
              ensure free API usage.
            </p>

            {/* Pricing Warning */}
            {showPricingWarning && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      ⚠️ Pricing Warning
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Custom rate limits may result in expenses. Each AI
                      provider charges per request and token usage. Higher
                      limits can lead to increased charges on your API account.
                      default limits make sure the api is completely free so
                      consider starting with them.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">
                Requests per Minute
              </label>
              <select
                value={getDropdownValue(formData.rateLimits.requestsPerMinute)}
                onChange={(e) => {
                  if (e.target.value === "unlimited") {
                    handleRateLimitChange("requestsPerMinute", "unlimited");
                  } else if (e.target.value === "default") {
                    handleRateLimitChange("requestsPerMinute", "");
                  } else {
                    handleRateLimitChange("requestsPerMinute", "custom");
                    setCustomRequestsPerMinute("");
                  }
                }}
                className="input-field w-full mb-2"
              >
                <option value="default">
                  Default (
                  {(() => {
                    const value = getDefaultRateLimit(
                      formData.provider,
                      formData.model ||
                        providers.find((p) => p.value === formData.provider)
                          ?.defaultModel,
                      "requestsPerMinute"
                    );
                    return value ? value.toString() : "Unknown";
                  })()}
                  )
                </option>
                <option value="unlimited">Unlimited</option>
                <option value="custom">Custom</option>
              </select>

              {shouldShowCustomInput(formData.rateLimits.requestsPerMinute) && (
                <input
                  type="text"
                  value={customRequestsPerMinute}
                  onChange={(e) => setCustomRequestsPerMinute(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g., 20"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">
                Requests per Day
              </label>
              <select
                value={getDropdownValue(formData.rateLimits.requestsPerDay)}
                onChange={(e) => {
                  if (e.target.value === "unlimited") {
                    handleRateLimitChange("requestsPerDay", "unlimited");
                  } else if (e.target.value === "default") {
                    handleRateLimitChange("requestsPerDay", "");
                  } else {
                    handleRateLimitChange("requestsPerDay", "custom");
                    setCustomRequestsPerDay("");
                  }
                }}
                className="input-field w-full mb-2"
              >
                <option value="default">
                  Default (
                  {(() => {
                    const value = getDefaultRateLimit(
                      formData.provider,
                      formData.model ||
                        providers.find((p) => p.value === formData.provider)
                          ?.defaultModel,
                      "requestsPerDay"
                    );
                    return value ? value.toString() : "Unknown";
                  })()}
                  )
                </option>
                <option value="unlimited">Unlimited</option>
                <option value="custom">Custom</option>
              </select>

              {shouldShowCustomInput(formData.rateLimits.requestsPerDay) && (
                <input
                  type="text"
                  value={customRequestsPerDay}
                  onChange={(e) => setCustomRequestsPerDay(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g., 1000"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">
                Tokens per Minute
              </label>
              <select
                value={getDropdownValue(formData.rateLimits.tokensPerMinute)}
                onChange={(e) => {
                  if (e.target.value === "unlimited") {
                    handleRateLimitChange("tokensPerMinute", "unlimited");
                  } else if (e.target.value === "default") {
                    handleRateLimitChange("tokensPerMinute", "");
                  } else {
                    handleRateLimitChange("tokensPerMinute", "custom");
                    setCustomTokensPerMinute("");
                  }
                }}
                className="input-field w-full mb-2"
              >
                <option value="default">
                  Default (
                  {(() => {
                    const value = getDefaultRateLimit(
                      formData.provider,
                      formData.model ||
                        providers.find((p) => p.value === formData.provider)
                          ?.defaultModel,
                      "tokensPerMinute"
                    );
                    return value ? `${(value / 1000).toFixed(0)}k` : "Unknown";
                  })()}
                  )
                </option>
                <option value="unlimited">Unlimited</option>
                <option value="custom">Custom</option>
              </select>

              {shouldShowCustomInput(formData.rateLimits.tokensPerMinute) && (
                <input
                  type="text"
                  value={customTokensPerMinute}
                  onChange={(e) => setCustomTokensPerMinute(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g., 100000 or 100k"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">
                Max Tokens per Request
              </label>
              <select
                value={getDropdownValue(
                  formData.rateLimits.maxTokensPerRequest
                )}
                onChange={(e) => {
                  if (e.target.value === "unlimited") {
                    handleRateLimitChange("maxTokensPerRequest", "unlimited");
                  } else if (e.target.value === "default") {
                    handleRateLimitChange("maxTokensPerRequest", "");
                  } else {
                    handleRateLimitChange("maxTokensPerRequest", "custom");
                    setCustomMaxTokensPerRequest("");
                  }
                }}
                className="input-field w-full mb-2"
              >
                <option value="default">
                  Default (
                  {(() => {
                    const value = getDefaultRateLimit(
                      formData.provider,
                      formData.model ||
                        providers.find((p) => p.value === formData.provider)
                          ?.defaultModel,
                      "maxTokensPerRequest"
                    );
                    return value ? `${(value / 1000).toFixed(0)}k` : "Unknown";
                  })()}
                  )
                </option>
                <option value="unlimited">Unlimited</option>
                <option value="custom">Custom</option>
              </select>

              {shouldShowCustomInput(
                formData.rateLimits.maxTokensPerRequest
              ) && (
                <input
                  type="text"
                  value={customMaxTokensPerRequest}
                  onChange={(e) => setCustomMaxTokensPerRequest(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g., 4000 or 4k"
                />
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading || !formData.name.trim() || !formData.key.trim()
              }
              className="flex-1 btn btn-primary inline-flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Add Key
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddKeyModal;
