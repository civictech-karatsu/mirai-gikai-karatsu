---
name: update-bills
description: 唐津市議会の議案データ（bills / bill_contents / tags）を更新する手順。新しい会期の議案取り込み、議決結果の反映、議案のやさしい解説（normal / hard）の作成・修正を行うときに必ず使う。
---

# 議案データ更新（唐津市議会）

唐津市議会サイトの「議決結果一覧」を取得して `bills.json` を作り、議案ごとの解説 Markdown を書いて、`import-bills.ts` で DB に反映する。
解説は Claude Code が公式資料を読んで書き、**人のレビューを通してから公開**する。

## データソース

| 資料 | 場所 | 使い道 |
|---|---|---|
| 議決結果一覧 | https://www.city.karatsu.lg.jp/site/shigikai/list134-332.html → 会期別ページ | 議案番号・件名・種別・結果・提出日・議決日（HTML表） |
| 提出議案 | https://www.city.karatsu.lg.jp/site/shigikai/ の「令和◯年◯月市議会定例会提出議案」 | 議案本文PDF（第1＝条例・一般議案本文、第2〜＝予算書）、**「提出議案等（予算議案以外）の概要」**、**「補正予算の概要」** |
| 会期および議事日程 | https://www.city.karatsu.lg.jp/site/shigikai/list134-330.html | 会期の日付 |
| 例規集（現行条例） | https://www1.g-reiki.net/karatsu/ （五十音索引 `reiki_kana/r_50_*.html`） | 改正前の条文・金額の確認 |
| 施策ごとの市の説明ページ | 例: 使用料改定 https://www.city.karatsu.lg.jp/page/52659.html | 背景・新旧比較表 |

- PDF は `pdftotext -layout` で抽出できる。取得は1件ずつ、間隔を空けて行う
- ダウンロードした資料はスクラッチパッドに置き、リポジトリには入れない

## 対象範囲

- 取り込む：補正予算・当初予算・条例・一般議案・決算・意見書・決議・請願
- **取り込まない：人事（同意・推薦など）と報告**（`import-bills.ts` の `EXCLUDED_CATEGORIES`）

## ファイル構成

```
packages/seed/karatsu/
├── sessions.ts                 # 会期の定義（slug・ページID・日付）
├── scrape-bills.ts             # 議決結果 → data/<slug>/bills.json
├── parse-voting-results.ts     # HTML表の解析（テストあり）
├── import-bills.ts             # DB反映（冪等）
└── data/<slug>/
    ├── bills.json              # 取得結果（手で編集しない）
    └── contents/<番号>.normal.md / <番号>.hard.md
```

status の対応：可決・採択・認定・承認 → `approved`（「原案可決」以外は表記を `status_note` に残す）、否決・不採択 → `rejected`、継続審査 → `in_committee`、未議決 → `submitted`。否決系を先に判定している。

## 手順

1. **会期を登録**：`sessions.ts` に会期を追記（slug は `r8-4` 形式、`resultsPageId` と `schedulePageId` は各ページのID）
2. **取得**：
   ```bash
   cd packages/seed && pnpm karatsu:scrape <slug>
   ```
   件数と種別の内訳が公式ページと一致するか確認する
3. **資料を読む**：概要PDF → 議案本文 → 必要なら例規集・市の説明ページの順に読む
4. **解説を書く**：`data/<slug>/contents/<番号>.normal.md` と `.hard.md`（下の書き方を守る）
5. **dry-run**：
   ```bash
   pnpm exec tsx --env-file=../../.env karatsu/import-bills.ts <slug> --dry-run
   ```
6. **ユーザーレビュー（必須）**：解説の一覧と本文をユーザーに見せ、承認を得る
7. **DB反映**：`--dry-run` を外して実行（新規は `draft`）。公開はレビュー後に `--publish`（normal / hard がそろった議案だけ `published` にする）。本番は `--env-file=../../.env.production`
8. **確認**：web の議案詳細ページを表示し、表・リンク・タグを目視確認する

## 解説の書き方

```markdown
---
title: わかりやすいタイトル（normal）／「議案第◯号 正式件名」（hard）
summary: 1〜2文。何が・いつから・結果
tags: 財政・予算, 防災        ← normal のみ。カンマ区切り
---
## どんな議案？
...
```

- **normal**：中学生にも分かる言葉。「どんな議案？」「何が変わるの？」「いつから？」「結果」の順を基本にし、新旧の比較は表にする。金額は「約15億2,932万円」のように読みやすく
- **hard**：条文・別表・財源内訳など正確な情報。金額は資料の単位（千円・円）のまま
- 本文の最初は `##`（`#` の大見出しは使わない。タイトルは画面に別に出る）
- **資料に書いてあることだけを書く**。メリット・デメリット、賛否の評価、資料にない背景や推測は書かない。改正前の値は例規集や市の新旧比較表で確かめたものだけを書く
- 末尾に `出典：` として参照した公式資料のリンクを付ける
- 金額は合計を検算する（例：補正予算の事業費の合計が補正額と一致するか）
- タグは既存のものを優先する：財政・予算／子育て・教育／福祉・医療／まちづくり・環境／文化・観光／農林水産／防災
- 同種の議案が大量にある場合（例：施設ごとの使用料改定）は、市の説明ページの背景を共通で使い、施設ごとの新旧料金は市の比較表PDFから取る

## 会期中・閉会後の更新

`scrape-bills.ts` を再実行して `bills.json` を更新し、`import-bills.ts` を実行すると、既存議案は status 等だけが更新される（`publish_status` は `--publish` を付けない限り変わらない）。
