/**
 * 唐津市議会の議決結果一覧を取得し、data/<slug>/bills.json に保存する
 *
 * 使い方:
 *   cd packages/seed && pnpm exec tsx karatsu/scrape-bills.ts r8-4
 */
import fs from "node:fs";
import path from "node:path";
import { parseVotingResults } from "./parse-voting-results";
import { findSession, SHIGIKAI_BASE_URL } from "./sessions";

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("使い方: tsx karatsu/scrape-bills.ts <会期slug（例: r8-4）>");
    process.exit(1);
  }
  const session = findSession(slug);
  const sourceUrl = `${SHIGIKAI_BASE_URL}${session.resultsPageId}.html`;

  console.log(`📥 ${session.name} の議決結果を取得: ${sourceUrl}`);
  const res = await fetch(sourceUrl, {
    headers: { "User-Agent": "mirai-gikai-karatsu (civictech-karatsu.org)" },
  });
  if (!res.ok) throw new Error(`取得に失敗しました: ${res.status}`);
  const html = await res.text();

  const bills = parseVotingResults(html, session.year);
  if (bills.length === 0) {
    throw new Error("議案が1件も見つかりません。ページ構成が変わった可能性があります");
  }

  const outDir = path.join(import.meta.dirname, "data", slug);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "bills.json");
  fs.writeFileSync(
    outFile,
    `${JSON.stringify({ session: slug, sourceUrl, fetchedAt: new Date().toISOString(), bills }, null, 2)}\n`
  );

  const byCategory = bills.reduce<Record<string, number>>((acc, b) => {
    acc[b.category] = (acc[b.category] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`✅ ${bills.length} 件を保存: ${path.relative(process.cwd(), outFile)}`);
  console.log(byCategory);
}

main().catch((error) => {
  console.error("❌", error);
  process.exit(1);
});
