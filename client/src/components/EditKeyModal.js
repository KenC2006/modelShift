import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Save, AlertTriangle } from "lucide-react";
import apiClient from "../config/api";
import toast from "react-hot-toast";
import { getDefaultRateLimit } from "../utils/defaultRateLimits";

const EditKeyModal = ({ keyData, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    model: "",
    rateLimits: {
      requestsPerMinute: "",
      requestsPerDay: "",
      tokensPerMinute: "",
    },
    maxTokensPerRequest: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [customRequestsPerMinute, setCustomRequestsPerMinute] = useState("");
  const [customRequestsPerDay, setCustomRequestsPerDay] = useState("");
  const [customTokensPerMinute, setCustomTokensPerMinute] = useState("");
  const [customMaxTokensPerRequest, setCustomMaxTokensPerRequest] =
    useState("");
  const [showPricingWarning, setShowPricingWarning] = useState(false);

  useEffect(() => {
    if (keyData) {
      const getFormValue = (value, field) => {
        if (value === null) return null; // unlimited
        if (value === undefined) return ""; // default
        if (value === "" || value === 0) return ""; // default

        const defaultValue = getDefaultRateLimit(
          keyData.provider,
          keyData.model,
          field
        );

        if (defaultValue !== null && parseInt(value) === defaultValue) {
          return ""; // default
        }

        return "custom";
      };

      setFormData({
        name: keyData.name || "",
        model: keyData.model || "",
        rateLimits: {
          requestsPerMinute: getFormValue(
            keyData.rateLimits?.requestsPerMinute,
            "requestsPerMinute"
          ),
          requestsPerDay: getFormValue(
            keyData.rateLimits?.requestsPerDay,
            "requestsPerDay"
          ),
          tokensPerMinute: getFormValue(
            keyData.rateLimits?.tokensPerMinute,
            "tokensPerMinute"
          ),
        },
        maxTokensPerRequest: getFormValue(
          keyData.rateLimits?.maxTokensPerRequest,
          "maxTokensPerRequest"
        ),
      });

      const setCustomValue = (value, setter) => {
        if (value && value !== "" && value !== null) {
          setter(value.toString());
        }
      };

      setCustomValue(
        keyData.rateLimits?.requestsPerMinute,
        setCustomRequestsPerMinute
      );
      setCustomValue(
        keyData.rateLimits?.requestsPerDay,
        setCustomRequestsPerDay
      );
      setCustomValue(
        keyData.rateLimits?.tokensPerMinute,
        setCustomTokensPerMinute
      );
      setCustomValue(
        keyData.rateLimits?.maxTokensPerRequest,
        setCustomMaxTokensPerRequest
      );

      // Check if there are any custom limits to show pricing warning
      const hasCustomLimits = Object.values({
        requestsPerMinute: getFormValue(
          keyData.rateLimits?.requestsPerMinute,
          "requestsPerMinute"
        ),
        requestsPerDay: getFormValue(
          keyData.rateLimits?.requestsPerDay,
          "requestsPerDay"
        ),
        tokensPerMinute: getFormValue(
          keyData.rateLimits?.tokensPerMinute,
          "tokensPerMinute"
        ),
        maxTokensPerRequest: getFormValue(
          keyData.rateLimits?.maxTokensPerRequest,
          "maxTokensPerRequest"
        ),
      }).some((val) => val === "custom" || val === null);

      setShowPricingWarning(hasCustomLimits);
    }
  }, [keyData]);

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value === "unlimited" ? null : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value === "unlimited" ? null : value,
      }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Show pricing warning if any rate limit is set to custom or unlimited
    const hasCustomLimits = Object.values({
      ...formData.rateLimits,
      maxTokensPerRequest: formData.maxTokensPerRequest,
      [field]: value,
    }).some((val) => val === "custom" || val === null);

    setShowPricingWarning(hasCustomLimits);
  };

  const getDropdownValue = (formValue) => {
    if (formValue === null) return "unlimited";
    if (formValue === "") return "default";
    if (formValue === "custom") return "custom";
    return "default";
  };

  const shouldShowCustomInput = (formValue) => {
    return (
      formValue === "custom" ||
      (formValue && formValue !== "" && formValue !== null)
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.model.trim()) {
      newErrors.model = "Model is required";
    }

    if (
      formData.rateLimits.requestsPerMinute !== null &&
      formData.rateLimits.requestsPerMinute !== "" &&
      formData.rateLimits.requestsPerMinute === "custom"
    ) {
      const rpm = parseInt(customRequestsPerMinute);
      if (isNaN(rpm) || rpm < 1) {
        newErrors.requestsPerMinute = "Must be a positive number";
      }
    }

    if (
      formData.rateLimits.requestsPerDay !== null &&
      formData.rateLimits.requestsPerDay !== "" &&
      formData.rateLimits.requestsPerDay === "custom"
    ) {
      const rpd = parseInt(customRequestsPerDay);
      if (isNaN(rpd) || rpd < 1) {
        newErrors.requestsPerDay = "Must be a positive number";
      }
    }

    if (
      formData.rateLimits.tokensPerMinute !== null &&
      formData.rateLimits.tokensPerMinute !== "" &&
      formData.rateLimits.tokensPerMinute === "custom"
    ) {
      const tpm = parseInt(customTokensPerMinute);
      if (isNaN(tpm) || tpm < 1) {
        newErrors.tokensPerMinute = "Must be a positive number";
      }
    }

    if (
      formData.maxTokensPerRequest !== null &&
      formData.maxTokensPerRequest !== "" &&
      formData.maxTokensPerRequest === "custom"
    ) {
      const mtpr = parseInt(customMaxTokensPerRequest);
      if (isNaN(mtpr) || mtpr < 1) {
        newErrors.maxTokensPerRequest = "Must be a positive number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        name: formData.name.trim(),
        model: formData.model.trim(),
        rateLimits: {},
      };

      // Only include rate limits that are actually set
      if (formData.rateLimits.requestsPerMinute === "custom") {
        updateData.rateLimits.requestsPerMinute = parseInt(
          customRequestsPerMinute
        );
      } else if (formData.rateLimits.requestsPerMinute === null) {
        updateData.rateLimits.requestsPerMinute = null;
      } else if (formData.rateLimits.requestsPerMinute === "") {
        // For default values, we'll send a special marker that the server can recognize
        updateData.rateLimits.requestsPerMinute = "DEFAULT";
      }

      if (formData.rateLimits.requestsPerDay === "custom") {
        updateData.rateLimits.requestsPerDay = parseInt(customRequestsPerDay);
      } else if (formData.rateLimits.requestsPerDay === null) {
        updateData.rateLimits.requestsPerDay = null;
      } else if (formData.rateLimits.requestsPerDay === "") {
        updateData.rateLimits.requestsPerDay = "DEFAULT";
      }

      if (formData.rateLimits.tokensPerMinute === "custom") {
        updateData.rateLimits.tokensPerMinute = parseInt(customTokensPerMinute);
      } else if (formData.rateLimits.tokensPerMinute === null) {
        updateData.rateLimits.tokensPerMinute = null;
      } else if (formData.rateLimits.tokensPerMinute === "") {
        updateData.rateLimits.tokensPerMinute = "DEFAULT";
      }

      if (formData.maxTokensPerRequest === "custom") {
        updateData.rateLimits.maxTokensPerRequest = parseInt(
          customMaxTokensPerRequest
        );
      } else if (formData.maxTokensPerRequest === null) {
        updateData.rateLimits.maxTokensPerRequest = null;
      } else if (formData.maxTokensPerRequest === "") {
        updateData.rateLimits.maxTokensPerRequest = "DEFAULT";
      }

      // Only include rateLimits if it has any properties
      if (Object.keys(updateData.rateLimits).length === 0) {
        delete updateData.rateLimits;
      }

      await apiClient.put(`/api/auth/api-keys/${keyData.id}`, updateData);

      toast.success("API key updated successfully");
      onSuccess();
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 400) {
        toast.error("Invalid data. Please check your input and try again.");
      } else if (error.response?.status === 404) {
        toast.error("API key not found. It may have been deleted.");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else if (error.code === "NETWORK_ERROR") {
        toast.error(
          "Network error. Please check your connection and try again."
        );
      } else {
        toast.error("Failed to update API key. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!keyData) return null;

  return createPortal(
    <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-theme-surface border border-theme-border rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text">
            Edit API Key
          </h2>
          <button
            onClick={onClose}
            className="text-theme-text-muted hover:text-theme-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`input-field w-full ${
                  errors.name ? "border-error-500" : ""
                }`}
                placeholder="Enter key name"
              />
              {errors.name && (
                <p className="text-error-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">
                Model
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                className={`input-field w-full ${
                  errors.model ? "border-error-500" : ""
                }`}
                placeholder="Enter model name"
              />
              {errors.model && (
                <p className="text-error-500 text-sm mt-1">{errors.model}</p>
              )}
            </div>
          </div>

          {/* Rate Limits */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-theme-text">Rate Limits</h3>

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
                      Custom rate limits may result in higher costs. Each AI
                      provider charges per request and token usage. Higher
                      limits can lead to increased charges on your API account.
                      Consider starting with default limits and adjusting based
                      on your usage patterns.
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
                    handleInputChange(
                      "rateLimits.requestsPerMinute",
                      "unlimited"
                    );
                  } else if (e.target.value === "default") {
                    handleInputChange("rateLimits.requestsPerMinute", "");
                  } else {
                    handleInputChange("rateLimits.requestsPerMinute", "custom");
                    setCustomRequestsPerMinute("");
                  }
                }}
                className="input-field w-full mb-2"
              >
                <option value="unlimited">Unlimited</option>
                <option value="default">
                  Default (
                  {(() => {
                    const value = getDefaultRateLimit(
                      keyData.provider,
                      keyData.model,
                      "requestsPerMinute"
                    );
                    return value ? value.toString() : "Unknown";
                  })()}
                  )
                </option>
                <option value="custom">Custom</option>
              </select>

              {shouldShowCustomInput(formData.rateLimits.requestsPerMinute) && (
                <input
                  type="text"
                  value={customRequestsPerMinute}
                  onChange={(e) => {
                    setCustomRequestsPerMinute(e.target.value);
                  }}
                  className={`input-field w-full ${
                    errors.requestsPerMinute ? "border-error-500" : ""
                  }`}
                  placeholder="e.g., 20"
                />
              )}
              {errors.requestsPerMinute && (
                <p className="text-error-500 text-sm mt-1">
                  {errors.requestsPerMinute}
                </p>
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
                    handleInputChange("rateLimits.requestsPerDay", "unlimited");
                  } else if (e.target.value === "default") {
                    handleInputChange("rateLimits.requestsPerDay", "");
                  } else {
                    handleInputChange("rateLimits.requestsPerDay", "custom");
                    setCustomRequestsPerDay("");
                  }
                }}
                className="input-field w-full mb-2"
              >
                <option value="unlimited">Unlimited</option>
                <option value="default">
                  Default (
                  {(() => {
                    const value = getDefaultRateLimit(
                      keyData.provider,
                      keyData.model,
                      "requestsPerDay"
                    );
                    return value ? value.toString() : "Unknown";
                  })()}
                  )
                </option>
                <option value="custom">Custom</option>
              </select>

              {shouldShowCustomInput(formData.rateLimits.requestsPerDay) && (
                <input
                  type="text"
                  value={customRequestsPerDay}
                  onChange={(e) => {
                    setCustomRequestsPerDay(e.target.value);
                  }}
                  className={`input-field w-full ${
                    errors.requestsPerDay ? "border-error-500" : ""
                  }`}
                  placeholder="e.g., 1000"
                />
              )}
              {errors.requestsPerDay && (
                <p className="text-error-500 text-sm mt-1">
                  {errors.requestsPerDay}
                </p>
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
                    handleInputChange(
                      "rateLimits.tokensPerMinute",
                      "unlimited"
                    );
                  } else if (e.target.value === "default") {
                    handleInputChange("rateLimits.tokensPerMinute", "");
                  } else {
                    handleInputChange("rateLimits.tokensPerMinute", "custom");
                    setCustomTokensPerMinute("");
                  }
                }}
                className="input-field w-full mb-2"
              >
                <option value="unlimited">Unlimited</option>
                <option value="default">
                  Default (
                  {(() => {
                    const value = getDefaultRateLimit(
                      keyData.provider,
                      keyData.model,
                      "tokensPerMinute"
                    );
                    return value ? `${(value / 1000).toFixed(0)}k` : "Unknown";
                  })()}
                  )
                </option>
                <option value="custom">Custom</option>
              </select>

              {shouldShowCustomInput(formData.rateLimits.tokensPerMinute) && (
                <input
                  type="text"
                  value={customTokensPerMinute}
                  onChange={(e) => {
                    setCustomTokensPerMinute(e.target.value);
                  }}
                  className={`input-field w-full ${
                    errors.tokensPerMinute ? "border-error-500" : ""
                  }`}
                  placeholder="e.g., 100000 or 100k"
                />
              )}
              {errors.tokensPerMinute && (
                <p className="text-error-500 text-sm mt-1">
                  {errors.tokensPerMinute}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">
                Max Tokens per Request
              </label>
              <select
                value={getDropdownValue(formData.maxTokensPerRequest)}
                onChange={(e) => {
                  if (e.target.value === "unlimited") {
                    handleInputChange("maxTokensPerRequest", "unlimited");
                  } else if (e.target.value === "default") {
                    handleInputChange("maxTokensPerRequest", "");
                  } else {
                    handleInputChange("maxTokensPerRequest", "custom");
                    setCustomMaxTokensPerRequest("");
                  }
                }}
                className="input-field w-full mb-2"
              >
                <option value="unlimited">Unlimited</option>
                <option value="default">
                  Default (
                  {(() => {
                    const value = getDefaultRateLimit(
                      keyData.provider,
                      keyData.model,
                      "maxTokensPerRequest"
                    );
                    return value ? `${(value / 1000).toFixed(0)}k` : "Unknown";
                  })()}
                  )
                </option>
                <option value="custom">Custom</option>
              </select>

              {shouldShowCustomInput(formData.maxTokensPerRequest) && (
                <input
                  type="text"
                  value={customMaxTokensPerRequest}
                  onChange={(e) => {
                    setCustomMaxTokensPerRequest(e.target.value);
                  }}
                  className={`input-field w-full ${
                    errors.maxTokensPerRequest ? "border-error-500" : ""
                  }`}
                  placeholder="e.g., 4000 or 4k"
                />
              )}
              {errors.maxTokensPerRequest && (
                <p className="text-error-500 text-sm mt-1">
                  {errors.maxTokensPerRequest}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary inline-flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
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

export default EditKeyModal;
