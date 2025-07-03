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
    { value: "openai", label: "OpenAI", defaultModel: "gpt-4" },
    { value: "gemini", label: "Google Gemini", defaultModel: "gemini-pro" },
    {
      value: "claude",
      label: "Anthropic Claude",
      defaultModel: "claude-3-sonnet-20240229",
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

          {/* Model */}
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
              placeholder="e.g., gpt-4, gemini-pro"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use the default model for the selected provider
            </p>
          </div>

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
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading || !formData.name.trim() || !formData.key.trim()
              }
              className="flex-1 btn-primary"
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
