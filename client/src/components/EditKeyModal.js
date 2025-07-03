import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const EditKeyModal = ({ key: apiKey, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    model: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (apiKey) {
      setFormData({
        name: apiKey.name || "",
        model: apiKey.model || "",
        isActive: apiKey.isActive,
      });
    }
  }, [apiKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a key name");
      return;
    }

    try {
      setLoading(true);
      await axios.put(`/api/auth/api-keys/${apiKey.id}`, {
        name: formData.name.trim(),
        model: formData.model.trim(),
        isActive: formData.isActive,
      });

      toast.success("API key updated successfully");
      onSuccess();
    } catch (error) {
      console.error("Error updating API key:", error);
      toast.error(error.response?.data?.message || "Failed to update API key");
    } finally {
      setLoading(false);
    }
  };

  if (!apiKey) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit API Key</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Key Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Provider</div>
            <div className="font-medium text-gray-900 capitalize">
              {apiKey.provider}
            </div>
          </div>

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
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Inactive keys won't be used for chat requests
            </p>
          </div>

          {/* Usage Stats */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-900 mb-2">
              Usage Statistics
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Requests:</span>
                <span className="ml-2 font-medium">
                  {apiKey.usageStats?.requests || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Errors:</span>
                <span className="ml-2 font-medium">
                  {apiKey.usageStats?.errors || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Tokens:</span>
                <span className="ml-2 font-medium">
                  {apiKey.usageStats?.tokens || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Last Used:</span>
                <span className="ml-2 font-medium">
                  {apiKey.lastUsed
                    ? new Date(apiKey.lastUsed).toLocaleDateString()
                    : "Never"}
                </span>
              </div>
            </div>
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
              disabled={loading || !formData.name.trim()}
              className="flex-1 btn-primary"
            >
              {loading ? (
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                "Update Key"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditKeyModal;
