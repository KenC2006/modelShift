const { getModelRateLimits } = require("../config/rateLimits");

const modelRequestTracker = new Map();
const modelTokenTracker = new Map();
const modelDailyRequestTracker = new Map();

const checkRateLimits = async (
  userId,
  provider,
  model,
  keyId,
  estimatedTokens = 0
) => {
  const now = Date.now();

  let modelLimits = getModelRateLimits(provider, model);

  if (keyId) {
    try {
      const { db } = require("../config/firebase");
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();
      const apiKeys = userData.apiKeys || [];
      const selectedKey = apiKeys.find((key) => key.id === keyId);

      if (selectedKey && selectedKey.rateLimits) {
        modelLimits = {
          requestsPerMinute:
            selectedKey.rateLimits.requestsPerMinute ??
            modelLimits.requestsPerMinute,
          requestsPerDay:
            selectedKey.rateLimits.requestsPerDay ?? modelLimits.requestsPerDay,
          tokensPerMinute:
            selectedKey.rateLimits.tokensPerMinute ??
            modelLimits.tokensPerMinute,
          maxTokensPerRequest:
            selectedKey.rateLimits.maxTokensPerRequest ??
            modelLimits.maxTokensPerRequest,
        };
      }
    } catch (error) {
      console.error("Error getting custom rate limits:", error);
    }
  }

  const minuteKey = Math.floor(now / 60000);
  const dayKey = Math.floor(now / (24 * 60 * 60 * 1000));

  const requestKey = `${userId}:${provider}:${model}:requests:${minuteKey}`;
  const tokenKey = `${userId}:${provider}:${model}:tokens:${minuteKey}`;
  const dailyRequestKey = `${userId}:${provider}:${model}:daily:${dayKey}`;

  if (!modelRequestTracker.has(requestKey)) {
    modelRequestTracker.set(requestKey, { count: 0, firstRequest: now });
  }
  if (!modelTokenTracker.has(tokenKey)) {
    modelTokenTracker.set(tokenKey, { tokens: 0, firstRequest: now });
  }
  if (!modelDailyRequestTracker.has(dailyRequestKey)) {
    modelDailyRequestTracker.set(dailyRequestKey, {
      count: 0,
      firstRequest: now,
    });
  }

  const requestTracker = modelRequestTracker.get(requestKey);
  const tokenTracker = modelTokenTracker.get(tokenKey);
  const dailyRequestTracker = modelDailyRequestTracker.get(dailyRequestKey);

  if (
    modelLimits.requestsPerDay &&
    dailyRequestTracker.count >= modelLimits.requestsPerDay
  ) {
    return {
      limited: true,
      error: "Daily Rate Limited",
      message: `Daily rate limit exceeded for ${provider}/${model}. Maximum ${modelLimits.requestsPerDay} requests per day.`,
      retryAfter:
        24 * 60 * 60 -
        Math.floor((now - dailyRequestTracker.firstRequest) / 1000),
    };
  }

  if (
    modelLimits.requestsPerMinute &&
    requestTracker.count >= modelLimits.requestsPerMinute
  ) {
    return {
      limited: true,
      error: "Model Rate Limited",
      message: `Rate limit exceeded for ${provider}/${model}. Maximum ${modelLimits.requestsPerMinute} requests per minute.`,
      retryAfter: 60 - Math.floor((now - requestTracker.firstRequest) / 1000),
    };
  }

  if (
    modelLimits.tokensPerMinute &&
    tokenTracker.tokens + estimatedTokens > modelLimits.tokensPerMinute
  ) {
    return {
      limited: true,
      error: "Token Rate Limited",
      message: `Token limit exceeded for ${provider}/${model}. Maximum ${modelLimits.tokensPerMinute} tokens per minute.`,
      retryAfter: 60 - Math.floor((now - tokenTracker.firstRequest) / 1000),
    };
  }

  requestTracker.count++;
  tokenTracker.tokens += estimatedTokens;
  dailyRequestTracker.count++;

  const twoMinutesAgo = Math.floor((now - 120000) / 60000);
  const twoDaysAgo = Math.floor(
    (now - 2 * 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000)
  );

  for (const [key] of modelRequestTracker.entries()) {
    const keyMinute = parseInt(key.split(":").pop());
    if (keyMinute < twoMinutesAgo) {
      modelRequestTracker.delete(key);
    }
  }
  for (const [key] of modelTokenTracker.entries()) {
    const keyMinute = parseInt(key.split(":").pop());
    if (keyMinute < twoMinutesAgo) {
      modelTokenTracker.delete(key);
    }
  }
  for (const [key] of modelDailyRequestTracker.entries()) {
    const keyDay = parseInt(key.split(":").pop());
    if (keyDay < twoDaysAgo) {
      modelDailyRequestTracker.delete(key);
    }
  }

  return { limited: false, modelLimits };
};

const modelRateLimiting = async (req, res, next) => {
  next();
};

module.exports = { modelRateLimiting, checkRateLimits };
