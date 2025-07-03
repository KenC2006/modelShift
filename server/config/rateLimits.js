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
  // OpenAI models
  openai: {
    gpt_4: {
      requestsPerMinute: 10,
      tokensPerMinute: 50000,
      maxTokensPerRequest: 4000,
    },
    gpt_4_turbo: {
      requestsPerMinute: 15,
      tokensPerMinute: 75000,
      maxTokensPerRequest: 4000,
    },
    gpt_3_5_turbo: {
      requestsPerMinute: 20,
      tokensPerMinute: 100000,
      maxTokensPerRequest: 4000,
    },
    gpt_3_5_turbo_16k: {
      requestsPerMinute: 15,
      tokensPerMinute: 150000,
      maxTokensPerRequest: 16000,
    },
  },

  // Google Gemini models
  gemini: {
    gemini_pro: {
      requestsPerMinute: 15,
      tokensPerMinute: 60000,
      maxTokensPerRequest: 30000,
    },
    gemini_pro_vision: {
      requestsPerMinute: 10,
      tokensPerMinute: 40000,
      maxTokensPerRequest: 30000,
    },
  },

  // Anthropic Claude models
  claude: {
    claude_3_opus: {
      requestsPerMinute: 5,
      tokensPerMinute: 200000,
      maxTokensPerRequest: 200000,
    },
    claude_3_sonnet: {
      requestsPerMinute: 10,
      tokensPerMinute: 150000,
      maxTokensPerRequest: 200000,
    },
    claude_3_haiku: {
      requestsPerMinute: 20,
      tokensPerMinute: 100000,
      maxTokensPerRequest: 200000,
    },
  },
};

// Default rate limits for unknown models
const DEFAULT_RATE_LIMITS = {
  requestsPerMinute: 10,
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
