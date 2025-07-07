import React, { useState, useRef, useEffect } from "react";
import { useChatSettings } from "../contexts/ChatSettingsContext";
import {
  Bot,
  User,
  AlertCircle,
  Clock,
  Zap,
  Copy,
  Check,
  Download,
  MoreVertical,
} from "lucide-react";
import toast from "react-hot-toast";

const ChatMessage = ({ message }) => {
  const { settings } = useChatSettings();
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Handle clicks outside the dropdown menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const isUser = message.role === "user" || message.sender === "user";
  const isError = message.isError || message.sender === "error";

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

  const getBubbleStyle = () => {
    switch (settings.messageBubbleStyle) {
      case "sharp":
        return "rounded-none";
      case "minimal":
        return "rounded-md border";
      default:
        return "rounded-2xl";
    }
  };

  const getFontSize = () => {
    switch (settings.fontSize) {
      case "small":
        return "text-sm";
      case "large":
        return "text-lg";
      default:
        return "text-base";
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Message copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy message");
    }
  };

  const downloadMessage = () => {
    const blob = new Blob([message.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `message-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Message downloaded");
  };

  const renderMarkdown = (content) => {
    if (!settings.markdownRendering) {
      return content;
    }

    // Simple markdown rendering
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /`(.*?)`/g,
        '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>'
      )
      .replace(
        /```([\s\S]*?)```/g,
        '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-2"><code>$1</code></pre>'
      )
      .replace(/\n/g, "<br>");
  };

  const renderContent = () => {
    if (isError) {
      return (
        <div className="text-red-700 bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Error</span>
          </div>
          <p>{message.content}</p>
        </div>
      );
    }

    if (settings.markdownRendering) {
      return (
        <div
          className={`prose prose-sm max-w-none ${getFontSize()}`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />
      );
    }

    return (
      <div className={`whitespace-pre-wrap ${getFontSize()}`}>
        {message.content}
      </div>
    );
  };

  return (
    <div
      className={`chat-message ${isUser ? "user" : "assistant"} ${
        settings.compactMode ? "py-2" : "py-4"
      }`}
    >
      <div
        className={`flex items-start space-x-3 max-w-4xl ${
          isUser ? "ml-auto" : ""
        }`}
      >
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
        <div className={`flex-1 min-w-0 ${isUser ? "order-first" : ""}`}>
          <div
            className={`${getBubbleStyle()} p-4 ${
              isUser
                ? "bg-primary-600 text-white"
                : isError
                ? "bg-red-50 border border-red-200"
                : "bg-white border border-gray-200 shadow-sm"
            }`}
          >
            {/* Message Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {isUser ? "You" : "AI Assistant"}
                </span>
                {settings.showTimestamps && (
                  <span className="text-xs opacity-70 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(message.timestamp)}
                  </span>
                )}
              </div>

              {!isUser && !isError && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                      <button
                        onClick={copyToClipboard}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={downloadMessage}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message Text */}
            <div className={isUser ? "text-white" : "text-gray-700"}>
              {renderContent()}
            </div>

            {/* Metadata */}
            {!isUser && !isError && message.metadata && (
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center space-x-4 text-xs opacity-70">
                {settings.showProviderInfo && message.metadata.provider && (
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
                {settings.showTokenCount && message.metadata.tokensUsed && (
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3" />
                    <span>{message.metadata.tokensUsed} tokens</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
