const express = require("express");
const { body, validationResult } = require("express-validator");
const { db } = require("../config/firebase");
const { decrypt } = require("../utils/encryption");
const { getModelRateLimits } = require("../config/rateLimits");
const authenticateToken = require("../middleware/auth");
const { checkRateLimits } = require("../middleware/modelRateLimiting");
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

router.post(
  "/chat",
  [
    authenticateToken,
    body("message")
      .trim()
      .isLength({ min: 1, max: 10000 })
      .withMessage("Message must be between 1 and 10000 characters"),
    body("keyId").optional().isString().withMessage("Key ID must be a string"),
    body("systemPrompt")
      .optional()
      .isString()
      .withMessage("System prompt must be a string"),
    body("temperature")
      .optional()
      .isFloat({ min: 0, max: 2 })
      .withMessage("Temperature must be between 0 and 2"),
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

      const { message, keyId, systemPrompt, temperature } = req.body;
      const userId = req.user.uid;

      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();
      const apiKeys = userData.apiKeys || [];

      if (apiKeys.length === 0) {
        return res.status(400).json({
          error: "No API Keys",
          message: "Please add at least one API key to start chatting",
        });
      }

      const activeKeys = apiKeys.filter((key) => key.isActive);
      if (activeKeys.length === 0) {
        return res.status(400).json({
          error: "No Active Keys",
          message: "Please activate at least one API key",
        });
      }

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
        selectedKey = selectBestKey(activeKeys);
      }

      const estimatedTokens = Math.ceil(message.length / 4);
      const rateLimitResult = await checkRateLimits(
        userId,
        selectedKey.provider,
        selectedKey.model,
        keyId,
        estimatedTokens
      );

      if (rateLimitResult.limited) {
        return res.status(429).json({
          error: rateLimitResult.error,
          message: rateLimitResult.message,
          retryAfter: rateLimitResult.retryAfter,
        });
      }

      let decryptedKey;
      try {
        decryptedKey = decrypt(selectedKey.encryptedKey);
      } catch (error) {
        console.error("Decryption error:", error);
        return res.status(500).json({
          error: "Decryption Error",
          message: "Failed to decrypt API key",
        });
      }

      const modelLimits = rateLimitResult.modelLimits;

      let response;
      let tokensUsed = 0;
      let error = null;

      try {
        const result = await callAIProvider(
          selectedKey.provider,
          decryptedKey,
          selectedKey.model,
          message,
          modelLimits,
          {
            systemPrompt:
              systemPrompt ||
              "You are a helpful AI assistant. Provide clear, accurate, and helpful responses.",
            temperature: temperature || 0.7,
          }
        );
        response = result.response;
        tokensUsed = result.tokens || 0;
      } catch (apiError) {
        error = apiError;

        if (activeKeys.length > 1) {
          const otherKeys = activeKeys.filter(
            (key) => key.id !== selectedKey.id
          );
          const fallbackKey = selectBestKey(otherKeys);

          if (fallbackKey) {
            let fallbackDecryptedKey;
            try {
              fallbackDecryptedKey = decrypt(fallbackKey.encryptedKey);
            } catch (error) {
              console.error("Fallback decryption error:", error);
              error = new Error("Failed to decrypt fallback API key");
            }

            if (fallbackDecryptedKey) {
              try {
                const fallbackRateLimitResult = await checkRateLimits(
                  userId,
                  fallbackKey.provider,
                  fallbackKey.model,
                  fallbackKey.id,
                  estimatedTokens
                );

                if (fallbackRateLimitResult.limited) {
                  throw new Error(fallbackRateLimitResult.message);
                }

                const fallbackResult = await callAIProvider(
                  fallbackKey.provider,
                  fallbackDecryptedKey,
                  fallbackKey.model,
                  message,
                  fallbackRateLimitResult.modelLimits,
                  {
                    systemPrompt:
                      systemPrompt ||
                      "You are a helpful AI assistant. Provide clear, accurate, and helpful responses.",
                    temperature: temperature || 0.7,
                  }
                );
                response = fallbackResult.response;
                tokensUsed = fallbackResult.tokens || 0;
                selectedKey = fallbackKey;
                error = null;
              } catch (fallbackError) {
                error = fallbackError;
              }
            }
          }
        }
      }

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

router.get("/usage", async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() || {};

    res.json({
      usageStats: userData.usageStats || {
        totalRequests: 0,
        totalTokens: 0,
        lastRequest: null,
      },
      apiKeys: (userData.apiKeys || []).map((key) => {
        const rateLimits = getModelRateLimits(key.provider, key.model);
        return {
          id: key.id,
          name: key.name,
          provider: key.provider,
          model: key.model,
          isActive: key.isActive,
          usageStats: key.usageStats,
          lastUsed: key.lastUsed,
          rateLimits: rateLimits,
        };
      }),
    });
  } catch (error) {
    console.error("Error getting usage stats:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get usage statistics",
    });
  }
});

function selectBestKey(activeKeys) {
  return activeKeys.sort((a, b) => {
    const aErrorRate = a.usageStats.errors / Math.max(a.usageStats.requests, 1);
    const bErrorRate = b.usageStats.errors / Math.max(b.usageStats.requests, 1);

    if (aErrorRate !== bErrorRate) {
      return aErrorRate - bErrorRate;
    }

    const aLastUsed = a.lastUsed
      ? a.lastUsed.toDate
        ? a.lastUsed.toDate().getTime()
        : new Date(a.lastUsed).getTime()
      : 0;
    const bLastUsed = b.lastUsed
      ? b.lastUsed.toDate
        ? b.lastUsed.toDate().getTime()
        : new Date(b.lastUsed).getTime()
      : 0;

    return aLastUsed - bLastUsed;
  })[0];
}

async function callAIProvider(
  provider,
  apiKey,
  model,
  message,
  modelLimits,
  customSettings
) {
  switch (provider) {
    case "openai":
      return await callOpenAI(
        apiKey,
        model,
        message,
        modelLimits,
        customSettings
      );
    case "gemini":
      return await callGemini(
        apiKey,
        model,
        message,
        modelLimits,
        customSettings
      );
    case "claude":
      return await callClaude(
        apiKey,
        model,
        message,
        modelLimits,
        customSettings
      );
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function callOpenAI(apiKey, model, message, modelLimits, customSettings) {
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const completion = await openai.chat.completions.create({
    model: model || "gpt-4o",
    messages: [
      {
        role: "system",
        content: customSettings.systemPrompt,
      },
      {
        role: "user",
        content: message,
      },
    ],

    temperature: customSettings.temperature,
  });

  return {
    response: completion.choices[0].message.content,
    tokens: completion.usage.total_tokens,
  };
}

async function callGemini(apiKey, model, message, modelLimits, customSettings) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: model || "gemini-2.0-flash",
    generationConfig: {
      temperature: customSettings?.temperature || 0.7,
    },
  });

  const result = await geminiModel.generateContent(message);
  const response = await result.response;
  const text = response.text();

  return {
    response: text,
    tokens: response.usageMetadata?.totalTokenCount || 0,
  };
}

async function callClaude(apiKey, model, message, modelLimits, customSettings) {
  throw new Error("Claude API not yet implemented");
}

async function updateUsageStats(userId, keyId, tokensUsed, errors = 0) {
  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    const userStats = userData.usageStats || {
      totalRequests: 0,
      totalTokens: 0,
      lastRequest: null,
    };

    userStats.totalRequests += 1;
    userStats.totalTokens += tokensUsed;
    userStats.lastRequest = new Date();

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

    await userRef.update({
      usageStats: userStats,
      apiKeys: apiKeys,
    });
  } catch (error) {
    console.error("Error updating usage stats:", error);
  }
}

module.exports = router;
