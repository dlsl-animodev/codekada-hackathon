# AI-Powered Isometric Escape Room

An interactive browser-based escape room game with AI guidance, voice commands, and 3D isometric graphics built for hackathon rapid prototyping.

## Features

- Isometric 3D room rendering with React Three Fiber
- AI-powered hints via Gemini Live API (voice inputs)
- Voice output support using Web Speech API
- Text chat fallback for AI interaction
- Interactive objects with visual feedback
- Responsive UI with TailwindCSS

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 18
- **3D Rendering**: React Three Fiber + Drei
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **AI Integration**: Google Gemini API
- **Voice Input**: Web Speech API
- **TypeScript**: Full type safety
- **Deployment**: Vercel

## Project Structure

```
codekada-hackathon/
├── public/
│   ├── textures/         # 3D texture files
│   ├── models/           # 3D model files (.glb, .gltf)
│   ├── sounds/           # Audio files
│   └── favicon.svg       # Site icon
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── ai/
│   │   │       └── route.ts    # Gemini AI API endpoint
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Main game page
│   │   └── globals.css         # Global styles
│   ├── components/
│   ├── scenes/
│   ├── hooks/
│   └── types/
│       └── index.ts            # TypeScript definitions
├── .env.local.example          # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm 9+
- Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone or download this repository**

```bash
cd codekada-hackathon
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Gemini API key:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_GEMINI_MODEL=gemini-1.5-flash
```

4. **Run the development server**

```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## Game Mechanics

### Interactable Objects

1. **Safe** - Locked with a 4-digit code (answer: 7392)
2. **Painting** - Contains a hidden clue
3. **Desk** - Can be searched for items

### How to Play

1. Click on objects in the 3D room to interact
2. Use voice input (microphone button) or type messages to talk to the AI
3. Ask the AI for hints when stuck
4. Solve puzzles to progress
5. Try to escape the room

### AI Guide

The AI assistant:
- Provides contextual hints based on your actions
- Validates puzzle solutions
- Gives atmospheric descriptions
- Never reveals full solutions directly
- Responds to both voice and text input

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Deploy**

```bash
vercel
```

3. **Add environment variables in Vercel dashboard**

- Go to your project settings
- Add `NEXT_PUBLIC_GEMINI_API_KEY` and `NEXT_PUBLIC_GEMINI_MODEL`

### Option 2: Deploy via GitHub

1. **Push code to GitHub**

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. **Connect to Vercel**

- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Add environment variables
- Deploy

### Environment Variables for Production

In Vercel dashboard, add:

```
NEXT_PUBLIC_GEMINI_API_KEY = your_gemini_api_key
NEXT_PUBLIC_GEMINI_MODEL = gemini-1.5-flash
```

## Browser Compatibility

- **Voice Input**: Chrome, Edge, Safari (latest versions)
- **3D Graphics**: All modern browsers with WebGL support
- **Fallback**: Text input works on all browsers

## Customization

### Adding More Objects

1. Edit `src/scenes/IsometricRoom.tsx`
2. Add new `<InteractableObject>` components
3. Update AI prompt in `src/app/api/ai/route.ts`

### Changing AI Personality

Edit the system prompt in `src/app/api/ai/route.ts`:

```typescript
const systemPrompt = `Your custom AI personality here...`;
```

### Modifying Puzzles

Update puzzle logic in:
- `src/hooks/useGameState.ts` - Game state
- `src/app/api/ai/route.ts` - AI responses
- `src/scenes/InteractableObject.tsx` - Object interactions

## Troubleshooting

### Voice Input Not Working

- Ensure you're using HTTPS (required for Web Speech API)
- Check browser microphone permissions
- Use Chrome or Edge for best compatibility
- Fallback to text input if needed

### 3D Scene Not Rendering

- Check browser console for WebGL errors
- Ensure browser supports WebGL 2.0
- Try updating graphics drivers
- Use a different browser

### AI Not Responding

- Verify `.env.local` has correct Gemini API key
- Check API key has quota available
- Check browser console for fetch errors
- Verify internet connection

### Build Errors

```bash
# clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

## Future Enhancements

- Multiple rooms/levels
- Inventory system
- More complex puzzles
- 3D models instead of basic shapes
- Sound effects and background music
- Multiplayer support
- Save/load game state
- Mobile touch controls
- AI voice output (text-to-speech)

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Drei Helpers](https://github.com/pmndrs/drei)
- [Gemini API Docs](https://ai.google.dev/docs)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
