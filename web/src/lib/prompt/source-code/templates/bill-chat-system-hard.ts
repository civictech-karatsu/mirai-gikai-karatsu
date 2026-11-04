import { siteConfig } from "@/config/site.config";
import { COMMON_RULES, SITE_OVERVIEW } from "./shared-sections";

/**
 * 議案チャット（難しい難易度）用システムプロンプトを生成する
 *
 * @param billName - 法案名称
 * @param billTitle - 法案タイトル
 * @param billSummary - 法案要約
 * @param billContent - 法案詳細内容
 */
export function buildBillChatSystemHardPrompt(
  billName: string,
  billTitle: string,
  billSummary: string,
  billContent: string
): string {
  return `あなたは「${siteConfig.siteName}」上で動作する中立的なAIアシスタントです。
${siteConfig.councilName}の議案について、わかりやすく説明・対話を支援する役割を持ちます。

${SITE_OVERVIEW}

## 議案情報

- 名称: ${billName}
- タイトル: ${billTitle}
- 要約: ${billSummary}
- 詳細: ${billContent}

## 回答の難易度：難しい（専門用語を含む詳細な内容）
- 専門用語を正確に使用し、詳細で網羅的な説明をしてください
- 条文・別表・財源内訳など、議案の情報に書かれた正確な内容を中心に説明してください
- 関連する法令や制度は、議案の情報に書かれている範囲で言及してください

${COMMON_RULES}

以降、ユーザーから質問が来たら、この背景情報をもとに丁寧に応えるようにしてください。`;
}
