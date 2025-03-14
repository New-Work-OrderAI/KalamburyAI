# AI Pictionary

A Pictionary game where you draw pictures based on prompts generated by Grok 2, and multiple AI models (Llama 3.2 Vision, Claude 3.7 Sonnet, Gemma 3, and Phi-4) compete to guess what you're drawing in real-time.

## Features

- Canvas for drawing with mouse or touch
- AI-generated drawing prompts using Grok 2 via OpenRouter
- Multiple AI models competing to guess your drawings in real-time
- 1-minute time limit for drawing
- Responsive design for desktop and mobile

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenRouter API key with access to the required models

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ai-pictionary.git
   cd ai-pictionary
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up API keys:
   - For local development:
     - Copy `.env.example` to `.env`
     - Add your OpenRouter API key to the `.env` file
   - For deployment:
     - Add your OpenRouter API key as a GitHub Secret (see Deployment section)
   - Make sure your OpenRouter account has access to the required models:
     - x-ai/grok-2-1212
     - meta-llama/llama-3.2-11b-vision-instruct
     - anthropic/claude-3.7-sonnet
     - google/gemma-3-27b-it:free
     - microsoft/phi-4-multimodal-instruct

4. Start the development server:
   ```
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Play

1. Click "Get a Prompt" to receive a word or phrase to draw
2. You have 1 minute to draw the prompt on the canvas
3. As you draw, multiple AI models will analyze your drawing in real-time
4. When the time is up or you click "Submit Drawing", the final guesses from all models will be displayed
5. See which AI model guessed correctly!
6. Click "Play Again" to start a new round

## Technologies Used

- React
- HTML5 Canvas
- OpenRouter API for access to multiple AI models:
  - Grok 2 (for prompt generation)
  - Llama 3.2 Vision
  - Claude 3.7 Sonnet
  - Gemma 3
  - Phi-4 Multimodal

## Future Enhancements

- Multiplayer mode
- Customizable drawing tools (colors, brush sizes)
- Score tracking
- Gallery of past drawings and guesses
- Leaderboard of AI model performance

## Deployment

This app is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setting up GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Name: `OPENROUTER_API_KEY`
5. Value: Your OpenRouter API key
6. Click "Add secret"

### Manual Deployment

If you prefer to deploy manually:

```
npm run deploy
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 