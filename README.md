# modelShift

Web application that allows you to manage multiple AI API keys and switch between different AI providers (OpenAI, Google Gemini, Anthropic Claude) in a single chat interface. Automatically swaps to different model to avoid rate limits.

## What it does

- **Multi-Provider Support**: Connect and manage API keys from OpenAI, Google Gemini, and Anthropic Claude
- **Smart Key Selection**: Automatically selects the best available API key based on usage patterns and error rates
- **Fallback System**: If one API key fails, automatically tries another available key
- **Usage Tracking**: Monitor your API usage across all providers with detailed statistics
- **Secure Storage**: All API keys are encrypted and stored securely
- **Real-time Chat**: Chat with AI models through a clean, responsive interface

## Key Features

- **Authentication**: Secure login with Google or email/password
- **API Key Management**: Add, edit, activate/deactivate, and delete API keys
- **Usage Analytics**: Track requests, tokens, and errors for each API key
- **Rate Limiting**: Built-in protection against abuse with configurable limits
- **Responsive Design**: Works on desktop and mobile devices

## How it works

1. **Add API Keys**: Connect your API keys from different AI providers
2. **Start Chatting**: The system automatically selects the best available key
3. **Monitor Usage**: Track your consumption and performance across all providers
4. **Switch Seamlessly**: If one provider is down or rate-limited, it automatically falls back to another

## Technology Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Security**: Rate limiting, input validation, and encryption
