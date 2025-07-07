import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  Zap,
  Clock,
  AlertCircle,
  Info,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import AddKeyModal from "./AddKeyModal";

const KeyManager = () => {
  const { userData, refreshUserData } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      const response = await axios.get("/api/chat/usage");
      setUsageStats(response.data);
    } catch (error) {
      console.error("Error fetching usage stats:", error);
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this API key? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/api/auth/api-keys/${keyId}`);
      await refreshUserData();
      await fetchUsageStats();
      toast.success("API key deleted successfully");
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error(error.response?.data?.message || "Failed to delete API key");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleKey = async (keyId, isActive) => {
    try {
      setLoading(true);
      await axios.put(`/api/auth/api-keys/${keyId}`, { isActive: !isActive });
      await refreshUserData();
      await fetchUsageStats();
      toast.success(
        `API key ${!isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      console.error("Error toggling API key:", error);
      toast.error(error.response?.data?.message || "Failed to update API key");
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider) => {
    switch (provider?.toLowerCase()) {
      case "openai":
        return "🤖";
      case "gemini":
        return "💎";
      case "claude":
        return "🧠";
      default:
        return "🔑";
    }
  };

  const getProviderColor = (provider) => {
    switch (provider?.toLowerCase()) {
      case "openai":
        return "text-green-600 bg-green-50";
      case "gemini":
        return "text-blue-600 bg-blue-50";
      case "claude":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return "Unknown";

    // Handle Firestore Timestamp objects
    let date;
    if (dateInput.toDate) {
      // Firestore Timestamp
      date = dateInput.toDate();
    } else if (dateInput.seconds) {
      // Firestore Timestamp as object
      date = new Date(dateInput.seconds * 1000);
    } else {
      // Regular date string or Date object
      date = new Date(dateInput);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatLastUsed = (dateInput) => {
    if (!dateInput) return "Never";

    // Handle Firestore Timestamp objects
    let date;
    if (dateInput.toDate) {
      // Firestore Timestamp
      date = dateInput.toDate();
    } else if (dateInput.seconds) {
      // Firestore Timestamp as object
      date = new Date(dateInput.seconds * 1000);
    } else {
      // Regular date string or Date object
      date = new Date(dateInput);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatRateLimits = (rateLimits) => {
    if (!rateLimits) return "Unknown";

    const limits = [];
    if (rateLimits.requestsPerMinute) {
      limits.push(`${rateLimits.requestsPerMinute}/min`);
    }
    if (rateLimits.requestsPerDay) {
      limits.push(`${rateLimits.requestsPerDay}/day`);
    }
    if (rateLimits.tokensPerMinute) {
      limits.push(
        `${(rateLimits.tokensPerMinute / 1000).toFixed(0)}k tokens/min`
      );
    }
    if (rateLimits.maxTokensPerRequest) {
      limits.push(`${(rateLimits.maxTokensPerRequest / 1000).toFixed(0)}k max`);
    }

    return limits.join(" • ");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Add API Key Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-text">API Manager</h1>
          <p className="text-theme-text-secondary">
            Manage your API keys and view usage statistics
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-success inline-flex items-center px-4 py-2 text-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add API Key
        </button>
      </div>

      {/* Usage Statistics */}
      {usageStats && (
        <div className="card card-elevated">
          <h2 className="text-lg font-semibold text-theme-text mb-6 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary-500" />
            Usage Statistics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-theme-text mb-1">
                {usageStats.totalRequests || 0}
              </h3>
              <p className="text-theme-text-secondary text-sm">
                Total Requests
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-success-600" />
              </div>
              <h3 className="text-2xl font-bold text-theme-text mb-1">
                {usageStats.totalTokens || 0}
              </h3>
              <p className="text-theme-text-secondary text-sm">Total Tokens</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="h-6 w-6 text-error-600" />
              </div>
              <h3 className="text-2xl font-bold text-theme-text mb-1">
                {usageStats.totalErrors || 0}
              </h3>
              <p className="text-theme-text-secondary text-sm">Total Errors</p>
            </div>
          </div>

          {usageStats.recentActivity &&
            usageStats.recentActivity.length > 0 && (
              <div className="mt-6">
                <h3 className="text-md font-semibold text-theme-text mb-3">
                  Recent Activity
                </h3>
                <div className="space-y-2">
                  {usageStats.recentActivity
                    .slice(0, 5)
                    .map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-theme-bg-tertiary rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${getProviderColor(
                              activity.provider
                            )}`}
                          >
                            <span className="text-lg">
                              {getProviderIcon(activity.provider)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-theme-text">
                              {activity.model}
                            </p>
                            <p className="text-xs text-theme-text-muted">
                              {activity.tokens} tokens
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-theme-text-muted">
                            {formatDate(activity.timestamp)}
                          </p>
                          <p className="text-xs text-theme-text-muted">
                            {activity.duration}ms
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* API Keys List */}
      <div className="card card-elevated">
        <h2 className="text-lg font-semibold text-theme-text mb-6">API Keys</h2>

        {userData?.apiKeys && userData.apiKeys.length > 0 ? (
          <div className="space-y-4">
            {userData.apiKeys.map((key) => (
              <div
                key={key.id}
                className="border border-theme-border rounded-lg p-4 hover:bg-theme-surface-hover transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${getProviderColor(
                        key.provider
                      )}`}
                    >
                      <span className="text-lg">
                        {getProviderIcon(key.provider)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-theme-text">
                        {key.name}
                      </h3>
                      <p className="text-sm text-theme-text-secondary">
                        {key.provider} • {key.model}
                      </p>
                      <p className="text-xs text-theme-text-muted">
                        Added {formatDate(key.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleKey(key.id, key.isActive)}
                      disabled={loading}
                      className={`p-2 rounded-lg transition-colors ${
                        key.isActive
                          ? "text-success-600 hover:bg-success-50"
                          : "text-theme-text-muted hover:bg-theme-surface-hover"
                      }`}
                      title={key.isActive ? "Deactivate" : "Activate"}
                    >
                      {key.isActive ? (
                        <ToggleRight className="h-5 w-5" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      disabled={loading}
                      className="p-2 text-error-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-theme-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme-text mb-2">
              No API Keys
            </h3>
            <p className="text-theme-text-secondary mb-4">
              Add your first API key to start comparing AI models.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddKeyModal
          onClose={() => setShowAddModal(false)}
          onSuccess={async () => {
            await refreshUserData();
            await fetchUsageStats();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

export default KeyManager;
