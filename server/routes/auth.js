const express = require("express");
const { body, validationResult } = require("express-validator");
const { db } = require("../config/firebase");
const { encrypt, decrypt } = require("../utils/encryption");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// Verify user token and get user info
router.get("/verify", authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();

    if (!userDoc.exists) {
      // Create new user document
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

    // Update last login
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

// Add API key
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

      // Encrypt the API key
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

      // Check if key with same name already exists
      const userDoc = await db.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();
      const existingKeys = userData.apiKeys || [];

      if (existingKeys.some((k) => k.name === name)) {
        return res.status(400).json({
          error: "Duplicate Key",
          message: "An API key with this name already exists",
        });
      }

      // Add new API key
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

// Get API keys
router.get("/api-keys", authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const userData = userDoc.data();
    const apiKeys = userData.apiKeys || [];

    // Import rate limits function
    const { getModelRateLimits } = require("../config/rateLimits");

    // Return keys without encrypted data, including rate limits
    const safeKeys = apiKeys.map((key) => {
      const rateLimits = getModelRateLimits(key.provider, key.model);
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

// Update API key
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
      const { name, isActive, model } = req.body;

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

      // Update key properties
      if (name !== undefined) {
        // Check for duplicate names
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
        },
      });
    } catch (error) {
      console.error("Error updating API key:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to update API key",
      });
    }
  }
);

// Delete API key
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
