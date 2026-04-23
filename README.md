## Minutes Map Teams

Initial Next.js + Tailwind scaffold for an NBA team site that will eventually grow into per-team pages and shared league data.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- ESLint
- npm

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `npm run dev` starts the local dev server
- `npm run build` creates a production build
- `npm run start` runs the production server
- `npm run lint` runs ESLint
- `npm run typecheck` runs TypeScript without emitting files

## Structure

- `src/app` route segments, root layout, and pages
- `src/components` shared UI
- `src/lib` site config and future utilities
- `src/data` placeholder for NBA team data and content files
- `public` static assets

## Deploying To Vercel

This scaffold is ready to deploy on Vercel as-is. Once the repo is on GitHub, import it into Vercel and it should detect the Next.js settings automatically.

## Next Steps

- Add team metadata in `src/data`
- Create `src/app/teams/[teamSlug]/page.tsx`
- Add navigation, team branding, and content models
