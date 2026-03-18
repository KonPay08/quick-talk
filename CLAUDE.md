# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quick Talk is a foreign language phrase practice website designed for personal use, focused on travel scenarios. The app enables users to browse phrases by scene and practice pronunciation using TTS-generated audio. It supports any language pair (target language and native language).

**Target User**: Single user (personal use), mobile-first design for travel use
**Core Flow**: Scene → Phrase List → Phrase Detail → Audio Playback (3 taps)
**Language Support**: Architecture supports any language pair; **v1.0 scope is English only**
**v1.0 Scope**: Scene browsing + audio playback (no search)

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
- `target_text` (text, not null) - Phrase in target language (language to learn)
- `target_lang` (text, not null) - ISO 639-1 code (e.g., 'en', 'zh', 'ko')
- `native_text` (text, not null) - Translation in native language
- `native_lang` (text, not null) - ISO 639-1 code (e.g., 'ja', 'en', 'zh')
- `note` (text, nullable) - Additional context
- `audio_s3_key` (text, nullable) - S3 object key (e.g., `audio/en/airport/{uuid}.mp3`)
- `audio_status` (text, default 'pending') - Status: pending/done/failed
- `created_at`, `updated_at` (timestamptz)

**Indexes (v1.0)**:
- `phrases.scene_id` (for scene-based queries)
- `(phrases.target_lang, phrases.native_lang)` - Composite index for language pair filtering

**Indexes (v2.0 - search feature)**:
- `phrases.target_text` with `pg_trgm` GIN index (for case-insensitive partial search)

```sql
-- v1.0
create index phrases_scene_id on phrases (scene_id);
create index phrases_lang_pair on phrases (target_lang, native_lang);

-- v2.0 (search feature)
create extension if not exists pg_trgm;
create index phrases_target_text_trgm on phrases using gin (target_text gin_trgm_ops);
```

## Repository Structure (Planned)

```
app/                    # Next.js App Router pages
  page.tsx              # Home: scene list
  scenes/[slug]/page.tsx  # Phrase list for a scene
  phrases/[id]/page.tsx   # Phrase detail + audio player

lib/                    # Data access layer (SSR only)
  supabaseServer.ts     # Server-side Supabase client
  sceneRepo.ts          # Scene queries
  phraseRepo.ts         # Phrase queries (list by scene)
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
S3_PUBLIC_BASE_URL=https://s3.amazonaws.com/quick-talk-phrases-audio
```

### Local Scripts Only
```
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # For write operations
OPENAI_API_KEY=sk-xxx...
AWS_ACCESS_KEY_ID=AKIAxxx...
AWS_SECRET_ACCESS_KEY=xxx...
AWS_REGION=ap-northeast-1
S3_BUCKET=quick-talk-phrases-audio
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
      "targetText": "Where is the check-in counter?",
      "targetLang": "en",
      "nativeText": "チェックインカウンターはどこですか",
      "nativeLang": "ja",
      "note": "",
      "voice": "alloy"
    }
  ]
}
```

### Supported Language Codes (Examples)
- `en` - English
- `zh` - Chinese (Mandarin)
- `ko` - Korean
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ja` - Japanese

## Audio Generation

- **API**: OpenAI Audio API (`/v1/audio/speech`)
- **Models**: `gpt-4o-mini-tts`, `tts-1`, or `tts-1-hd`
- **Format**: MP3
- **S3 Key Pattern**: `audio/{targetLang}/{sceneSlug}/{phraseId}.mp3`
- **Language Support**: OpenAI TTS supports multiple languages automatically based on input text
- **Generation Logic**: Only generate for phrases where `audio_s3_key IS NULL`
- **Error Handling**: Set `audio_status = 'failed'` on error, allow re-run

### Multi-Language TTS Notes
- OpenAI TTS auto-detects language from input text
- Same voice models work across all supported languages
- For best results, ensure `target_text` contains only the target language text

## Key Design Principles

1. **3-Tap Rule**: Scene → Phrase → Play within 3 taps
2. **Mobile-First**: Design for smartphone vertical screen, touch-friendly (44px+ buttons)
3. **Read-Only Frontend**: No mutations from Next.js app
4. **Script-Based Maintenance**: All data/audio updates via local scripts
5. **SSR by Default**: Fetch data server-side for better performance
6. **Error Visibility**: Show clear messages when audio cannot play

## Out of Scope (Not Implemented)

- Learning progress tracking
- Spaced repetition scheduling
- Favorites or bookmarks
- Recording and pronunciation evaluation
- User authentication
- Multi-user support
- Offline mode
