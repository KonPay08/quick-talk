# Quick Talk 技術設計

## バージョン履歴
| バージョン | 日付 | 変更内容 |
|------------|------|----------|
| 0.8 | 2026-02-23 | シーン別表示を廃止、初期データ機能を追加 |
| 0.7 | 2026-02-23 | ハンドブック中心設計に変更、画面構成を更新 |
| 0.6 | 2026-01-24 | 音声翻訳・履歴機能の技術設計を追加 |
| 0.5 | 2026-01-24 | プロトタイプ構成を追加（JSON + public/audio）|
| 0.4 | 2026-01-24 | 検索をv2.0に延期、モバイルファースト追加 |
| 0.3 | 2026-01-24 | 言語ペアを完全汎用化 |
| 0.2 | 2026-01-24 | 多言語対応アーキテクチャに変更 |
| 0.1 | - | 初版 |

---

## 目的

- 翻訳したフレーズを蓄積し、自分だけのハンドブックを構築できる
- 翻訳結果を音声で確認し、発音を練習できる
- 蓄積したフレーズを一覧で確認・復習できる

## スコープ

### v1.5（現在開発中）
- **ハンドブック（フレーズ一覧）をホームに**
- **翻訳してフレーズ追加**（テキスト/音声入力）
- **翻訳結果の音声再生**（TTS）
- **フレーズ保存**（localStorage）
- **初期データ読み込み**（JSONから）

### v2.0（将来）
- キーワード検索
- カテゴリ/タグ分け
- Supabase への移行

### v3.0（将来）
- 現地翻訳モード
- PWA 対応（オフライン閲覧）

---

## 採用技術

### v1.5 構成

| 領域 | 技術 | 備考 |
|------|------|------|
| フロント | Next.js 15 App Router | TypeScript |
| ホスティング | Vercel | 無料枠 |
| 音声認識 (STT) | OpenAI Whisper API | 高精度 |
| 翻訳 | OpenAI GPT-4o-mini | コンテキスト理解 |
| 音声合成 (TTS) | OpenAI TTS | tts-1 モデル |
| フレーズ保存 | localStorage | プロトタイプ用 |
| 初期データ | JSON ファイル | サンプルフレーズ |

### コスト目安（1回の翻訳）

| 処理 | API | 料金目安 |
|------|-----|----------|
| 音声認識 | Whisper | ~$0.006/分 |
| 翻訳 | GPT-4o-mini | ~$0.001 |
| 音声合成 | TTS | ~$0.005 |
| **合計** | | **~$0.02（約3円）** |

---

## 全体アーキテクチャ（v1.5）

```
[ブラウザ]
    │
    ├─ 初回起動 ──→ JSONから初期データ読み込み
    │                    ↓
    ├─ ホーム（ハンドブック）←── localStorage
    │
    ├─ 翻訳画面
    │      │
    │      ├─ 音声入力 ──→ [API Route] ──→ Whisper API
    │      │                    │
    │      │                    ↓
    │      ├─ テキスト入力 ──→ [API Route] ──→ GPT-4o-mini（翻訳）
    │      │                    │
    │      │                    ↓
    │      │              [API Route] ──→ TTS API
    │      │                    │
    │      │                    ↓
    │      └─ 翻訳結果 ←───── Base64 音声データ
    │             │
    │             ↓ [保存]
    └─ localStorage に追加
```

### ポイント

- **ハンドブック（フレーズ一覧）がメイン画面**
- **初回起動時にJSONから初期データをlocalStorageに保存**
- OpenAI API 呼び出しは **API Route 経由**（APIキーをブラウザに露出しない）
- 音声データは Base64 でレスポンスに含める（S3不要）
- フレーズは localStorage に保存（DB不要）

---

## API 設計（v1.5）

### POST /api/translate

テキスト翻訳 + TTS 生成

**Request:**
```json
{
  "text": "駅はどこですか",
  "sourceLang": "ja",
  "targetLang": "en"
}
```

**Response:**
```json
{
  "sourceText": "駅はどこですか",
  "targetText": "Where is the station?",
  "audioBase64": "data:audio/mp3;base64,..."
}
```

### POST /api/transcribe

音声認識（Whisper）

**Request:**
- `Content-Type: multipart/form-data`
- `audio`: 音声ファイル（webm/mp3）

**Response:**
```json
{
  "text": "駅はどこですか"
}
```

---

## データ設計（v1.5）

### フレーズデータ（localStorage）

キー: `quick-talk-phrases`

```typescript
interface SavedPhrase {
  id: string;              // UUID
  nativeText: string;      // 日本語
  targetText: string;      // 英語
  nativeLang: string;      // 'ja'
  targetLang: string;      // 'en'
  audioBase64?: string;    // TTS音声（Base64）- 翻訳時
  audioPath?: string;      // 音声ファイルパス - 初期データ
  createdAt: string;       // ISO 8601
}
```

### 初期化フラグ

キー: `quick-talk-initialized`

- 初回起動時に `true` を設定
- これにより初期データは一度だけ読み込まれる

### フレーズ操作

```typescript
// 初期化（初回のみJSONから読み込み）
function initializePhrases(): void

// 保存
function savePhrase(phrase: SavedPhrase): void

// 取得（新しい順）
function getPhrases(): SavedPhrase[]

// 単一取得
function getPhrase(id: string): SavedPhrase | null

// 削除
function deletePhrase(id: string): void

// 全削除
function clearPhrases(): void
```

### 初期データ

`data/phrases.json` - サンプルフレーズ（7件）
`public/audio/` - 初期データ用音声ファイル

---

## 画面設計（v1.5）

| パス | 画面 | 機能 |
|------|------|------|
| / | ホーム | ハンドブック（フレーズ一覧） |
| /translate | 翻訳 | 翻訳してフレーズ追加 |
| /phrases/[id] | フレーズ詳細 | 詳細 + 音声再生 + 削除 |

### ホーム画面 UI（ハンドブック）

```
┌─────────────────────────────────┐
│  Quick Talk                     │
│  マイフレーズ集                  │
├─────────────────────────────────┤
│                                 │
│  [+ 翻訳して追加]               │ ← 翻訳画面へ
│                                 │
│  ─────────────────────────────  │
│  7 フレーズ        すべて削除   │
│                                 │
│  🔊 Where is the station?       │ ← フレーズ一覧
│     駅はどこですか               │
│                                 │
│  🔊 I'd like a window seat.     │
│     窓側の席をお願いします        │
│                                 │
│  🔊 ...                         │
│                                 │
└─────────────────────────────────┘
```

### 翻訳画面 UI

```
┌─────────────────────────────────┐
│  ← ホーム        翻訳           │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │ 日本語を入力...         │   │ ← テキスト入力
│  └─────────────────────────┘   │
│           [翻訳する]            │
│                                 │
│  ───────── または ─────────    │
│                                 │
│        [🎤 長押し]              │ ← 長押しで録音
│                                 │
└─────────────────────────────────┘
```

### UI 方針

- **ハンドブックがホーム**: アプリ起動で即フレーズ一覧
- **モバイルファースト**: スマホ縦画面を基準
- **1画面1目的**: 迷わない構成
- **44px以上**: タップしやすいボタン

---

## リポジトリ構成（v1.5）

```
app/
  page.tsx                    # ホーム（ハンドブック）
  translate/
    page.tsx                  # 翻訳画面
  phrases/[id]/page.tsx       # フレーズ詳細
  api/
    translate/route.ts        # 翻訳API
    transcribe/route.ts       # 音声認識API

lib/
  types.ts                    # 型定義
  history.ts                  # localStorage操作 + 初期化
  openai.ts                   # OpenAI クライアント

data/
  phrases.json                # 初期データ（サンプルフレーズ）

public/audio/                 # 初期データ用音声ファイル
```

---

## 環境変数（v1.5）

### ローカル開発 `.env.local`

```
OPENAI_API_KEY=sk-xxx...
```

### Vercel デプロイ

```
OPENAI_API_KEY=sk-xxx...   # Vercel環境変数に設定
```

※ `NEXT_PUBLIC_` は付けない（サーバーサイドのみで使用）

---

## セキュリティ設計

- OpenAI API キーは **サーバーサイド（API Route）でのみ使用**
- ブラウザには API キーを露出しない
- API Route で入力値のバリデーションを行う
- レート制限は将来検討（個人利用のため初期は不要）

---

## エラーハンドリング

| エラー | 表示メッセージ |
|--------|---------------|
| 音声認識失敗 | 「音声を認識できませんでした」 |
| 翻訳失敗 | 「翻訳に失敗しました」 |
| TTS生成失敗 | 「音声を生成できませんでした」 |
| ネットワークエラー | 「通信エラーが発生しました」 |
| マイク権限なし | 「マイクの使用を許可してください」 |

---

## 将来拡張

### v2.0
- Supabase 移行（フレーズの永続化・検索）
- キーワード検索
- カテゴリ/タグ分け

### v3.0
- 現地翻訳モード（リアルタイム翻訳特化UI）
- PWA 対応（オフライン閲覧）
