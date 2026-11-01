---
name: fork-guidelines
description: チームみらい「みらい議会」運用ガイドライン（fork 版の必須要件）に沿って唐津市版を開発・レビューする。サービス名・ロゴ・トップ画像・OGP・カラーテーマ・免責文言・ソースコード公開リンク・本家への追従（upstream マージ）に触れる変更、UI／ブランディング／フッター／レイアウトの変更、デプロイ前チェック、PR 作成前のセルフレビューで必ず使う。
---

# みらい議会 fork ガイドライン準拠スキル（唐津市版）

本リポジトリは [team-mirai/mirai-gikai](https://github.com/team-mirai/mirai-gikai)（AGPL-3.0）の fork（川崎版 → 福岡版の `kawasaki/develop` 系統）を、唐津市議会向けにした「**みらい議会＠唐津市**」。
運営はシビックテック唐津。チームみらいの公式サービスではない。

## 出典（判断に迷ったら原文を確認する）

1. **チームみらい公式 note「『みらい議会』運用ガイドラインを公開しました」**（2026-06-09）
   https://note.com/team_mirai_jp/n/nc59ec347e8c7
2. **本家 `FORK_GUIDELINES.md`**（具体的なファイルと CSS 変数はこちらが正）
   https://github.com/team-mirai/mirai-gikai/blob/develop/FORK_GUIDELINES.md
   取得: `gh api repos/team-mirai/mirai-gikai/contents/FORK_GUIDELINES.md --jq .content | base64 -d`
3. ガイドライン追加 PR: https://github.com/team-mirai/mirai-gikai/pull/734

ガイドラインは AGPL-3.0 第7条 (c)(d)(e) に基づく追加条件。AGPL 本体の義務（第13条のソース公開など）とあわせて守る。

## 必須要件と唐津市版での実装場所

| # | 要件（note / FORK_GUIDELINES） | 唐津市版での実装 | 守るべきこと |
|---|---|---|---|
| 1 | サービス名は「みらい議会＠地域名」形式（独自名なら自由） | `web/src/config/site.config.ts` `siteName: "みらい議会＠唐津市"`、`admin/src/config/site.config.ts`、`web/public/manifest.json` | 「みらい議会」単独や「チームみらい」を含む名称にしない。3ファイルの表記をそろえる |
| 2 | チームみらいのロゴを使わない。ロゴ・favicon・PWA アイコンを独自に | `web/public/img/logo.svg`（シビックテック唐津ロゴ）、`web/public/icons/pwa/*.png`、favicon | 本家ロゴ（`team-mirai-typography.svg` 等）を画面に出さない。アイコン追加時も独自素材を使う |
| 3 | ヒーロー画像・OGP 画像を独自に | `web/public/img/hero_background.png`、`web/public/ogp.jpg`、OGP 生成のロゴ | **未対応（TODO）**。公開前に必ず差し替える |
| 4 | 本家のブランドカラーをそのまま使わない | `web/src/app/globals.css` の `--primary` `#0f7b8a` / `--primary-accent` `#0a5b66` / `--color-mirai-gradient-start` `#9fe0e8` / `--color-mirai-gradient-end` `#edf3f1`、`layout.tsx` の `themeColor` と `NextTopLoader` | 本家色 `#2aa693` `#0f8472` `#64d8c6` `#bcecd3` を新たに書かない。色はハードコードせず CSS 変数を使う |
| 5 | 免責文言「これは政党チームみらいが運営しているものではありません」をわかりやすい場所に | `web/src/components/layouts/footer/footer.tsx` の `FooterForkNotice` | 文言を一字一句変えない。フッターを非表示にするページ（インタビュー画面など）を増やす場合は別の場所に表示する |
| 6 | fork 版自身のソースコード公開先へのリンク（AGPL 第13条） | `siteConfig.externalLinks.sourceCode`（`https://github.com/civictech-karatsu/mirai-gikai-karatsu`）をフッターに表示 | 本家リポジトリへのリンクでは代用不可。リポジトリは公開状態を保つ。URL を変えたら設定も直す |
| 推奨 | 本家「みらい議会」 https://gikai.team-mir.ai/ と fork 元リポジトリへのリンク | `externalLinks.upstreamSite` / `upstreamRepo` をフッターに表示 | 削除しない |

AGPL のその他の義務：改変版も AGPL-3.0 で配布する。改変した旨と日付を README に明記する（第5条 (a)）。

## 開発時のルール

- **チームみらいの名称・ロゴ・ブランドで宣伝しない**（第7条 (d)(e)）。「チームみらい公式」「チームみらいの◯◯」と誤認させる文言、党への寄附導線、党の見解（`faction_stances` の「みらい」会派など）を唐津版で出さない。`siteConfig.features.showTeamMiraiSection` は `false` のまま。`managingParty` は空文字列。
- **地域固有の値は `site.config.ts` に集約**する。コンポーネントに「唐津」「唐津市議会」や URL を直書きしない（`siteConfig.cityName` / `councilName` などを使う）。
- 本家・福岡版・川崎版の名残（「福岡」「川崎」「チームみらい」の固定文言、本家色、本家ロゴ）を持ち込まない。
- 上流（`upstream` = team-mirai、`fukuoka` = 福岡版）から取り込むときは、マージ後に下のチェックを実行する。取り込みで要件 1〜6 が上書きされやすい（`globals.css`、`layout.tsx`、`footer.tsx`、`manifest.json`、画像）。

## チェック手順（UI 変更・上流マージ・デプロイ前・PR 前）

1. 自動チェックを実行する：
   ```bash
   bash .claude/skills/fork-guidelines/scripts/check.sh
   ```
   `NG` が出たら直す。`WARN` は内容を見て判断し、意図的に残すなら理由を PR に書く。
2. 目視で確認する（`pnpm dev` → http://localhost:3000）：
   - トップ・議案詳細・フッターで、免責文言とソースコードリンクが見えるか
   - ヘッダー／ファビコン／PWA アイコンが独自ロゴか
   - ヒーロー画像と OGP（`/api/og/...` と `ogp.jpg`）に本家の素材が残っていないか
3. 本家の `FORK_GUIDELINES.md` が更新されていないか確認する（要件が増えていたらこのスキルも更新する）：
   ```bash
   gh api repos/team-mirai/mirai-gikai/commits?path=FORK_GUIDELINES.md --jq '.[0].commit.committer.date'
   ```
