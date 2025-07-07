import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useChatSettings } from "../contexts/ChatSettingsContext";
import ChatMessage from "./ChatMessage";
import KeySelector from "./KeySelector";
import ChatSettingsPanel from "./ChatSettingsPanel";
import LoadingSpinner from "./LoadingSpinner";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Send,
  RotateCcw,
  Settings,
  Download,
  Upload,
  MessageSquare,
  Sparkles,
  Bot,
  AlertCircle,
  Paperclip,
} from "lucide-react";

const Chat = () => {
  const { userData, refreshUserData } = useAuth();
  const { settings } = useChatSettings();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (userData?.apiKeys?.length > 0 && !selectedKeyId) {
      const firstActiveKey = userData.apiKeys.find((key) => key.isActive);
      if (firstActiveKey) {
        setSelectedKeyId(firstActiveKey.id);
      }
    }
  }, [userData, selectedKeyId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: settings.animations ? "smooth" : "auto",
    });
  }, [settings.animations]);

  const autoResizeTextarea = useCallback(() => {
    if (!settings.autoResize || !textareaRef.current) return;

    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [settings.autoResize]);

  useEffect(() => {
    if (settings.autoScroll) {
      scrollToBottom();
    }
  }, [messages, settings.autoScroll, scrollToBottom]);

  useEffect(() => {
    autoResizeTextarea();
  }, [inputMessage, autoResizeTextarea]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      console.log("Sending message to API:", {
        message: inputMessage,
        keyId: selectedKeyId,
        systemPrompt: settings.systemPrompt,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      });

      const response = await axios.post("/api/chat", {
        message: inputMessage,
        keyId: selectedKeyId,
        systemPrompt: settings.systemPrompt,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      });

      console.log("API response:", response.data);

      const aiMessage = {
        id: Date.now() + 1,
        content: response.data.response,
        sender: "ai",
        timestamp: new Date(),
        metadata: {
          provider: response.data.provider,
          model: response.data.model,
          keyName: response.data.keyName,
          tokensUsed: response.data.tokensUsed,
        },
      };

      setMessages((prev) => [...prev, aiMessage]);
      await refreshUserData();

      if (settings.soundEffects) {
        // Play success sound
        const audio = new Audio(
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
        );
        audio.play().catch(() => {});
      }
    } catch (error) {
      console.error("Error sending message:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
      });

      const errorMessage = {
        id: Date.now() + 1,
        content:
          error.response?.data?.message ||
          error.message ||
          "Failed to send message",
        sender: "error",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (settings.enterToSend && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (
      settings.shiftEnterToNewLine &&
      e.key === "Enter" &&
      e.shiftKey
    ) {
      // Allow new line
    }
  };

  const clearChat = () => {
    if (messages.length > 0) {
      if (window.confirm("Are you sure you want to clear the chat?")) {
        setMessages([]);
        toast.success("Chat cleared");
      }
    }
  };

  const exportChat = () => {
    const chatData = {
      messages: messages.map((msg) => ({
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata,
      })),
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Chat exported successfully");
  };

  const importChat = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const chatData = JSON.parse(e.target.result);
        if (chatData.messages && Array.isArray(chatData.messages)) {
          setMessages(chatData.messages);
          toast.success("Chat imported successfully");
        } else {
          toast.error("Invalid chat file format");
        }
      } catch (error) {
        toast.error("Failed to import chat file");
      }
    };
    reader.readAsText(file);
  };

  if (!userData?.apiKeys?.length) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 dark:from-green-600 dark:to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Bot className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to modelShift
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Start chatting with AI models to get help with coding, writing,
            analysis, and much more.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => (window.location.href = "/api-manager")}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center justify-center"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Get Started
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              You'll need to add API keys first
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeKeys = userData.apiKeys.filter((key) => key.isActive);
  if (activeKeys.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <AlertCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            No Active API Keys
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            You have API keys but none are active. Activate at least one to
            start chatting with AI.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => (window.location.href = "/api-manager")}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center justify-center"
            >
              <Settings className="h-5 w-5 mr-2" />
              Manage Keys
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Go to API Manager to activate your keys
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col h-full ${
        settings.compactMode ? "compact-mode" : ""
      }`}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              AI Chat
            </h1>
            <KeySelector
              keys={activeKeys}
              selectedKeyId={selectedKeyId}
              onKeySelect={setSelectedKeyId}
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportChat}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export chat"
            >
              <Download className="h-4 w-4" />
            </button>
            <label className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
              <Upload className="h-4 w-4" />
              <input
                type="file"
                accept=".json"
                onChange={importChat}
                className="hidden"
              />
            </label>
            <button
              onClick={clearChat}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear chat"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Chat settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {settings.showWelcomeMessage && messages.length === 0 && (
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-10 w-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Ready to chat with AI?
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Ask me anything! I can help with coding, writing, analysis, and
              much more.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-center space-x-3 text-gray-500">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-600" />
            </div>
            <div className="flex items-center space-x-2">
              <LoadingSpinner />
              <span>AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              {/* File Upload */}
              <button
                className="h-12 w-12 text-gray-500 hover:text-gray-700 hover:bg-white rounded-xl transition-all duration-200 shadow-sm border border-gray-200 hover:shadow-md flex-shrink-0 flex items-center justify-center"
                title="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={settings.placeholderText}
                  className="input-field resize-none"
                  rows={1}
                  disabled={isLoading}
                  style={{ minHeight: "48px", maxHeight: "200px" }}
                />
                {settings.enterToSend && (
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded-full shadow-sm">
                    Enter to send
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="h-12 w-12 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm flex-shrink-0 flex items-center justify-center"
                title="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <ChatSettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Click outside to close dropdowns */}
      {showSettings && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default Chat;
