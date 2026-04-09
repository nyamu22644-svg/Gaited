<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GAITED

GAITED is a Kenyan academic marketplace with a built-in study engine for active recall, exam prep, and guided learning.

## Highlights

- Marketplace for notes, sellers, and bounties
- Study engine: ingestion, recall, mastery, exam mode
- PDF/DOCX parsing with OCR for scans and images
- PWA-ready install on mobile

## Stack

- Vite + React + TypeScript
- Supabase auth
- Gemini API (optional)

## Quick start

**Prerequisites:** Node.js 18+

1) Install dependencies
```
npm install
```

2) Create `.env.local`
```
GEMINI_API_KEY=your_key_here
```

3) Run the dev server
```
npm run dev
```

## Scripts

```
npm run dev
npm run build
npm run preview
```

## Deployment (Vercel)

```
vercel --prod
```
