import React, { useState } from "react";
import { X, Eye, EyeOff, Key } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const AddKeyModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    provider: "openai",
    model: "",
  });
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // OpenAI models with descriptions
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

  // Gemini models with descriptions
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

  // Claude models with descriptions
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

    try {
      setLoading(true);
      await axios.post("/api/auth/api-keys", {
        name: formData.name.trim(),
        key: formData.key.trim(),
        provider: formData.provider,
        model:
          formData.model ||
          providers.find((p) => p.value === formData.provider)?.defaultModel,
      });

      toast.success("API key added successfully");
      onSuccess();
    } catch (error) {
      console.error("Error adding API key:", error);
      toast.error(error.response?.data?.message || "Failed to add API key");
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (provider) => {
    setFormData((prev) => ({
      ...prev,
      provider,
      model: providers.find((p) => p.value === provider)?.defaultModel || "",
    }));
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
      return (
        <div>
          <label
            htmlFor="model"
            className="block text-sm font-medium text-gray-700 mb-1"
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
          {formData.model && (
            <p className="text-xs text-gray-500 mt-1">
              {models.find((m) => m.value === formData.model)?.description}
            </p>
          )}
        </div>
      );
    }

    return (
      <div>
        <label
          htmlFor="model"
          className="block text-sm font-medium text-gray-700 mb-1"
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
        <p className="text-xs text-gray-500 mt-1">
          Leave empty to use the default model for the selected provider
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add API Key</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Key Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
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

          {/* Provider */}
          <div>
            <label
              htmlFor="provider"
              className="block text-sm font-medium text-gray-700 mb-1"
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

          {/* Model - Dynamic based on provider */}
          {renderModelField()}

          {/* API Key */}
          <div>
            <label
              htmlFor="key"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              API Key *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-400" />
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
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your API key is encrypted and stored securely
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !formData.name.trim() ||
                !formData.key.trim() ||
                !formData.model.trim()
              }
              className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed border border-blue-600 hover:border-blue-700 rounded-lg font-medium transition-colors duration-200"
            >
              {loading ? (
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                "Add Key"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddKeyModal;
