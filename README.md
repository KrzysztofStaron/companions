This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# OpenRouter API Key for chat functionality (using gpt-4.1-nano-2025-04-14)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Fish Audio Configuration for TTS (primary and only TTS provider)
FISH_API_KEY=your_fish_audio_api_key_here
MODEL_ID=your_fish_audio_model_id_here

# Replicate API Token for image generation (Google Imagen 4 Fast)
REPLICATE_API_TOKEN=your_replicate_api_token_here

# Site URL for OpenRouter HTTP-Referer header (optional)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### OpenRouter Setup

1. Get your API key from [OpenRouter](https://openrouter.ai/)
2. Add credits to your OpenRouter account
3. Add `OPENROUTER_API_KEY` to your `.env.local` file
4. The app uses the `gpt-4.1-nano-2025-04-14` model for cost-effective conversations

#### Fish Audio Setup

1. Get your API key from [Fish Audio](https://fish.audio/)
2. Upload a reference audio file or choose a model from the playground
3. Get the model ID from the Fish Audio dashboard
4. Add both `FISH_API_KEY` and `MODEL_ID` to your `.env.local` file

#### Replicate Setup (Image Generation)

1. Get your API token from [Replicate](https://replicate.com/)
2. Create an account and navigate to your account settings
3. Copy your API token from the dashboard
4. Add `REPLICATE_API_TOKEN` to your `.env.local` file

The app uses Replicate's Google Imagen 4 Fast model for high-quality background image generation. If Replicate fails, it automatically falls back to Google Gemini through OpenRouter.

The app uses Fish Audio as the primary and only TTS provider. Chat functionality is powered by OpenRouter using the gpt-4.1-nano-2025-04-14 model for cost-effective conversations.

### Running the Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
