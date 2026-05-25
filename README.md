# Qul

A minimal Next.js app that surfaces every verse of the Qur'an containing the word **Qul** (قُلْ — "Say"), powered by the [Quran Foundation APIs](https://api-docs.quran.foundation).

The CSV source (`lib/qul-occurrences.csv`) records 333 individual occurrences across **307 distinct verses**. Some ayahs contain the imperative more than once; those are labelled with a `2× Qul` / `3× Qul` badge.

## Features

- Browse all 306 Qul-containing verses with Arabic text (Uthmani script) and English translation
- Paginated display (12 verses per page) to avoid rate-limiting
- Bookmark any verse — saved to your Quran Foundation account via the User Bookmarks API
- View and remove your saved bookmarks at `/bookmarks`
- Supports both `prelive` and `production` Quran Foundation environments

## APIs Used

| API | Purpose |
|---|---|
| Content API — `GET /content/api/v4/verses/by_key/:key` | Fetches Arabic text and English translation for each verse |
| User API — `GET /v1/bookmarks` | Lists a user's saved bookmarks |
| User API — `POST /v1/bookmarks` | Saves a verse as a bookmark |
| User API — `DELETE /v1/bookmarks/:id` | Removes a bookmark |

Authentication for the Content API uses **OAuth2 client credentials** (token cached server-side). The User API uses a personal **user access token**.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `QF_CLIENT_ID` | Yes | OAuth2 client ID from the Quran Foundation developer portal |
| `QF_CLIENT_SECRET` | Yes | OAuth2 client secret |
| `QF_USER_ACCESS_TOKEN` | Yes | Personal user access token for the Bookmarks API |
| `QF_ENV` | No | `prelive` (default) or `production` |

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  page.tsx            # Main verse browser with pagination
  bookmarks/page.tsx  # Saved bookmarks view
  actions.ts          # Server actions for add/remove bookmark
lib/
  qf-content.ts       # Content API client (OAuth2 token management)
  qf-user.ts          # User API client (Bookmarks)
  qul-verses.ts       # CSV parser — extracts verse keys and occurrence counts
  qul-occurrences.csv # Source data: 332 Qul occurrences across 306 verses
components/
  bookmark-button.tsx # Client component — optimistic bookmark toggle
```

## Built with v0

This repository is linked to a [v0](https://v0.app) project. Every merge to `main` automatically deploys to Vercel.

[Continue working on v0 →](https://v0.app/chat/projects/prj_d65iSodnQxeAz8rFqUaubPyjiOtQ)

<a href="https://v0.app/chat/api/kiro/clone/saaduddin/qul" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
