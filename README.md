# SpeakLoop

SpeakLoop is a ShadowVlog-style English listening and shadowing player built with Next.js, React, TypeScript, Tailwind CSS, hls.js, lucide-react, and Supabase-ready data models.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Implemented MVP

- Sentence-first learning page with a custom `<video>` control layer.
- MP4 playback by default, with `.m3u8` HLS support through `hls.js`.
- Dynamic bilingual transcript with active sentence highlighting.
- Click-to-seek subtitles, previous/next sentence navigation, sentence replay, playback rate, fullscreen, and sentence loop.
- Browser recording through `MediaRecorder`, with local playback and re-recording.
- Word cards tied to each subtitle line.
- Local progress and favorites persistence through `localStorage`.
- App routes for home, library, learning player, admin, login, and registration.
- Supabase schema draft in `supabase/schema.sql`.

## Supabase Setup

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Run `supabase/schema.sql` in your Supabase SQL editor to create the MVP tables and row-level security policies.

## Notes

The current product uses demo data from `src/lib/demo-data.ts`. Replace that file with Supabase queries when the backend is ready. The app intentionally does not implement a video playback kernel; it uses browser media playback and layers the shadowing experience on top.
