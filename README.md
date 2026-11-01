# みらい議会＠唐津市

佐賀県唐津市議会で今どんな議案が検討されているかを、やさしい言葉で伝える非公式サイトです。

> **本リポジトリについて**
>
> - 政党チームみらいが開発したオープンソースプロダクト [team-mirai/mirai-gikai](https://github.com/team-mirai/mirai-gikai)（「みらい議会」、本家: https://gikai.team-mir.ai/ ）の派生版です。
>   [川崎版](https://github.com/bakumon1107/mirai-gikai-fukuoka-city/tree/kawasaki/develop)（福岡版リポジトリの `kawasaki/develop`）をベースに、唐津市議会向けに改変しました。
> - 運営: [シビックテック唐津](https://civictech-karatsu.org/)
> - 改変日: 2026-11-01 〜（サイト名・ロゴ・画像・配色・免責表示・唐津市議会の会期/会派/委員会データなど）
> - AGPL-3.0 ライセンスを継承し、改変後のソースコードも同ライセンスで公開しています。
> - **これは政党チームみらいが運営しているものではありません。** 不具合や問い合わせは党ではなくシビックテック唐津へお願いします。

## 開発メモ

- 作業ブランチ: `karatsu/develop`
- fork ガイドライン準拠チェック: `bash .claude/skills/fork-guidelines/scripts/check.sh`（詳細は `.claude/skills/fork-guidelines/SKILL.md`）
- 他の議会向けに fork する場合: [fork手順](docs/kawasaki/20260304_1000_別地域向けfork手順.md)

---

# みらい議会

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/team-mirai-volunteer/mirai-gikai)
[![codecov](https://codecov.io/gh/team-mirai/mirai-gikai/branch/develop/graph/badge.svg)](https://codecov.io/gh/team-mirai/mirai-gikai)

## セットアップ

```bash
# Supabaseの起動
npx supabase start

# 環境変数の設定（必要に応じて.envの内容を変更してください）
cp .env.example .env

# パッケージインストール
pnpm install

# SupabaseのDB初期化, 開発用シードデータのセットアップ
pnpm db:reset

# サーバー起動
pnpm dev
```

## マイグレーション

```bash
# マイグレーションファイル生成
npx supabase migration new マイグレーション名

# マイグレーション実行 & 型ファイル更新
pnpm db:migrate
```

## Adminユーザーの作成

1. Supabase Studio上で Authentication > Add User からユーザーを作成
2. Supabase Studio上で以下のSQLを実行

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"roles": ["admin"]}'::jsonb
WHERE email = '<1で作成したユーザーのemail>';
```

> [!NOTE]
> 開発環境では、seedデータによって、`email: admin@example.com, password: admin123456` のAdminユーザーが作成されます。
