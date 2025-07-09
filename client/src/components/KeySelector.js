import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";

const KeySelector = ({ keys, selectedKeyId, onKeySelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeKeys = keys.filter((key) => key.isActive);
  const selectedKey = keys.find((key) => key.id === selectedKeyId);

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
        return "text-green-600";
      case "gemini":
        return "text-blue-600";
      case "claude":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  if (activeKeys.length === 0) {
    return <div className="text-sm text-gray-500">No active keys</div>;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <ChevronDown className="h-4 w-4 text-gray-400" />
        <span className="text-gray-700">
          {selectedKey ? selectedKey.name : "Select Key"}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-theme-surface rounded-lg shadow-lg border border-theme-border py-1 z-50">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Active API Keys
          </div>
          {activeKeys.map((key) => (
            <button
              key={key.id}
              onClick={() => {
                onKeySelect(key.id);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getProviderIcon(key.provider)}</span>
                <div>
                  <div className="font-medium text-gray-900">{key.name}</div>
                  <div className={`text-xs ${getProviderColor(key.provider)}`}>
                    {key.provider} • {key.model}
                  </div>
                </div>
              </div>
              {selectedKeyId === key.id && (
                <Check className="h-4 w-4 text-primary-600" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default KeySelector;
