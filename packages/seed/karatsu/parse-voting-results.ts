/**
 * 唐津市議会「議決結果一覧」ページ（例: /site/shigikai/51132.html）の解析
 *
 * 表は1件につき2行で構成される:
 *   1行目: 種別 | 番号 | 件名 | 結果 | 提出日 | 会議名
 *   2行目: 議決日 | 会議名
 */

export type BillCategory =
  | "補正予算"
  | "当初予算"
  | "条例"
  | "人事"
  | "一般"
  | "決算"
  | "報告"
  | "意見書"
  | "決議"
  | "請願"
  | "その他";

export type BillStatus = "approved" | "rejected" | "in_committee" | "submitted";

export type VotingResult = {
  category: BillCategory;
  /** 表記どおりの番号（例: "議案第86号"） */
  label: string;
  /** DB の bills.bill_number に入れる番号部分（例: "86"） */
  number: string;
  name: string;
  /** 表記どおりの結果（例: "原案可決"、"認定"） */
  result: string;
  status: BillStatus;
  /** 結果が「可決」以外の承認系のとき、その表記を残す（例: "認定"） */
  statusNote: string | null;
  /** YYYY-MM-DD */
  submittedOn: string | null;
  /** YYYY-MM-DD */
  decidedOn: string | null;
};

const KNOWN_CATEGORIES: BillCategory[] = [
  "補正予算",
  "当初予算",
  "条例",
  "人事",
  "一般",
  "決算",
  "報告",
  "意見書",
  "決議",
  "請願",
];

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function cellText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ""))
    .replace(/[\s​]+/g, "")
    .trim();
}

function toHalfWidthDigits(text: string): string {
  return text.replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );
}

/** "9月25日" を西暦の日付にする。年は会期の開始年から決める */
export function toIsoDate(monthDay: string, year: number): string | null {
  const m = toHalfWidthDigits(monthDay).match(/(\d{1,2})月(\d{1,2})日/);
  if (!m) return null;
  return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

/**
 * 議決結果の表記を status に変換する。
 * 「不採択」「否決」を先に判定する（「採択」「可決」の部分一致で誤判定しないため）。
 */
export function toStatus(result: string): {
  status: BillStatus;
  statusNote: string | null;
} {
  if (/否決|不採択|不承認|不認定/.test(result)) {
    return { status: "rejected", statusNote: result === "否決" ? null : result };
  }
  if (/継続審査|継続審議/.test(result)) {
    return { status: "in_committee", statusNote: "継続審査" };
  }
  if (/可決|採択|認定|承認|同意|適任|受理/.test(result)) {
    return {
      status: "approved",
      statusNote: result === "原案可決" || result === "可決" ? null : result,
    };
  }
  return { status: "submitted", statusNote: null };
}

function toCategory(text: string): BillCategory {
  return (KNOWN_CATEGORIES as string[]).includes(text)
    ? (text as BillCategory)
    : "その他";
}

/**
 * 議決結果一覧ページの HTML から議案等の一覧を取り出す
 * @param year 会期の開始年（提出日・議決日の年に使う）
 */
export function parseVotingResults(html: string, year: number): VotingResult[] {
  const results: VotingResult[] = [];
  const rows = [...html.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((m) =>
    [...m[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) =>
      cellText(c[1])
    )
  );

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i];
    if (cells.length < 6) continue;
    const [category, label, name, result, submitted] = cells;
    const numberMatch = toHalfWidthDigits(label).match(/第(\d+)号/);
    if (!numberMatch) continue;

    // 次の行が「議決日 | 会議名」の2セル行なら議決日として読む
    const next = rows[i + 1];
    const decidedOn =
      next && next.length === 2 ? toIsoDate(next[0], year) : null;
    if (next && next.length === 2) i++;

    results.push({
      category: toCategory(category),
      label,
      number: numberMatch[1],
      name,
      result,
      ...toStatus(result),
      submittedOn: toIsoDate(submitted, year),
      decidedOn,
    });
  }

  return results;
}
