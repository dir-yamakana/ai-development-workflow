# プロジェクトガイド for Claude Code

このファイルはClaude Code Actionsを実行する際に、効果的で高品質なコードを生成するための実行方針を示すガイドラインです。

## 🎯 プロジェクト概要

### プロジェクトの目的
AIを活用したソフトウェア開発ワークフロー研修のためのデモアプリケーション。GitHub Actionsで動作するClaude Codeを活用し、**人間が手でコードを書くことなく**開発を実践します。

### 開発予定のアプリケーション
- **TODO管理アプリケーション**: タスク管理、サブタスク、ステータス管理、統計表示
- **家計簿アプリケーション**: 収支管理、カテゴリ分類、統計・グラフ表示（予定）

各アプリケーションは独立したページとして実装し、共通コンポーネント・フック・ユーティリティを再利用します。

---

## 🛠 技術スタック

- **Next.js 16.0.4** (App Router)
- **React 19.2.0** (関数コンポーネント)
- **TypeScript 5.x** (strict mode)
- **Tailwind CSS 4.x**
- **Radix UI** (アクセシブルなUIプリミティブ)
- **GitHub Pages**（静的サイトホスティング）

### 重要な環境制約（静的エクスポート）

`output: 'export'`による完全な静的サイト生成です。

#### 利用不可
- ❌ SSR（サーバーサイドレンダリング）
- ❌ Server Actions
- ❌ API Routes (`app/api/`)
- ❌ 動的ルーティング（`getServerSideProps`）
- ❌ Next.js Image最適化（`unoptimized: true`）

#### 利用可能
- ✅ Server Components（ビルド時のみ実行）
- ✅ Client Components（ブラウザ実行）
- ✅ 静的生成（SSG）
- ✅ クライアントサイドデータフェッチ

---

## 📋 コーディング規約

### TypeScript
- strict mode必須
- `any`型の使用禁止
- 明示的な型定義
- 型ガードの活用

### 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `TaskList` |
| 関数 | camelCase | `addTask` |
| 型 | PascalCase | `Task` |
| 定数 | UPPER_SNAKE_CASE | `MAX_TASKS` |
| フック | camelCase（use始まり） | `useTaskManager` |

### import順序

```typescript
// 1. React関連
import { useState } from 'react';

// 2. 外部ライブラリ
import clsx from 'clsx';

// 3. 内部モジュール
import { TaskList } from '@/app/components/TaskList';

// 4. 型定義
import type { Task } from '@/app/types/task';

// 5. スタイル
import './styles.css';
```

---

## 🏗 アーキテクチャ

### ディレクトリ構造

```
app/
  layout.tsx           # ルートレイアウト
  page.tsx             # トップページ（TODO管理）
  household/           # 家計簿アプリ（予定）
    page.tsx
  components/          # 共通コンポーネント（全アプリで再利用）
  hooks/               # カスタムフック（副作用の分離）
  types/               # 型定義
  utils/               # ユーティリティ関数（純粋関数）
  constants/           # 定数定義
public/                # 静的ファイル
```

複数のアプリケーション間で共通のコンポーネント・フック・ユーティリティを積極的に再利用してください。

### SOLID原則

#### S - Single Responsibility（単一責任の原則）
1つのコンポーネント/関数は1つの責任のみ。データ取得とUIは分離する。

#### O - Open/Closed（開放閉鎖の原則）
型とPropsで拡張可能に。既存コードの変更を最小限に。

#### L - Liskov Substitution（リスコフの置換原則）
基本型を拡張した型は、基本型として扱えること。

#### I - Interface Segregation（インターフェース分離の原則）
コンポーネントのPropsは必要最小限に。不要なプロパティを含めない。

#### D - Dependency Inversion（依存性逆転の原則）
具体的な実装ではなく、抽象的なインターフェースに依存する。

**コード例**:

```typescript
// ❌ 悪い例: データ取得とUI混在
function UserProfile() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(setUser);
  }, []);
  return <div>{user?.name}</div>;
}

// ✅ 良い例: カスタムフックに分離
function useUser() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(setUser);
  }, []);
  return user;
}

function UserProfile() {
  const user = useUser();
  return <div>{user?.name}</div>;
}
```

---

## 🪝 React フック使用ガイドライン

### useEffectの使用最小化

**useEffectは可能な限り避ける。使用前に必ず4段階チェック：**

#### 1. レンダリング中に計算できないか？
```typescript
// ❌ 悪い例
const [filtered, setFiltered] = useState([]);
useEffect(() => {
  setFiltered(items.filter(item => item.active));
}, [items]);

// ✅ 良い例
const filtered = items.filter(item => item.active);
```

#### 2. イベントハンドラーで処理できないか？
ユーザーインタラクションに応じた処理は`onClick`, `onChange`で。

#### 3. React QueryやSWRで解決できないか？
データフェッチングは専用ライブラリの検討を。

#### 4. 本当にuseEffectが必要か？
外部システムとの同期（DOM操作、タイマー、LocalStorageなど）のみ。

### useEffectが必要な場合

- **カスタムフックに分離**（再利用性・テスタビリティ向上）
- 依存配列を正確に指定
- クリーンアップ関数を実装
- 無限ループを避ける

```typescript
// ✅ カスタムフックの例
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

### 静的エクスポート環境でのデータフェッチング

- **ビルド時**: Server Component内で直接fetch
- **ランタイム**: クライアントサイドでfetch（useEffectまたはカスタムフック）
- 外部APIはCORS設定が必要

---

## 🎨 UI/UXガイドライン

### デザイン方針

- モダンでクリーンなUI
- 滑らかなインタラクション（ホバー効果、トランジション）
- カード型レイアウト（`rounded-2xl`, `shadow-xl`）
- レスポンシブデザイン

### Radix UI の活用

**積極的にRadix UIを利用してください**。複雑なUIコンポーネントを実装する際は、まずRadix UIのプリミティブを検討すること。

#### 使用すべき場面
- **ダイアログ/モーダル**: `@radix-ui/react-dialog`
- **ドロップダウンメニュー**: `@radix-ui/react-dropdown-menu`
- **ポップオーバー**: `@radix-ui/react-popover`
- **セレクトボックス**: `@radix-ui/react-select`
- **タブ**: `@radix-ui/react-tabs`
- **ツールチップ**: `@radix-ui/react-tooltip`
- **アコーディオン**: `@radix-ui/react-accordion`
- **チェックボックス/ラジオ**: `@radix-ui/react-checkbox`, `@radix-ui/react-radio-group`

#### Radix UIの利点
- **アクセシビリティ**: ARIA属性、キーボードナビゲーションが標準実装
- **カスタマイズ性**: 完全なスタイル制御（Tailwind CSSと相性抜群）
- **型安全性**: TypeScript完全対応
- **静的エクスポート対応**: クライアントコンポーネントとして動作
```

### カラーパレット

```css
/* Primary */
bg-blue-600 / bg-blue-700 (hover)

/* Semantic */
bg-green-600 (success)
bg-red-600 (danger)

/* Neutral */
bg-white / bg-slate-50 (background)
text-slate-900 (text)

/* Status */
bg-gray-200 text-gray-800 (Pending)
bg-blue-200 text-blue-800 (Running)
bg-green-200 text-green-800 (Completed)
```

### 共通UIパターン

すべてのアプリケーションで統一されたUIパターンを使用：
- ボタン: `px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors`
- カード: `bg-white rounded-2xl shadow-xl p-8`
- 入力: `px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500`
- バッジ: `px-3 py-1 rounded-full text-xs font-medium`

新規アプリケーションを追加する際も、このパターンに従ってください。

### アクセシビリティ

- セマンティックHTML使用
- ARIA属性（`aria-label`, `title`）
- キーボードナビゲーション対応（Enterキー）
- 色コントラスト（WCAG AA基準）
- フォーカス管理（`focus:ring-2`）

---

## ⚡ パフォーマンス最適化

### 静的エクスポート環境での最適化

- **SSRは利用不可** - すべてビルド時生成
- **Client Componentsを最小限に** - 静的コンテンツはServer Componentsで
- **バンドルサイズ重視** - 初期JSサイズが重要
- **LocalStorage活用** - クライアントサイドキャッシュ

### 最適化テクニック

```typescript
// コード分割
const Heavy = dynamic(() => import('./Heavy'), {
  loading: () => <p>Loading...</p>,
});

// メモ化
const sorted = useMemo(() => tasks.sort(...), [tasks]);
const handleUpdate = useCallback((task) => {...}, []);
```

---

## ✅ 品質基準とレビューチェックリスト

### 必須チェック項目

#### コード品質
- [ ] TypeScriptの型エラーがない（`npm run build`成功）
- [ ] ESLintエラーがない（`npm run lint`成功）
- [ ] 既存機能を壊していない

#### UI/UX
- [ ] レスポンシブデザイン対応
- [ ] アクセシビリティ基準（キーボード、ARIA、色コントラスト）

#### パフォーマンス
- [ ] Client Componentsを最小限に抑えた
- [ ] 静的エクスポート環境で動作する（SSR/Server Actions未使用）

#### アーキテクチャ
- [ ] SOLID原則に従っている
- [ ] useEffectは本当に必要か確認した（4段階チェック）
- [ ] 副作用はカスタムフックに分離されている
- [ ] コードの重複を避けている

---

## 🔄 GitHub Actions連携

### トリガー方法

1. コメントメンション: `@claude`
2. アサイン: ユーザーID`claude`
3. ラベル: `claude`

### 許可されたツール

`mcp__github, Read, Grep, Glob, WebSearch, LS, Edit, Bash(npm:*)`

### 重要な制約

**`npm run lint`および`npm run build`は実行しないこと。**

- これらのコマンドはGitHub ActionsのCI/CDパイプラインで自動実行されます
- ローカルでの手動実行やClaude Codeによる実行は不要です
- コード変更後、自動的にCIが品質チェックを行います

### CI/CD注意事項

#### 必須確認
1. `npm run build`が成功
2. `npm run lint`が成功
3. TypeScript型チェック成功
4. 静的エクスポート（`output: 'export'`）で動作
5. SSR/Server Actions未使用

#### トラブルシューティング

**ビルドエラー**:
- TypeScript型エラー確認
- ESLint警告確認
- 静的エクスポート不可機能の使用確認

**デプロイ後動作しない**:
- `basePath`設定確認
- 絶対パス使用確認
- ブラウザコンソールでエラー確認

---

## 📝 重要な原則

- ✅ **静的エクスポート環境** - SSRは使わず完全な静的サイト
- ✅ **useEffectの最小化** - 4段階チェックで本当に必要か確認
- ✅ **SOLID原則** - 保守性の高いアーキテクチャ
- ✅ **型安全性** - TypeScript strictモードで堅牢なコード
- ✅ **Radix UI活用** - 複雑なUIコンポーネントは車輪の再発明を避ける

コードを書く前に、このガイドラインを参照してください。
