const { getModelRateLimits } = require("../config/rateLimits");

// In-memory store for tracking model-specific requests (in production, use Redis)
const modelRequestTracker = new Map();
const modelTokenTracker = new Map();

const modelRateLimiting = async (req, res, next) => {
  const userId = req.user.uid;
  const { provider, model } = req.body;
  const now = Date.now();

  if (!provider || !model) {
    return next(); // Skip if no provider/model specified
  }

  const modelLimits = getModelRateLimits(provider, model);
  const minuteKey = Math.floor(now / 60000);

  // Track requests per minute per model
  const requestKey = `${userId}:${provider}:${model}:requests:${minuteKey}`;
  const tokenKey = `${userId}:${provider}:${model}:tokens:${minuteKey}`;

  // Initialize trackers if they don't exist
  if (!modelRequestTracker.has(requestKey)) {
    modelRequestTracker.set(requestKey, { count: 0, firstRequest: now });
  }
  if (!modelTokenTracker.has(tokenKey)) {
    modelTokenTracker.set(tokenKey, { tokens: 0, firstRequest: now });
  }

  const requestTracker = modelRequestTracker.get(requestKey);
  const tokenTracker = modelTokenTracker.get(tokenKey);

  // Check request rate limit
  if (requestTracker.count >= modelLimits.requestsPerMinute) {
    return res.status(429).json({
      error: "Model Rate Limited",
      message: `Rate limit exceeded for ${provider}/${model}. Maximum ${modelLimits.requestsPerMinute} requests per minute.`,
      retryAfter: 60 - Math.floor((now - requestTracker.firstRequest) / 1000),
    });
  }

  // Check token rate limit (estimate based on message length)
  const estimatedTokens = Math.ceil(req.body.message.length / 4); // Rough estimate
  if (tokenTracker.tokens + estimatedTokens > modelLimits.tokensPerMinute) {
    return res.status(429).json({
      error: "Token Rate Limited",
      message: `Token limit exceeded for ${provider}/${model}. Maximum ${modelLimits.tokensPerMinute} tokens per minute.`,
      retryAfter: 60 - Math.floor((now - tokenTracker.firstRequest) / 1000),
    });
  }

  // Increment counters
  requestTracker.count++;
  tokenTracker.tokens += estimatedTokens;

  // Store the limits in the request for later use
  req.modelLimits = modelLimits;

  // Clean up old tracking data (older than 2 minutes)
  const twoMinutesAgo = Math.floor((now - 120000) / 60000);
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

  next();
};

module.exports = modelRateLimiting;
