# modelShift - AI API Key Shifter

A full-stack web application that lets users chat with different AI models using their own API keys. Features secure key management, automatic key rotation, and a beautiful chat interface.

## 🚀 Features

### Frontend

- **React-based chatbot UI** similar to ChatGPT
- **Firebase Authentication** (Google + Email/Password)
- **Modern UI** with Tailwind CSS
- **Real-time chat** with AI models
- **API key management** interface
- **Usage statistics** dashboard

### Backend

- **Node.js + Express** server
- **Firebase Admin SDK** for authentication
- **Secure API key storage** with encryption
- **Automatic key rotation** when keys fail
- **Usage tracking** per key and user
- **Abuse detection** and rate limiting

### Security

- **Encrypted API key storage** at rest
- **HTTPS-only communication**
- **Input sanitization** and validation
- **Rate limiting** and abuse prevention
- **Secure Firebase rules**

### Supported AI Providers

- **OpenAI** (GPT-4, GPT-3.5-turbo)
- **Google Gemini** (Gemini Pro)
- **Anthropic Claude** (Claude 3)

## 🛠️ Tech Stack

- **Frontend**: React 18, Tailwind CSS, Firebase Auth
- **Backend**: Node.js, Express, Firebase Admin SDK
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Security**: Helmet, CORS, Rate Limiting, Input Validation

## 📋 Prerequisites

- Node.js 16+ and npm
- Firebase project with Authentication and Firestore enabled
- API keys from supported AI providers

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd modelShift
```

### 2. Install Dependencies

```bash
# Install all dependencies (root, server, and client)
npm run install-all
```

### 3. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Google + Email/Password)
3. Enable Firestore Database
4. Create a service account and download the JSON file
5. Set up Firestore security rules

### 4. Environment Configuration

#### Backend (.env in server directory)

```bash
# Copy the example file
cp server/env.example server/.env

# Edit with your Firebase service account details
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your-cert-url

# Server Configuration
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Abuse Detection
MAX_REQUESTS_PER_MINUTE=60
MAX_FAILED_ATTEMPTS=5
BLOCK_DURATION_MINUTES=30
```

#### Frontend (.env in client directory)

```bash
# Copy the example file
cp client/env.example client/.env

# Edit with your Firebase config
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id

# API Configuration
REACT_APP_API_URL=http://localhost:5000
```

### 5. Firestore Security Rules

Set up these security rules in your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Abuse logs (read-only for admins)
    match /abuse_logs/{logId} {
      allow read: if request.auth != null && request.auth.token.admin == true;
      allow write: if false;
    }
  }
}
```

### 6. Run the Application

```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or run separately:
# Backend only
npm run server

# Frontend only
npm run client
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📖 Usage

### 1. Authentication

- Sign up/sign in with Google or email/password
- Your account will be created automatically

### 2. Add API Keys

- Go to Settings → API Keys
- Click "Add API Key"
- Enter your API key details:
  - **Name**: A friendly name for your key
  - **Provider**: OpenAI, Gemini, or Claude
  - **Model**: The specific model to use (optional)
  - **API Key**: Your actual API key

### 3. Start Chatting

- Go to the Chat page
- Select an API key from the dropdown
- Type your message and press Enter
- The system will automatically rotate keys if one fails

### 4. Monitor Usage

- View usage statistics in Settings
- Track requests, tokens, and errors per key
- Monitor overall usage patterns

## 🔧 Configuration

### Rate Limiting

Adjust rate limits in `server/.env`:

```bash
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # requests per window
MAX_REQUESTS_PER_MINUTE=60   # per minute limit
```

### Security

- Change `ENCRYPTION_KEY` to a secure 32-character string
- Set `JWT_SECRET` to a secure random string
- Configure CORS origins for production

## 🚀 Deployment

### Backend Deployment

1. Set up a Node.js hosting service (Heroku, Railway, etc.)
2. Configure environment variables
3. Deploy the `server` directory

### Frontend Deployment

1. Build the React app: `npm run build`
2. Deploy to static hosting (Vercel, Netlify, etc.)
3. Update `REACT_APP_API_URL` to your backend URL

### Firebase Configuration

1. Set up custom domain in Firebase Console
2. Configure authentication providers
3. Update Firestore security rules for production

## 🔒 Security Features

- **API Key Encryption**: All keys are encrypted using AES-256-GCM
- **Input Sanitization**: Prevents XSS and injection attacks
- **Rate Limiting**: Prevents abuse and excessive usage
- **Abuse Detection**: Blocks spam and repeated failed attempts
- **Secure Headers**: Helmet.js for security headers
- **CORS Protection**: Configured for secure cross-origin requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:

1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## 🔮 Roadmap

- [ ] Claude API integration
- [ ] Conversation history persistence
- [ ] Advanced usage analytics
- [ ] API key expiration management
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Team collaboration features
