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
  Edit,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import AddKeyModal from "./AddKeyModal";
import EditKeyModal from "./EditKeyModal";
import { getDefaultRateLimit } from "../utils/defaultRateLimits";

const KeyManager = () => {
  const { userData, refreshUserData } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      const response = await axios.get("/api/chat/usage");
      setUsageStats(response.data);
    } catch (error) {}
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

    let date;
    if (dateInput.toDate) {
      date = dateInput.toDate();
    } else if (dateInput.seconds) {
      date = new Date(dateInput.seconds * 1000);
    } else {
      date = new Date(dateInput);
    }

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

    let date;
    if (dateInput.toDate) {
      date = dateInput.toDate();
    } else if (dateInput.seconds) {
      date = new Date(dateInput.seconds * 1000);
    } else {
      date = new Date(dateInput);
    }

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

  const formatRateLimits = (rateLimits, provider, model) => {
    if (!rateLimits) return "Default limits";

    const limits = [];

    if (rateLimits.requestsPerMinute === null) {
      limits.push("∞/min");
    } else if (
      rateLimits.requestsPerMinute === "" ||
      rateLimits.requestsPerMinute === undefined
    ) {
      const defaultRpm = getDefaultRateLimit(
        provider,
        model,
        "requestsPerMinute"
      );
      if (defaultRpm && !isNaN(defaultRpm)) {
        limits.push(`${defaultRpm}/min`);
      } else {
        limits.push("∞/min");
      }
    } else {
      limits.push(`${rateLimits.requestsPerMinute}/min`);
    }

    if (rateLimits.requestsPerDay === null) {
      limits.push("∞/day");
    } else if (
      rateLimits.requestsPerDay === "" ||
      rateLimits.requestsPerDay === undefined
    ) {
      const defaultRpd = getDefaultRateLimit(provider, model, "requestsPerDay");
      if (defaultRpd && !isNaN(defaultRpd)) {
        limits.push(`${defaultRpd}/day`);
      } else {
        limits.push("∞/day");
      }
    } else {
      limits.push(`${rateLimits.requestsPerDay}/day`);
    }

    if (rateLimits.tokensPerMinute === null) {
      limits.push("∞ tokens/min");
    } else if (
      rateLimits.tokensPerMinute === "" ||
      rateLimits.tokensPerMinute === undefined
    ) {
      const defaultTpm = getDefaultRateLimit(
        provider,
        model,
        "tokensPerMinute"
      );
      if (defaultTpm && !isNaN(defaultTpm)) {
        limits.push(`${(defaultTpm / 1000).toFixed(0)}k tokens/min`);
      } else {
        limits.push("∞ tokens/min");
      }
    } else {
      limits.push(
        `${(rateLimits.tokensPerMinute / 1000).toFixed(0)}k tokens/min`
      );
    }

    if (rateLimits.maxTokensPerRequest === null) {
      limits.push("∞ tokens/req");
    } else if (
      rateLimits.maxTokensPerRequest === "" ||
      rateLimits.maxTokensPerRequest === undefined
    ) {
      const defaultMtpr = getDefaultRateLimit(
        provider,
        model,
        "maxTokensPerRequest"
      );
      if (defaultMtpr && !isNaN(defaultMtpr)) {
        limits.push(`${(defaultMtpr / 1000).toFixed(0)}k tokens/req`);
      } else {
        limits.push("∞ tokens/req");
      }
    } else {
      limits.push(
        `${(rateLimits.maxTokensPerRequest / 1000).toFixed(0)}k tokens/req`
      );
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
                      {key.rateLimits && (
                        <p className="text-xs text-theme-text-tertiary mt-1">
                          {formatRateLimits(
                            key.rateLimits,
                            key.provider,
                            key.model
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingKey(key);
                        setShowEditModal(true);
                      }}
                      disabled={loading}
                      className="p-2 text-theme-text-tertiary hover:text-theme-text hover:bg-theme-surface-hover rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
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

      {showEditModal && editingKey && (
        <EditKeyModal
          keyData={editingKey}
          onClose={() => {
            setShowEditModal(false);
            setEditingKey(null);
          }}
          onSuccess={async () => {
            await refreshUserData();
            await fetchUsageStats();
            setShowEditModal(false);
            setEditingKey(null);
          }}
        />
      )}
    </div>
  );
};

export default KeyManager;
