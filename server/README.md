# ModelShift Server Setup

## Environment Variables Required

Create a `.env` file in the server directory with the following variables:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com

# Encryption Key (32 bytes base64 encoded)
ENCRYPTION_KEY=your-32-byte-base64-encoded-encryption-key

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Getting Firebase Service Account Key

1. Go to Firebase Console
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Copy the values from the JSON to your `.env` file

## Generating Encryption Key

Run this command to generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Starting the Server

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

   Or for development with auto-restart:

   ```bash
   npm run dev
   ```

The server will run on port 5000 by default.

## Troubleshooting

- Make sure all environment variables are set
- Check that Firebase service account has proper permissions
- Ensure the encryption key is exactly 32 bytes when base64 decoded
- Verify the server is running on port 5000
