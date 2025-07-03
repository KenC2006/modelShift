import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import ChatMessage from "./ChatMessage";
import KeySelector from "./KeySelector";
import LoadingSpinner from "./LoadingSpinner";
import axios from "axios";
import toast from "react-hot-toast";
import { Send, RotateCcw } from "lucide-react";

const Chat = () => {
  const { userData, refreshUserData } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (userData?.apiKeys?.length > 0 && !selectedKeyId) {
      const firstActiveKey = userData.apiKeys.find((key) => key.isActive);
      if (firstActiveKey) {
        setSelectedKeyId(firstActiveKey.id);
      }
    }
  }, [userData, selectedKeyId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    try {
      const response = await axios.post("/api/chat", {
        message: inputMessage,
        keyId: selectedKeyId,
      });

      const aiMessage = {
        id: Date.now() + 1,
        content: response.data.response,
        sender: "ai",
        timestamp: new Date(),
        provider: response.data.provider,
        model: response.data.model,
        keyName: response.data.keyName,
        tokensUsed: response.data.tokensUsed,
      };

      setMessages((prev) => [...prev, aiMessage]);
      await refreshUserData();
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: Date.now() + 1,
        content: error.response?.data?.message || "Failed to send message",
        sender: "error",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!userData?.apiKeys?.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No API Keys Found
          </h2>
          <p className="text-gray-600 mb-4">
            Please add at least one API key to start chatting
          </p>
          <button
            onClick={() => (window.location.href = "/settings")}
            className="btn-primary"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  const activeKeys = userData.apiKeys.filter((key) => key.isActive);
  if (activeKeys.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Active API Keys
          </h2>
          <p className="text-gray-600 mb-4">
            Please activate at least one API key to start chatting
          </p>
          <button
            onClick={() => (window.location.href = "/settings")}
            className="btn-primary"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Chat</h1>
        <div className="flex items-center space-x-2">
          <KeySelector
            keys={activeKeys}
            selectedKeyId={selectedKeyId}
            onKeySelect={setSelectedKeyId}
          />
          <button
            onClick={clearChat}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Clear chat"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a conversation by typing a message below</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <LoadingSpinner />
            <span>AI is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
