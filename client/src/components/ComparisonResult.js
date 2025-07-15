import React, { useState, useRef, useEffect } from "react";
import { useComparisonSettings } from "../contexts/ComparisonSettingsContext";
import {
  AlertCircle,
  Clock,
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
        return "bg-theme-surface border-theme-border";
      case "gemini":
        return "bg-theme-surface border-theme-border";
      case "claude":
        return "bg-theme-surface border-theme-border";
      default:
        return "bg-theme-surface border-theme-border";
    }
  };

  const getFontSize = () => {
    switch (settings.fontSize) {
      case "small":
        return "text-size-small";
      case "large":
        return "text-size-large";
      default:
        return "text-size-medium";
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      toast.success("Response copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      if (error.name === "NotAllowedError") {
        toast.error("Clipboard access denied. Please copy manually.");
      } else if (error.name === "NotSupportedError") {
        toast.error("Clipboard not supported. Please copy manually.");
      } else {
        toast.error("Failed to copy response. Please copy manually.");
      }
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

    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /`(.*?)`/g,
        '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>'
      )
      .replace(
        /```([\s\S]*?)```/g,
        '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-2"><code>$1</code></pre>'
      )
      .replace(/\n/g, "<br>");
  };

  const renderContent = () => {
    if (!result.success) {
      return (
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-sm leading-relaxed">{result.content}</p>
          <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-700">
            <p className="text-xs text-red-500 dark:text-red-400">
              💡 Tip: Check your API key settings or try again later.
            </p>
          </div>
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
      className={`border rounded-lg shadow-sm hover:shadow-md transition-shadow ${getProviderColor(
        result.metadata?.provider
      )}`}
    >
      <div className="p-4 border-b border-theme-border">
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
              <div className="text-xs text-theme-text-tertiary">
                {result.metadata?.provider} • {result.metadata?.model}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {settings.showTimestamps && (
              <span className="text-xs text-theme-text-tertiary flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(result.timestamp)}
              </span>
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-hover rounded-lg transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 bg-theme-surface border border-theme-border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                  <button
                    onClick={copyToClipboard}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-theme-surface-hover flex items-center transition-colors"
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
                    className="w-full text-left px-3 py-2 text-sm hover:bg-theme-surface-hover flex items-center transition-colors"
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

      <div className="p-4">
        <div className="text-theme-text">{renderContent()}</div>
      </div>

      {result.success && result.metadata && (
        <div className="px-4 py-3 bg-theme-secondary border-t border-theme-border rounded-b-lg">
          <div className="flex items-center justify-between text-xs text-theme-text-tertiary">
            {settings.showProviderInfo && result.metadata.provider && (
              <div className="flex items-center space-x-1">
                <span className="capitalize">{result.metadata.provider}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonResult;
