/**
 * 取り込み対象の会期
 * 新しい会期を取り込むときは、唐津市議会サイトの「議決結果」「会期および議事日程」のページIDを追記する。
 * - 議決結果: https://www.city.karatsu.lg.jp/site/shigikai/list134-332.html
 * - 会期および議事日程: https://www.city.karatsu.lg.jp/site/shigikai/list134-330.html
 */
export type KaratsuSession = {
  /** council_sessions.slug と一致させる（例: 令和8年第4回 → "r8-4"） */
  slug: string;
  name: string;
  /** 西暦の開始年（議決結果ページの「9月1日」などに年を補うため） */
  year: number;
  startDate: string;
  endDate: string;
  /** 議決結果一覧ページのID（/site/shigikai/<id>.html） */
  resultsPageId: string;
  /** 会期および議事日程ページのID */
  schedulePageId: string;
};

export const SHIGIKAI_BASE_URL = "https://www.city.karatsu.lg.jp/site/shigikai/";

export const KARATSU_SESSIONS: KaratsuSession[] = [
  {
    slug: "r8-4",
    name: "令和8年 第4回定例会",
    year: 2026,
    startDate: "2026-09-01",
    endDate: "2026-10-13",
    resultsPageId: "51132",
    schedulePageId: "50721",
  },
];

export function findSession(slug: string): KaratsuSession {
  const session = KARATSU_SESSIONS.find((s) => s.slug === slug);
  if (!session) {
    throw new Error(
      `会期 "${slug}" が sessions.ts にありません（登録済み: ${KARATSU_SESSIONS.map((s) => s.slug).join(", ")}）`
    );
  }
  return session;
}
