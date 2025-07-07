# modelShift - AI Comparison Tool

A powerful web application that allows you to compare responses from multiple AI models side by side. Send the same prompt to different AI providers and see how they respond differently.

## Features

### 🤖 Multi-AI Comparison

- Send the same prompt to multiple AI models simultaneously
- Compare responses from OpenAI, Gemini, Claude, and more
- Side-by-side comparison view with color-coded cards
- Real-time response tracking

### 🎨 Beautiful UI

- Modern, responsive design with Tailwind CSS
- Dark/light theme support
- Customizable color schemes
- Compact and expanded view modes

### ⚙️ Advanced Settings

- Customizable system prompts
- Adjustable temperature and token limits
- Markdown rendering support
- Export/import comparison results

### 🔐 Secure API Key Management

- Encrypted API key storage
- Multiple provider support
- Usage statistics and monitoring
- Rate limiting and abuse detection

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project (for authentication and data storage)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd modelShift
```

2. Install dependencies for both client and server:

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Set up environment variables:

   - Create `.env` files in both `client/` and `server/` directories
   - Add your Firebase configuration and other required environment variables

4. Start the development servers:

```bash
# Start the server (from server directory)
npm start

# Start the client (from client directory, in a new terminal)
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

### Adding API Keys

1. Go to Settings
2. Click "Add API Key"
3. Select your AI provider (OpenAI, Gemini, Claude)
4. Enter your API key and model name
5. Save and activate the key

### Comparing AI Responses

1. Select the AI models you want to compare
2. Enter your prompt in the input field
3. Click "Send" or press Enter
4. View the responses side by side in comparison cards
5. Copy, download, or export individual responses

### Customizing Settings

- Adjust system prompts for different use cases
- Modify temperature and token limits
- Enable/disable features like markdown rendering
- Customize the UI appearance

## Supported AI Providers

- **OpenAI**: GPT-4, GPT-3.5-turbo, and other OpenAI models
- **Google Gemini**: Gemini Pro, Gemini Flash, and other Gemini models
- **Anthropic Claude**: Claude 3, Claude 2, and other Claude models

## Architecture

### Frontend (React)

- Modern React with hooks and context
- Tailwind CSS for styling
- Responsive design with mobile support
- Real-time updates and animations

### Backend (Node.js/Express)

- RESTful API with Express
- Firebase integration for authentication and data storage
- Rate limiting and abuse detection
- Encrypted API key storage

### Key Components

- `AIComparison`: Main comparison interface
- `ComparisonResult`: Individual AI response cards
- `ComparisonSettingsPanel`: Settings and configuration
- `KeySelector`: API key management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue on GitHub or contact the development team.
