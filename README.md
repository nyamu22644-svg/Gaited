<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GAITED

Kenyan academic marketplace with a study engine for active recall, exam prep, and guided learning.

## Features

- Marketplace pages (notes, sellers, bounties)
- Study engine: ingestion, recall, mastery, exam mode
- PDF/DOCX parsing with OCR for scans and images
- PWA support (installable)

## Tech

- Vite + React + TypeScript
- Supabase auth
- Gemini API (optional)

## Local setup

**Prerequisites:** Node.js 18+

1) Install dependencies
```
npm install
```

2) Create `.env.local`
```
GEMINI_API_KEY=your_key_here
```

3) Run dev server
```
npm run dev
```

## Build

```
npm run build
```

## Deploy (Vercel)

```
vercel --prod
```
