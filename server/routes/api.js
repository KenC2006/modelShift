const express = require("express");
const { body, validationResult } = require("express-validator");
const { db } = require("../config/firebase");
const { decrypt } = require("../utils/encryption");
const { getModelRateLimits } = require("../config/rateLimits");
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

// Chat with AI
router.post(
  "/chat",
  [
    body("message")
      .trim()
      .isLength({ min: 1, max: 4000 })
      .withMessage("Message must be between 1 and 4000 characters"),
    body("keyId").optional().isString().withMessage("Key ID must be a string"),
    body("model").optional().isString().withMessage("Model must be a string"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
        });
      }

      const { message, keyId, model } = req.body;
      const userId = req.user.uid;

      // Get user's API keys
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();
      const apiKeys = userData.apiKeys || [];

      if (apiKeys.length === 0) {
        return res.status(400).json({
          error: "No API Keys",
          message: "Please add at least one API key to start chatting",
        });
      }

      // Filter active keys
      const activeKeys = apiKeys.filter((key) => key.isActive);
      if (activeKeys.length === 0) {
        return res.status(400).json({
          error: "No Active Keys",
          message: "Please activate at least one API key",
        });
      }

      // Select API key to use
      let selectedKey = null;
      if (keyId) {
        selectedKey = activeKeys.find((key) => key.id === keyId);
        if (!selectedKey) {
          return res.status(400).json({
            error: "Invalid Key",
            message: "Specified API key not found or inactive",
          });
        }
      } else {
        // Auto-select the best available key
        selectedKey = selectBestKey(activeKeys);
      }

      // Decrypt the API key
      const decryptedKey = decrypt(selectedKey.encryptedKey);
      if (!decryptedKey) {
        return res.status(500).json({
          error: "Decryption Error",
          message: "Failed to decrypt API key",
        });
      }

      // Use model limits from middleware or get them if not available
      const modelLimits =
        req.modelLimits ||
        getModelRateLimits(selectedKey.provider, selectedKey.model || model);

      // Make API call to the selected provider
      let response;
      let tokensUsed = 0;
      let error = null;

      try {
        const result = await callAIProvider(
          selectedKey.provider,
          decryptedKey,
          selectedKey.model || model,
          message,
          modelLimits
        );
        response = result.response;
        tokensUsed = result.tokens || 0;
      } catch (apiError) {
        error = apiError;

        // If this key failed, try another key if available
        if (activeKeys.length > 1) {
          const otherKeys = activeKeys.filter(
            (key) => key.id !== selectedKey.id
          );
          const fallbackKey = selectBestKey(otherKeys);

          if (fallbackKey) {
            const fallbackDecryptedKey = decrypt(fallbackKey.encryptedKey);
            if (fallbackDecryptedKey) {
              try {
                const fallbackModelLimits = getModelRateLimits(
                  fallbackKey.provider,
                  fallbackKey.model || model
                );
                const fallbackResult = await callAIProvider(
                  fallbackKey.provider,
                  fallbackDecryptedKey,
                  fallbackKey.model || model,
                  message,
                  fallbackModelLimits
                );
                response = fallbackResult.response;
                tokensUsed = fallbackResult.tokens || 0;
                selectedKey = fallbackKey; // Update selected key for stats
                error = null;
              } catch (fallbackError) {
                error = fallbackError;
              }
            }
          }
        }
      }

      // Update usage statistics
      await updateUsageStats(userId, selectedKey.id, tokensUsed, error ? 1 : 0);

      if (error) {
        return res.status(500).json({
          error: "AI Provider Error",
          message: error.message || "Failed to get response from AI provider",
          provider: selectedKey.provider,
        });
      }

      res.json({
        response,
        provider: selectedKey.provider,
        model: selectedKey.model,
        keyName: selectedKey.name,
        tokensUsed,
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to process chat request",
      });
    }
  }
);

// Get usage statistics
router.get("/usage", async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    res.json({
      usageStats: userData.usageStats || {
        totalRequests: 0,
        totalTokens: 0,
        lastRequest: null,
      },
      apiKeys: (userData.apiKeys || []).map((key) => ({
        id: key.id,
        name: key.name,
        provider: key.provider,
        model: key.model,
        isActive: key.isActive,
        usageStats: key.usageStats,
        lastUsed: key.lastUsed,
      })),
    });
  } catch (error) {
    console.error("Error getting usage stats:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get usage statistics",
    });
  }
});

// Helper function to select the best available key
function selectBestKey(activeKeys) {
  // Sort by: active keys first, then by last used (oldest first), then by error rate
  return activeKeys.sort((a, b) => {
    // Prefer keys with fewer errors
    const aErrorRate = a.usageStats.errors / Math.max(a.usageStats.requests, 1);
    const bErrorRate = b.usageStats.errors / Math.max(b.usageStats.requests, 1);

    if (aErrorRate !== bErrorRate) {
      return aErrorRate - bErrorRate;
    }

    // Then prefer keys that haven't been used recently
    const aLastUsed = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
    const bLastUsed = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;

    return aLastUsed - bLastUsed;
  })[0];
}

// Helper function to call AI providers
async function callAIProvider(provider, apiKey, model, message, modelLimits) {
  switch (provider) {
    case "openai":
      return await callOpenAI(apiKey, model, message, modelLimits);
    case "gemini":
      return await callGemini(apiKey, model, message, modelLimits);
    case "claude":
      return await callClaude(apiKey, model, message, modelLimits);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function callOpenAI(apiKey, model, message, modelLimits) {
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const completion = await openai.chat.completions.create({
    model: model || "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful AI assistant. Provide clear, accurate, and helpful responses.",
      },
      {
        role: "user",
        content: message,
      },
    ],
    max_tokens: Math.min(1000, modelLimits.maxTokensPerRequest),
    temperature: 0.7,
  });

  return {
    response: completion.choices[0].message.content,
    tokens: completion.usage.total_tokens,
  };
}

async function callGemini(apiKey, model, message, modelLimits) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: model || "gemini-pro",
  });

  const result = await geminiModel.generateContent(message);
  const response = await result.response;
  const text = response.text();

  return {
    response: text,
    tokens: response.usageMetadata?.totalTokenCount || 0,
  };
}

async function callClaude(apiKey, model, message, modelLimits) {
  // Note: Claude API requires different implementation
  // This is a placeholder - you'll need to implement Claude API calls
  throw new Error("Claude API not yet implemented");
}

// Helper function to update usage statistics
async function updateUsageStats(userId, keyId, tokensUsed, errors = 0) {
  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Update user's overall usage stats
    const userStats = userData.usageStats || {
      totalRequests: 0,
      totalTokens: 0,
      lastRequest: null,
    };

    userStats.totalRequests += 1;
    userStats.totalTokens += tokensUsed;
    userStats.lastRequest = new Date();

    // Update specific key's usage stats
    const apiKeys = userData.apiKeys || [];
    const keyIndex = apiKeys.findIndex((key) => key.id === keyId);

    if (keyIndex !== -1) {
      const keyStats = apiKeys[keyIndex].usageStats || {
        requests: 0,
        tokens: 0,
        errors: 0,
      };

      keyStats.requests += 1;
      keyStats.tokens += tokensUsed;
      keyStats.errors += errors;
      apiKeys[keyIndex].usageStats = keyStats;
      apiKeys[keyIndex].lastUsed = new Date();
    }

    // Update both user stats and key stats in one transaction
    await userRef.update({
      usageStats: userStats,
      apiKeys: apiKeys,
    });
  } catch (error) {
    console.error("Error updating usage stats:", error);
  }
}

module.exports = router;
