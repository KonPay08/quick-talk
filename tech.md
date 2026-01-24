# 英会話フレーズ練習サイト 技術設計

## 目的
- シーンと検索からフレーズへ最短で到達できる
- 音声再生を中心に反復練習できる
- 追加と更新を運用で回せる

## スコープ
### 対象
- シーン一覧
- シーン別フレーズ一覧
- フレーズ詳細
- 音声再生
- キーワード検索
- まとまったデータ投入と追加更新

### 対象外
- 学習履歴
- 間隔反復
- お気に入り
- 録音と発音評価
- ログインと複数人利用
- 完全オフライン

## 採用技術
- フロント Next.js App Router TypeScript
- ホスティング Vercel
- DB Supabase Postgres
- 音声ストレージ AWS S3
- 音声生成 OpenAI Text to Speech

## 全体アーキテクチャ
- Next.js は閲覧と検索のみを提供する
- Next.js サーバーで Supabase から読み取りを行い SSR で返す
- 音声は S3 の静的 URL を audio タグで再生する
- データ投入と音声生成はローカルの Node スクリプトで行う
- OpenAI API キーはローカルにのみ置く
  - API キーをブラウザに置かない :contentReference[oaicite:0]{index=0}

## データ設計

### テーブル scenes
- id uuid pk
- slug text unique
- title text
- sort_order int
- created_at timestamptz
- updated_at timestamptz

### テーブル phrases
- id uuid pk
- scene_id uuid fk
- english text not null
- japanese text not null
- note text null
- audio_s3_key text null
- audio_status text not null default 'pending'
- created_at timestamptz
- updated_at timestamptz

### インデックス
- phrases scene_id
- 検索は english に部分一致を使う
  - pg_trgm を推奨

例
```sql
create extension if not exists pg_trgm;

create index phrases_english_trgm
on phrases using gin (english gin_trgm_ops);
````

## S3 音声設計

* バケット例 english-phrases-audio
* キー例 audio/{sceneSlug}/{phraseId}.mp3
* 初期は公開読み取りで開始する
* 将来公開したくない場合は CloudFront と署名 URL に切り替える
* DB は URL ではなく audio_s3_key を持つ

## 画面設計

* / シーン一覧と検索
* /scenes/{slug} フレーズ一覧
* /phrases/{id} フレーズ詳細と音声再生

UI 方針

* 一覧は英語を主表示
* 詳細で日本語訳と補足を表示する

## 検索設計

* 検索対象は phrases.english
* 大文字小文字を区別しない
* 部分一致を基本とする
* 結果なしを明示する

## 音声生成設計

### 生成方針

* 初回投入と追加投入のタイミングで差分生成する
* 生成済みは audio_s3_key ありで判定する
* 失敗時は audio_status を failed にして再実行可能にする

### OpenAI API

* Audio API の audio speech を使う
* モデルは gpt-4o-mini-tts か tts-1 か tts-1-hd を使う ([OpenAI Platform][1])
* 出力フォーマットは mp3 を基本とする

## データ投入設計

### 投入データ形式

* JSON を単一ファイルで管理する
* scenes と phrases を含める
* phrases は sceneSlug で紐付ける

例

```json
{
  "scenes":[{"slug":"airport","title":"空港","sortOrder":10}],
  "phrases":[
    {
      "sceneSlug":"airport",
      "english":"Where is the check-in counter?",
      "japanese":"チェックインカウンターはどこですか",
      "note":"",
      "voice":"alloy"
    }
  ]
}
```

### 投入フロー

1 JSON を読み込む
2 scenes を slug で upsert
3 phrases を sceneSlug と english で重複判定して upsert
4 audio_s3_key が空の phrases を抽出する
5 OpenAI TTS で mp3 を生成する
6 S3 に upload して audio_s3_key を更新する
7 audio_status を done に更新する

## セキュリティ設計

* Next.js は読み取りのみ
* Supabase は RLS を有効化し select のみ公開する
* 追加更新はローカルスクリプトのみが実行する
* OpenAI API キーはローカル環境変数で保持する ([OpenAI Help Center][2])
* Next.js の環境変数はサーバー側で参照する

  * NEXT_PUBLIC を付けたものだけがブラウザへ露出する ([nextjs.org][3])

## リポジトリ構成

* app 画面とルーティング
* lib 取得系のリポジトリ層
* scripts 投入と生成
* supabase マイグレーション

例

* app

  * page.tsx
  * scenes/[slug]/page.tsx
  * phrases/[id]/page.tsx
* lib

  * supabaseServer.ts
  * sceneRepo.ts
  * phraseRepo.ts
  * audioUrl.ts
* scripts

  * importData.ts
  * generateTts.ts
* supabase

  * migrations

## 環境変数

### Vercel

* NEXT_PUBLIC_SUPABASE_URL
* NEXT_PUBLIC_SUPABASE_ANON_KEY
* S3_PUBLIC_BASE_URL

### ローカル scripts のみ

* SUPABASE_SERVICE_ROLE_KEY
* OPENAI_API_KEY
* AWS_ACCESS_KEY_ID
* AWS_SECRET_ACCESS_KEY
* AWS_REGION
* S3_BUCKET

## 運用

* 追加や修正は JSON を更新して scripts を実行する
* 音声だけ作り直したい場合は generateTts のみ実行する
* 失敗は audio_status で追跡し再実行する

## 将来拡張の余地

* 置き換え練習テンプレートを phrases に type と variables で追加
* 複数音声は audio_variants テーブルを追加し voice と key を分離
* 進捗管理は user と progress を追加し認証を導入する
