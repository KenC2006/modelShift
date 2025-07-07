import React, { useState, useRef, useEffect } from "react";
import { useComparisonSettings } from "../contexts/ComparisonSettingsContext";
import {
  Bot,
  AlertCircle,
  Clock,
  Zap,
  Copy,
  Check,
  Download,
  MoreVertical,
  CheckCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const ComparisonResult = ({ result }) => {
  const { settings } = useComparisonSettings();
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

  const getProviderColor = (provider) => {
    switch (provider?.toLowerCase()) {
      case "openai":
        return "bg-green-50 border-green-200";
      case "gemini":
        return "bg-purple-50 border-purple-200";
      case "claude":
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-gray-50 border-gray-200";
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
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      toast.success("Response copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy response");
    }
  };

  const downloadResponse = () => {
    const blob = new Blob([result.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-response-${result.metadata?.provider}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Response downloaded");
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
    if (!result.success) {
      return (
        <div className="text-red-700 bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Error</span>
          </div>
          <p>{result.content}</p>
        </div>
      );
    }

    if (settings.markdownRendering) {
      return (
        <div
          className={`prose prose-sm max-w-none ${getFontSize()}`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(result.content) }}
        />
      );
    }

    return (
      <div className={`whitespace-pre-wrap ${getFontSize()}`}>
        {result.content}
      </div>
    );
  };

  return (
    <div
      className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${getProviderColor(
        result.metadata?.provider
      )}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-lg">
                {getProviderIcon(result.metadata?.provider)}
              </span>
            </div>
            <div>
              <div className="font-medium text-sm">
                {result.metadata?.keyName || result.metadata?.provider}
              </div>
              <div className="text-xs text-gray-500">
                {result.metadata?.provider} • {result.metadata?.model}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {settings.showTimestamps && (
              <span className="text-xs text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(result.timestamp)}
              </span>
            )}

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
                    onClick={downloadResponse}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="text-gray-700">{renderContent()}</div>
      </div>

      {/* Footer */}
      {result.success && result.metadata && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between text-xs text-gray-500">
            {settings.showProviderInfo && result.metadata.provider && (
              <div className="flex items-center space-x-1">
                <span className="capitalize">{result.metadata.provider}</span>
              </div>
            )}
            {settings.showTokenCount && result.metadata.tokensUsed && (
              <div className="flex items-center space-x-1">
                <Zap className="h-3 w-3" />
                <span>{result.metadata.tokensUsed} tokens</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonResult;
