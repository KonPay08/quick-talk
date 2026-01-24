# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quick Talk is an English conversation phrase practice website designed for personal use, focused on travel scenarios. The app enables users to browse phrases by scene, search by keyword, and practice pronunciation using TTS-generated audio.

**Target User**: Single user (personal use), primarily on mobile during travel
**Core Flow**: Scene → Phrase List → Phrase Detail → Audio Playback

## Architecture

### Stack
- **Frontend**: Next.js (App Router) with TypeScript, hosted on Vercel
- **Database**: Supabase (PostgreSQL)
- **Audio Storage**: AWS S3
- **Audio Generation**: OpenAI Text-to-Speech API
- **Data Management**: Local Node.js scripts (not exposed to frontend)

### Security Model
- Next.js app is **read-only** (no mutations from the frontend)
- Supabase RLS enabled with only SELECT permissions for public access
- Data import and audio generation run **locally only** via scripts
- OpenAI API keys stored in local environment variables only
- Never expose OPENAI_API_KEY or service keys to the browser

### Data Flow
1. **Data Import**: Local scripts read JSON → Upsert to Supabase → Generate missing audio → Upload to S3
2. **Audio Generation**: Identify phrases with empty `audio_s3_key` → Call OpenAI TTS → Upload MP3 to S3 → Update DB
3. **Frontend**: SSR fetches from Supabase → Renders with S3 audio URLs

## Database Schema

### Table: `scenes`
- `id` (uuid, primary key)
- `slug` (text, unique) - URL-friendly identifier
- `title` (text) - Display name (e.g., "空港", "ホテル")
- `sort_order` (int) - Display order
- `created_at`, `updated_at` (timestamptz)

### Table: `phrases`
- `id` (uuid, primary key)
- `scene_id` (uuid, foreign key to scenes)
- `english` (text, not null) - English phrase
- `japanese` (text, not null) - Japanese translation
- `note` (text, nullable) - Additional context
- `audio_s3_key` (text, nullable) - S3 object key (e.g., `audio/airport/{uuid}.mp3`)
- `audio_status` (text, default 'pending') - Status: pending/done/failed
- `created_at`, `updated_at` (timestamptz)

**Indexes**:
- `phrases.scene_id` (for scene-based queries)
- `phrases.english` with `pg_trgm` GIN index (for case-insensitive partial search)

```sql
create extension if not exists pg_trgm;
create index phrases_english_trgm on phrases using gin (english gin_trgm_ops);
```

## Repository Structure (Planned)

```
app/                    # Next.js App Router pages
  page.tsx              # Home: scene list + search
  scenes/[slug]/page.tsx  # Phrase list for a scene
  phrases/[id]/page.tsx   # Phrase detail + audio player

lib/                    # Data access layer (SSR only)
  supabaseServer.ts     # Server-side Supabase client
  sceneRepo.ts          # Scene queries
  phraseRepo.ts         # Phrase queries (list, search)
  audioUrl.ts           # S3 URL builder

scripts/                # Local-only data management
  importData.ts         # Import JSON → Supabase
  generateTts.ts        # Generate missing audio via OpenAI TTS

supabase/
  migrations/           # Database schema migrations
```

## Environment Variables

### Vercel (Frontend)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
S3_PUBLIC_BASE_URL=https://s3.amazonaws.com/english-phrases-audio
```

### Local Scripts Only
```
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # For write operations
OPENAI_API_KEY=sk-xxx...
AWS_ACCESS_KEY_ID=AKIAxxx...
AWS_SECRET_ACCESS_KEY=xxx...
AWS_REGION=ap-northeast-1
S3_BUCKET=english-phrases-audio
```

## Data Import Format

JSON file structure for bulk import:

```json
{
  "scenes": [
    {
      "slug": "airport",
      "title": "空港",
      "sortOrder": 10
    }
  ],
  "phrases": [
    {
      "sceneSlug": "airport",
      "english": "Where is the check-in counter?",
      "japanese": "チェックインカウンターはどこですか",
      "note": "",
      "voice": "alloy"
    }
  ]
}
```

## Audio Generation

- **API**: OpenAI Audio API (`/v1/audio/speech`)
- **Models**: `gpt-4o-mini-tts`, `tts-1`, or `tts-1-hd`
- **Format**: MP3
- **S3 Key Pattern**: `audio/{sceneSlug}/{phraseId}.mp3`
- **Generation Logic**: Only generate for phrases where `audio_s3_key IS NULL`
- **Error Handling**: Set `audio_status = 'failed'` on error, allow re-run

## Key Design Principles

1. **Minimize Clicks**: Search → Detail → Play should be fast
2. **Mobile-First**: All UI should work on smartphones
3. **Read-Only Frontend**: No mutations from Next.js app
4. **Script-Based Maintenance**: All data/audio updates via local scripts
5. **Search Priority**: Fast keyword search using `pg_trgm` for case-insensitive partial matches
6. **SSR by Default**: Fetch data server-side for better performance and SEO

## Out of Scope (Not Implemented)

- Learning progress tracking
- Spaced repetition scheduling
- Favorites or bookmarks
- Recording and pronunciation evaluation
- User authentication
- Multi-user support
- Offline mode
