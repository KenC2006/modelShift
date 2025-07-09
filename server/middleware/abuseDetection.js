const { db } = require("../config/firebase");
const { getGeneralRateLimits } = require("../config/rateLimits");

const requestTracker = new Map();
const blockedUsers = new Map();

const abuseDetection = async (req, res, next) => {
  const userId = req.user.uid;
  const now = Date.now();

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

  const minuteKey = Math.floor(now / 60000);
  const userKey = `${userId}:${minuteKey}`;

  if (!requestTracker.has(userKey)) {
    requestTracker.set(userKey, { count: 0, firstRequest: now });
  }

  const tracker = requestTracker.get(userKey);
  tracker.count++;

  const generalLimits = getGeneralRateLimits();
  const maxRequestsPerMinute = generalLimits.MAX_REQUESTS_PER_MINUTE;
  if (tracker.count > maxRequestsPerMinute) {
    const blockDuration = generalLimits.BLOCK_DURATION_MINUTES;
    const blockUntil = now + blockDuration * 60 * 1000;

    blockedUsers.set(userId, {
      until: blockUntil,
      reason: "Excessive requests",
    });

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

  if (req.body && req.body.message) {
    const message = req.body.message.toLowerCase();

    const spamPatterns = [
      /(.)\1{10,}/,
      /(.)\1{3,}(.)\2{3,}(.)\3{3,}/,
      /(.){100,}/,
      /\b(spam|test|hello world)\b.*\1.*\1.*\1/,
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
      ip: "tracked_via_user_id",
    });
  } catch (error) {
    console.error("Failed to log abuse attempt:", error);
  }
}

module.exports = abuseDetection;
