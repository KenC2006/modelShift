// Rate limit constants for different models and general usage

// General rate limits
const GENERAL_RATE_LIMITS = {
  // Global rate limiting (per IP)
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // requests per window

  // Per-user rate limiting
  MAX_REQUESTS_PER_MINUTE: parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 60,
  BLOCK_DURATION_MINUTES: parseInt(process.env.BLOCK_DURATION_MINUTES) || 30,
};

// Model-specific rate limits
const MODEL_RATE_LIMITS = {
  // OpenAI models - Updated with latest models
  openai: {
    "gpt-4o": {
      requestsPerMinute: 20,
      requestsPerDay: 1000,
      tokensPerMinute: 100000,
      maxTokensPerRequest: 128000,
    },
    "gpt-4o-mini": {
      requestsPerMinute: 25,
      requestsPerDay: 1200,
      tokensPerMinute: 120000,
      maxTokensPerRequest: 128000,
    },
    "gpt-4-turbo": {
      requestsPerMinute: 15,
      requestsPerDay: 800,
      tokensPerMinute: 75000,
      maxTokensPerRequest: 128000,
    },
    "gpt-4": {
      requestsPerMinute: 10,
      requestsPerDay: 500,
      tokensPerMinute: 50000,
      maxTokensPerRequest: 8192,
    },
    "gpt-3.5-turbo": {
      requestsPerMinute: 20,
      requestsPerDay: 1000,
      tokensPerMinute: 100000,
      maxTokensPerRequest: 4096,
    },
    "gpt-3.5-turbo-16k": {
      requestsPerMinute: 15,
      requestsPerDay: 800,
      tokensPerMinute: 150000,
      maxTokensPerRequest: 16384,
    },
  },

  // Google Gemini models - Updated with specified models and daily limits
  gemini: {
    "gemini-2.0-flash": {
      requestsPerMinute: 15,
      requestsPerDay: 1500,
      tokensPerMinute: 80000,
      maxTokensPerRequest: 100000,
    },
    "gemini-2.0-flash-lite": {
      requestsPerMinute: 30,
      requestsPerDay: 1500,
      tokensPerMinute: 100000,
      maxTokensPerRequest: 100000,
    },
    "gemini-2.5-flash": {
      requestsPerMinute: 10,
      requestsPerDay: 500,
      tokensPerMinute: 60000,
      maxTokensPerRequest: 100000,
    },
  },

  // Anthropic Claude models - Updated with latest models
  claude: {
    "claude-3-5-sonnet-20241022": {
      requestsPerMinute: 15,
      requestsPerDay: 800,
      tokensPerMinute: 200000,
      maxTokensPerRequest: 200000,
    },
    "claude-3-5-haiku-20241022": {
      requestsPerMinute: 25,
      requestsPerDay: 1200,
      tokensPerMinute: 150000,
      maxTokensPerRequest: 200000,
    },
    "claude-3-opus-20240229": {
      requestsPerMinute: 5,
      requestsPerDay: 300,
      tokensPerMinute: 200000,
      maxTokensPerRequest: 200000,
    },
    "claude-3-sonnet-20240229": {
      requestsPerMinute: 10,
      requestsPerDay: 600,
      tokensPerMinute: 150000,
      maxTokensPerRequest: 200000,
    },
    "claude-3-haiku-20240307": {
      requestsPerMinute: 20,
      requestsPerDay: 1000,
      tokensPerMinute: 100000,
      maxTokensPerRequest: 200000,
    },
  },
};

// Default rate limits for unknown models
const DEFAULT_RATE_LIMITS = {
  requestsPerMinute: 10,
  requestsPerDay: 500,
  tokensPerMinute: 50000,
  maxTokensPerRequest: 4000,
};

// Helper function to get rate limits for a specific model
function getModelRateLimits(provider, model) {
  const providerLimits = MODEL_RATE_LIMITS[provider];
  if (!providerLimits) {
    return DEFAULT_RATE_LIMITS;
  }

  const modelLimits = providerLimits[model];
  if (!modelLimits) {
    // Return first available model's limits for the provider, or defaults
    const firstModel = Object.values(providerLimits)[0];
    return firstModel || DEFAULT_RATE_LIMITS;
  }

  return modelLimits;
}

// Helper function to get general rate limits
function getGeneralRateLimits() {
  return GENERAL_RATE_LIMITS;
}

module.exports = {
  GENERAL_RATE_LIMITS,
  MODEL_RATE_LIMITS,
  DEFAULT_RATE_LIMITS,
  getModelRateLimits,
  getGeneralRateLimits,
};
