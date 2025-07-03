import React from "react";
import { Bot, User, AlertCircle, Clock, Zap } from "lucide-react";

const ChatMessage = ({ message }) => {
  const isUser = message.role === "user";
  const isError = message.isError;

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
        return "🤖";
    }
  };

  return (
    <div className={`chat-message ${isUser ? "user" : "assistant"}`}>
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? "bg-primary-100" : "bg-gray-100"
          }`}
        >
          {isUser ? (
            <User className="h-4 w-4 text-primary-600" />
          ) : isError ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <Bot className="h-4 w-4 text-gray-600" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {isUser ? "You" : "AI Assistant"}
            </span>
            <span className="text-xs text-gray-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(message.timestamp)}
            </span>
          </div>

          {/* Message Text */}
          <div
            className={`prose prose-sm max-w-none ${
              isError ? "text-red-700" : "text-gray-700"
            }`}
          >
            {message.content}
          </div>

          {/* Metadata */}
          {message.metadata && !isError && (
            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
              {message.metadata.provider && (
                <div className="flex items-center space-x-1">
                  <span>{getProviderIcon(message.metadata.provider)}</span>
                  <span className="capitalize">
                    {message.metadata.provider}
                  </span>
                </div>
              )}
              {message.metadata.model && (
                <div className="flex items-center space-x-1">
                  <span>Model:</span>
                  <span className="font-mono">{message.metadata.model}</span>
                </div>
              )}
              {message.metadata.keyName && (
                <div className="flex items-center space-x-1">
                  <span>Key:</span>
                  <span>{message.metadata.keyName}</span>
                </div>
              )}
              {message.metadata.tokensUsed && (
                <div className="flex items-center space-x-1">
                  <Zap className="h-3 w-3" />
                  <span>{message.metadata.tokensUsed} tokens</span>
                </div>
              )}
            </div>
          )}

          {/* Error Details */}
          {isError && message.metadata?.error && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              <strong>Error:</strong> {message.metadata.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
