import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  Zap,
  Clock,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import AddKeyModal from "./AddKeyModal";
import EditKeyModal from "./EditKeyModal";

const Settings = () => {
  const { userData, refreshUserData } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastUsed = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return formatDate(dateString);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Manage your API keys and view usage statistics
        </p>
      </div>

      {/* Usage Statistics */}
      {usageStats && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Usage Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-primary-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usageStats.usageStats?.totalRequests || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-primary-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Total Tokens</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usageStats.usageStats?.totalTokens || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-primary-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Last Request</p>
                  <p className="text-sm font-medium text-gray-900">
                    {usageStats.usageStats?.lastRequest
                      ? formatLastUsed(usageStats.usageStats.lastRequest)
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Keys */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add API Key
          </button>
        </div>

        {userData?.apiKeys && userData.apiKeys.length > 0 ? (
          <div className="space-y-4">
            {userData.apiKeys.map((key) => (
              <div
                key={key.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
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
                      <h3 className="font-medium text-gray-900">{key.name}</h3>
                      <p className="text-sm text-gray-600">
                        {key.provider} • {key.model}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>Created: {formatDate(key.createdAt)}</span>
                        <span>Last used: {formatLastUsed(key.lastUsed)}</span>
                        <span>Requests: {key.usageStats?.requests || 0}</span>
                        <span>Errors: {key.usageStats?.errors || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleKey(key.id, key.isActive)}
                      disabled={loading}
                      className={`p-2 rounded-lg transition-colors ${
                        key.isActive
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-400 hover:bg-gray-50"
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
                      onClick={() => setEditingKey(key)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      disabled={loading}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No API Keys
            </h3>
            <p className="text-gray-600 mb-4">
              Add your first API key to start chatting with AI models.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First API Key
            </button>
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

      {editingKey && (
        <EditKeyModal
          key={editingKey}
          onClose={() => setEditingKey(null)}
          onSuccess={async () => {
            await refreshUserData();
            await fetchUsageStats();
            setEditingKey(null);
          }}
        />
      )}
    </div>
  );
};

export default Settings;
