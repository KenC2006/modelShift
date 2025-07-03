const { db } = require("../config/firebase");
const { getGeneralRateLimits } = require("../config/rateLimits");

// In-memory store for tracking requests (in production, use Redis)
const requestTracker = new Map();
const blockedUsers = new Map();

const abuseDetection = async (req, res, next) => {
  const userId = req.user.uid;
  const now = Date.now();

  // Check if user is blocked
  if (blockedUsers.has(userId)) {
    const blockInfo = blockedUsers.get(userId);
    if (now < blockInfo.until) {
      return res.status(429).json({
        error: "Rate Limited",
        message: `You are temporarily blocked due to excessive requests. Try again in ${Math.ceil(
          (blockInfo.until - now) / 60000
        )} minutes.`,
        retryAfter: Math.ceil((blockInfo.until - now) / 1000),
      });
    } else {
      blockedUsers.delete(userId);
    }
  }

  // Track requests per minute
  const minuteKey = Math.floor(now / 60000);
  const userKey = `${userId}:${minuteKey}`;

  if (!requestTracker.has(userKey)) {
    requestTracker.set(userKey, { count: 0, firstRequest: now });
  }

  const tracker = requestTracker.get(userKey);
  tracker.count++;

  // Check for excessive requests
  const generalLimits = getGeneralRateLimits();
  const maxRequestsPerMinute = generalLimits.MAX_REQUESTS_PER_MINUTE;
  if (tracker.count > maxRequestsPerMinute) {
    const blockDuration = generalLimits.BLOCK_DURATION_MINUTES;
    const blockUntil = now + blockDuration * 60 * 1000;

    blockedUsers.set(userId, {
      until: blockUntil,
      reason: "Excessive requests",
    });

    // Log abuse attempt
    await logAbuseAttempt(userId, "excessive_requests", {
      requestsInMinute: tracker.count,
      maxAllowed: maxRequestsPerMinute,
    });

    return res.status(429).json({
      error: "Rate Limited",
      message: `Too many requests. You are blocked for ${blockDuration} minutes.`,
      retryAfter: blockDuration * 60,
    });
  }

  // Check for spam patterns in message
  if (req.body && req.body.message) {
    const message = req.body.message.toLowerCase();

    // Simple spam detection patterns
    const spamPatterns = [
      /(.)\1{10,}/, // Repeated characters
      /(.)\1{3,}(.)\2{3,}(.)\3{3,}/, // Multiple repeated patterns
      /(.){100,}/, // Very long single character
      /\b(spam|test|hello world)\b.*\1.*\1.*\1/, // Repeated words
    ];

    const isSpam = spamPatterns.some((pattern) => pattern.test(message));

    if (isSpam) {
      await logAbuseAttempt(userId, "spam_detected", {
        messageLength: message.length,
        pattern: "repeated_content",
      });

      return res.status(400).json({
        error: "Spam Detected",
        message:
          "Your message appears to be spam. Please try a different message.",
      });
    }
  }

  // Clean up old tracking data (older than 2 minutes)
  const twoMinutesAgo = Math.floor((now - 120000) / 60000);
  for (const [key, data] of requestTracker.entries()) {
    const keyMinute = parseInt(key.split(":")[1]);
    if (keyMinute < twoMinutesAgo) {
      requestTracker.delete(key);
    }
  }

  next();
};

async function logAbuseAttempt(userId, type, details) {
  try {
    await db.collection("abuse_logs").add({
      userId,
      type,
      details,
      timestamp: new Date(),
      ip: "tracked_via_user_id", // In production, track actual IP
    });
  } catch (error) {
    console.error("Failed to log abuse attempt:", error);
  }
}

module.exports = abuseDetection;
