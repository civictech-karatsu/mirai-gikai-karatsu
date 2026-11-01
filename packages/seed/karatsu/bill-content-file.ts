/**
 * 議案解説ファイル（data/<slug>/contents/<番号>.<normal|hard>.md）の読み込み
 *
 * 形式:
 *   ---
 *   title: わかりやすいタイトル
 *   summary: 1〜2文の要約
 *   tags: 文化・観光, 財政・予算      ← normal のみ。カンマ区切り
 *   ---
 *   本文（Markdown）
 */

export type BillContentFile = {
  title: string;
  summary: string;
  tags: string[];
  content: string;
};

export function parseBillContentFile(
  text: string,
  fileName: string
): BillContentFile {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error(`${fileName}: 先頭に --- で囲んだ title / summary がありません`);
  }

  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }

  if (!meta.title) throw new Error(`${fileName}: title がありません`);
  if (!meta.summary) throw new Error(`${fileName}: summary がありません`);
  const content = match[2].trim();
  if (!content) throw new Error(`${fileName}: 本文がありません`);

  return {
    title: meta.title,
    summary: meta.summary,
    tags: meta.tags
      ? meta.tags
          .split(/[,、]/)
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    content,
  };
}
