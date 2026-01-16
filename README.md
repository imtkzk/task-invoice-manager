# タスク・請求書管理システム

プロジェクト管理、タスク追跡、時間記録、請求書生成を一元管理できるWebアプリケーションです。

## 機能

### プロジェクト管理
- プロジェクトの作成・編集・削除
- クライアント情報の管理
- 時給設定（時間ベースの請求計算用）

### タスク管理
- タスクの作成・編集・削除
- プロジェクト/カテゴリ別の分類
- タスクの完了状態管理
- 期限設定
- 金額設定（固定額）

### 時間トラッキング
- リアルタイムタイマーで作業時間を記録
- 手動での時間入力も可能
- タスクごとの作業時間履歴
- 作業内容のメモ機能

### 請求書生成
- プロジェクトのタスクから請求書を自動生成
- 時間記録から金額を自動計算（時給設定時）
- PDF形式でダウンロード可能
- 請求書のステータス管理（下書き/送信済み/支払済み）

## 技術スタック

### バックエンド
- Node.js
- Express
- SQLite3（データベース）
- PDFKit（PDF生成）

### フロントエンド
- React 18
- Vite（ビルドツール）
- Axios（HTTP クライアント）

## セットアップ

### 必要なもの
- Node.js 16以上
- npm または yarn

### インストール手順

1. リポジトリをクローン
```bash
git clone <repository-url>
cd task-invoice-manager
```

2. バックエンドのセットアップ
```bash
cd backend
npm install
cp .env.example .env
```

3. フロントエンドのセットアップ
```bash
cd ../frontend
npm install
```

## 起動方法

### 開発モード

1. バックエンドを起動（ターミナル1）
```bash
cd backend
npm run dev
```
サーバーは http://localhost:3001 で起動します。

2. フロントエンドを起動（ターミナル2）
```bash
cd frontend
npm run dev
```
アプリケーションは http://localhost:3000 で起動します。

### 本番環境

1. フロントエンドをビルド
```bash
cd frontend
npm run build
```

2. バックエンドを起動
```bash
cd backend
npm start
```

## 使い方

### 1. プロジェクトを作成
1. 「プロジェクト」タブを開く
2. 「新規プロジェクト作成」ボタンをクリック
3. プロジェクト名、クライアント名、時給などを入力
4. 「作成」ボタンをクリック

### 2. タスクを追加
1. 「タスク」タブを開く
2. プロジェクトを選択
3. 「新規タスク作成」ボタンをクリック
4. タスク情報を入力
5. 「作成」ボタンをクリック

### 3. 作業時間を記録
1. タスク一覧で「時間記録」ボタンをクリック
2. タイマーを開始するか、手動で時間を入力
3. 作業完了後、タイマーを停止して保存

### 4. 請求書を生成
1. 「請求書」タブを開く
2. 「新規請求書作成」ボタンをクリック
3. プロジェクトを選択
4. 含めるタスクを選択（オプション）
5. 発行日、支払期限、備考を入力
6. 「作成」ボタンをクリック
7. 「PDFダウンロード」ボタンでPDFを取得

## API エンドポイント

### プロジェクト
- `GET /api/projects` - プロジェクト一覧取得
- `GET /api/projects/:id` - プロジェクト詳細取得
- `POST /api/projects` - プロジェクト作成
- `PUT /api/projects/:id` - プロジェクト更新
- `DELETE /api/projects/:id` - プロジェクト削除

### タスク
- `GET /api/tasks?project_id={id}` - タスク一覧取得
- `GET /api/tasks/:id` - タスク詳細取得
- `POST /api/tasks` - タスク作成
- `PUT /api/tasks/:id` - タスク更新
- `DELETE /api/tasks/:id` - タスク削除

### 時間記録
- `GET /api/time-entries?task_id={id}` - 時間記録一覧取得
- `POST /api/time-entries` - 時間記録作成
- `PUT /api/time-entries/:id` - 時間記録更新
- `DELETE /api/time-entries/:id` - 時間記録削除

### 請求書
- `GET /api/invoices?project_id={id}` - 請求書一覧取得
- `GET /api/invoices/:id` - 請求書詳細取得
- `POST /api/invoices` - 請求書作成
- `PUT /api/invoices/:id` - 請求書更新
- `DELETE /api/invoices/:id` - 請求書削除
- `GET /api/invoices/:id/pdf` - 請求書PDF取得

## データベース構造

### テーブル
- `projects` - プロジェクト情報
- `tasks` - タスク情報
- `time_entries` - 作業時間記録
- `invoices` - 請求書
- `invoice_items` - 請求書明細

詳細は `backend/src/database.js` を参照してください。

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。
