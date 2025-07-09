const express = require("express");
const { body, validationResult } = require("express-validator");
const { db } = require("../config/firebase");
const { encrypt, decrypt } = require("../utils/encryption");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.get("/verify", authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();

    if (!userDoc.exists) {
      await db
        .collection("users")
        .doc(req.user.uid)
        .set({
          email: req.user.email,
          name: req.user.name,
          picture: req.user.picture,
          createdAt: new Date(),
          lastLogin: new Date(),
          apiKeys: [],
          usageStats: {
            totalRequests: 0,
            totalTokens: 0,
            lastRequest: null,
          },
        });

      return res.json({
        user: {
          uid: req.user.uid,
          email: req.user.email,
          name: req.user.name,
          picture: req.user.picture,
          isNewUser: true,
        },
      });
    }

    await db.collection("users").doc(req.user.uid).update({
      lastLogin: new Date(),
    });

    const userData = userDoc.data();

    res.json({
      user: {
        uid: req.user.uid,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture,
        apiKeys: userData.apiKeys || [],
        usageStats: userData.usageStats || {
          totalRequests: 0,
          totalTokens: 0,
          lastRequest: null,
        },
      },
    });
  } catch (error) {
    console.error("Error verifying user:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to verify user",
    });
  }
});

router.post(
  "/api-keys",
  [
    authenticateToken,
    body("name")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Name must be between 1 and 50 characters"),
    body("key")
      .trim()
      .isLength({ min: 20 })
      .withMessage("API key must be at least 20 characters"),
    body("provider")
      .isIn(["openai", "gemini", "claude"])
      .withMessage("Provider must be openai, gemini, or claude"),
    body("model")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Model name must be between 1 and 50 characters"),
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

      const { name, key, provider, model } = req.body;

      let encryptedKey;
      try {
        encryptedKey = encrypt(key);
      } catch (error) {
        console.error("Encryption error:", error);
        return res.status(500).json({
          error: "Encryption Error",
          message: "Failed to encrypt API key",
        });
      }

      const userDoc = await db.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      const existingKeys = userData.apiKeys || [];

      if (existingKeys.some((k) => k.name === name)) {
        return res.status(400).json({
          error: "Duplicate Key",
          message: "An API key with this name already exists",
        });
      }

      const newKey = {
        id: Date.now().toString(),
        name,
        provider,
        model: model || getDefaultModel(provider),
        encryptedKey,
        isActive: true,
        createdAt: new Date(),
        lastUsed: null,
        usageStats: {
          requests: 0,
          tokens: 0,
          errors: 0,
        },
      };

      existingKeys.push(newKey);

      await db.collection("users").doc(req.user.uid).update({
        apiKeys: existingKeys,
      });

      res.json({
        message: "API key added successfully",
        key: {
          id: newKey.id,
          name: newKey.name,
          provider: newKey.provider,
          model: newKey.model,
          isActive: newKey.isActive,
          createdAt: newKey.createdAt,
        },
      });
    } catch (error) {
      console.error("Error adding API key:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to add API key",
      });
    }
  }
);

router.get("/api-keys", authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const userData = userDoc.data();
    const apiKeys = userData.apiKeys || [];

    const { getModelRateLimits } = require("../config/rateLimits");

    const safeKeys = apiKeys.map((key) => {
      const defaultRateLimits = getModelRateLimits(key.provider, key.model);
      const customRateLimits = key.rateLimits || {};

      const rateLimits = {
        requestsPerMinute:
          customRateLimits.requestsPerMinute !== undefined
            ? customRateLimits.requestsPerMinute
            : "",
        requestsPerDay:
          customRateLimits.requestsPerDay !== undefined
            ? customRateLimits.requestsPerDay
            : "",
        tokensPerMinute:
          customRateLimits.tokensPerMinute !== undefined
            ? customRateLimits.tokensPerMinute
            : "",
        maxTokensPerRequest:
          customRateLimits.maxTokensPerRequest !== undefined
            ? customRateLimits.maxTokensPerRequest
            : "",
      };

      return {
        id: key.id,
        name: key.name,
        provider: key.provider,
        model: key.model,
        isActive: key.isActive,
        createdAt: key.createdAt,
        lastUsed: key.lastUsed,
        usageStats: key.usageStats,
        rateLimits: rateLimits,
      };
    });

    res.json({ apiKeys: safeKeys });
  } catch (error) {
    console.error("Error getting API keys:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get API keys",
    });
  }
});

router.put(
  "/api-keys/:keyId",
  [
    authenticateToken,
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Name must be between 1 and 50 characters"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
    body("model")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Model name must be between 1 and 50 characters"),
    body("rateLimits")
      .optional()
      .isObject()
      .withMessage("Rate limits must be an object"),
    body("rateLimits.requestsPerMinute")
      .optional()
      .custom((value) => {
        if (value === undefined || value === null || value === "") return true;
        const num = parseInt(value);
        return !isNaN(num) && num >= 1;
      })
      .withMessage("Requests per minute must be a positive integer"),
    body("rateLimits.requestsPerDay")
      .optional()
      .custom((value) => {
        if (value === undefined || value === null || value === "") return true;
        const num = parseInt(value);
        return !isNaN(num) && num >= 1;
      })
      .withMessage("Requests per day must be a positive integer"),
    body("rateLimits.tokensPerMinute")
      .optional()
      .custom((value) => {
        if (value === undefined || value === null || value === "") return true;
        const num = parseInt(value);
        return !isNaN(num) && num >= 1;
      })
      .withMessage("Tokens per minute must be a positive integer"),
    body("rateLimits.maxTokensPerRequest")
      .optional()
      .custom((value) => {
        if (value === undefined || value === null || value === "") return true;
        const num = parseInt(value);
        return !isNaN(num) && num >= 1;
      })
      .withMessage("Max tokens per request must be a positive integer"),
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

      const { keyId } = req.params;
      const { name, isActive, model, rateLimits } = req.body;

      const userDoc = await db.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      const apiKeys = userData.apiKeys || [];

      const keyIndex = apiKeys.findIndex((key) => key.id === keyId);
      if (keyIndex === -1) {
        return res.status(404).json({
          error: "Not Found",
          message: "API key not found",
        });
      }

      if (name !== undefined) {
        if (
          apiKeys.some((key, index) => index !== keyIndex && key.name === name)
        ) {
          return res.status(400).json({
            error: "Duplicate Key",
            message: "An API key with this name already exists",
          });
        }
        apiKeys[keyIndex].name = name;
      }

      if (isActive !== undefined) {
        apiKeys[keyIndex].isActive = isActive;
      }

      if (model !== undefined) {
        apiKeys[keyIndex].model = model;
      }

      if (rateLimits !== undefined) {
        const currentRateLimits = apiKeys[keyIndex].rateLimits || {};
        const newRateLimits = { ...currentRateLimits };

        if (rateLimits.requestsPerMinute !== undefined) {
          newRateLimits.requestsPerMinute = rateLimits.requestsPerMinute;
        }
        if (rateLimits.requestsPerDay !== undefined) {
          newRateLimits.requestsPerDay = rateLimits.requestsPerDay;
        }
        if (rateLimits.tokensPerMinute !== undefined) {
          newRateLimits.tokensPerMinute = rateLimits.tokensPerMinute;
        }
        if (rateLimits.maxTokensPerRequest !== undefined) {
          newRateLimits.maxTokensPerRequest = rateLimits.maxTokensPerRequest;
        }

        apiKeys[keyIndex].rateLimits = newRateLimits;
      }

      await db.collection("users").doc(req.user.uid).update({
        apiKeys,
      });

      res.json({
        message: "API key updated successfully",
        key: {
          id: apiKeys[keyIndex].id,
          name: apiKeys[keyIndex].name,
          provider: apiKeys[keyIndex].provider,
          model: apiKeys[keyIndex].model,
          isActive: apiKeys[keyIndex].isActive,
          createdAt: apiKeys[keyIndex].createdAt,
          lastUsed: apiKeys[keyIndex].lastUsed,
          usageStats: apiKeys[keyIndex].usageStats,
          rateLimits: apiKeys[keyIndex].rateLimits,
        },
      });
    } catch (error) {
      console.error("Error updating API key:", error);
      console.error("Error details:", error.message);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to update API key",
      });
    }
  }
);

router.delete("/api-keys/:keyId", authenticateToken, async (req, res) => {
  try {
    const { keyId } = req.params;

    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const userData = userDoc.data();
    const apiKeys = userData.apiKeys || [];

    const keyIndex = apiKeys.findIndex((key) => key.id === keyId);
    if (keyIndex === -1) {
      return res.status(404).json({
        error: "Not Found",
        message: "API key not found",
      });
    }

    apiKeys.splice(keyIndex, 1);

    await db.collection("users").doc(req.user.uid).update({
      apiKeys,
    });

    res.json({ message: "API key deleted successfully" });
  } catch (error) {
    console.error("Error deleting API key:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete API key",
    });
  }
});

function getDefaultModel(provider) {
  switch (provider) {
    case "openai":
      return "gpt-4o";
    case "gemini":
      return "gemini-2.0-flash";
    case "claude":
      return "claude-3-5-sonnet-20241022";
    default:
      return "gpt-4o";
  }
}

module.exports = router;
