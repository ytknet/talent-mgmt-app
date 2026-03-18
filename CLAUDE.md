# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## リポジトリ構成

このリポジトリには3つの独立したプロジェクトが含まれる。

- `sandbox/index.html` — 静的HTMLの自己紹介ページ（サーバー・ビルドツール不要。ブラウザで直接開く）
- `talent-mgmt-app/` — SVP後継者管理Webアプリ（React + Express）
- `docs/` — メモ・日記・記事

---

## talent-mgmt-app

### コマンド

```bash
cd talent-mgmt-app

# フロント（:3000）＋バックエンド（:3001）を同時起動
npm run start:all

# フロントのみ
npm start

# バックエンドのみ
npm run start:server

# フロントのテスト（watch mode）
npm test

# バックエンドのテスト（Jest + supertest）
npm run test:backend

# 単一テストファイルを指定して実行
npx jest --config=jest.backend.config.js backend/tests/svps.test.js

# プロダクションビルド
npm run build
```

### アーキテクチャ

**フロントエンド（React、port 3000）**
- `src/App.js` — `SVPDashboard` を唯一のルートコンポーネントとしてレンダリング
- `src/components/` — 全コンポーネント。SVPカード・後継者バッジ・却下ログ・ニュースセクション等
- `package.json` の `proxy` 設定により、`/api/*` はバックエンド（:3001）に転送される

**バックエンド（Express、port 3001）**
- `server.js` — エントリポイント。ルートを登録し `init()` でDB初期化
- `backend/data.js` — lowdb（JSONファイルDB）の初期化とデフォルトデータ投入。`DB_FILE` 環境変数でテスト用DBパスを切り替え可能
- `backend/routes/svps.js` — SVP・後継者のCRUD API（`/api/svps`）
- `backend/routes/rejected.js` — 却下された後継者の管理API（`/api/rejected`）。SSEエンドポイントも含む
- `backend/routes/news.js` — ニュース取得API（`/api/news`）。ES moduleのため `NODE_ENV=test` 時はスキップ
- `backend/sse.js` — Server-Sent Eventsのブロードキャスター

**データ永続化**
- `backend/db.json` がlowdbのデータファイル。SVPと後継者リストを保持

### 主要なアーキテクチャパターン

**リアルタイム更新（Server-Sent Events）**
- `backend/sse.js` が SSE ブロードキャスターを提供
- 後継者削除時にリアルタイムでフロントエンドが更新される
- フロントエンド: `new EventSource('/api/rejected/stream')` で接続

**データエクスポート機能**
- CSV、JSON、Excel（XLSX）、PDFの4形式に対応
- `backend/routes/rejected.js` でExcelJS・PDFKitを使用
- エンドポイント: `/api/rejected/export.{csv,json,xlsx,pdf}`

**ニューススクレイピング**
- 日経新聞HR記事を自動収集（Cheerio + Axios）
- フィルタ条件: "人事"キーワード含む記事
- フロントエンドでカルーセル表示

**API構成**
主要エンドポイント:
- `GET /api/svps` - SVPリスト取得
- `POST /api/svps/:id/successors` - 後継者追加
- `DELETE /api/svps/:id/successors/:succId` - 後継者削除（却下ログに記録）
- `GET /api/rejected` - 却下ログ一覧（クエリパラメータ対応）
- `GET /api/rejected/stream` - SSEストリーム
- `GET /api/news` - HR関連ニュース取得

### テストフレームワーク

**フロントエンド**
- Jest + React Testing Library
- テストファイル: `src/components/__tests__/`
- 実行: `npm test`（watch mode）

**バックエンド**
- Jest + Supertest
- 設定: `jest.backend.config.js`
- テストファイル: `backend/tests/`
- 実行: `npm run test:backend`

### テスト上の注意

- `news.js` ルートは `axios`（ESM）を使用するため、`NODE_ENV=test` 時はサーバーがロードしない
- バックエンドテストは `DB_FILE` 環境変数で別ファイルを指定してテスト用DBを分離する
- Chart.jsコンポーネントはテスト環境でモック化が必要
- SSEストリームのテストでは適切なクリーンアップが重要

### 重要な技術的詳細

**フロントエンド状態管理**
- Redux/Context APIは使用せず、プロップス経由でデータを渡す
- `SVPDashboard` がメインの状態オーケストレーター
- リアルタイム同期にSSEを活用

**パフォーマンス最適化**
- ニューススクレイパーは最新5記事のみキャッシュ
- SVPデータはコンポーネントマウント時に一度だけ取得
- エクスポート形式は大容量データに対してストリーミング対応

**開発時の依存関係**
- Create React App（react-scripts 5.0.1）によるビルド
- `concurrently` でフロント・バックエンド同時実行
- `package.json` の `proxy` 設定でAPI転送

---

## sandbox（静的HTML）

CSSは `sandbox/index.html` の `<style>` タグ内にインラインで記述。外部CSSファイルは使用しない。
