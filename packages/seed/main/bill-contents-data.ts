/**
 * 開発用のサンプル議案
 *
 * 令和8年第4回定例会の実際の議案から数件を選び、
 * karatsu/data/r8-4 の bills.json と解説 Markdown をそのまま使う。
 * 解説の内容を変えるときは Markdown 側を直す（ここに本文は書かない）。
 */
import fs from "node:fs";
import path from "node:path";
import type { Database } from "@mirai-gikai/supabase";
import {
  type BillContentFile,
  parseBillContentFile,
} from "../karatsu/bill-content-file";
import type { VotingResult } from "../karatsu/parse-voting-results";

type BillInsert = Database["public"]["Tables"]["bills"]["Insert"];
type DifficultyLevel = Database["public"]["Enums"]["difficulty_level_enum"];

const SAMPLE_SESSION_SLUG = "r8-4";
// 先頭の議案にデモ用インタビューが付く。先頭2件は注目の議案にする
const SAMPLE_BILL_NUMBERS = ["103", "111", "118", "86", "130"];
const FEATURED_COUNT = 2;
const DIFFICULTY_LEVELS: DifficultyLevel[] = ["normal", "hard"];

const dataDir = path.join(
  import.meta.dirname,
  "..",
  "karatsu",
  "data",
  SAMPLE_SESSION_SLUG
);

type SampleBill = {
  bill: VotingResult;
  contents: Record<DifficultyLevel, BillContentFile>;
};

function loadSampleBills(): SampleBill[] {
  const { bills } = JSON.parse(
    fs.readFileSync(path.join(dataDir, "bills.json"), "utf-8")
  ) as { bills: VotingResult[] };

  return SAMPLE_BILL_NUMBERS.map((number) => {
    const bill = bills.find((b) => b.number === number);
    if (!bill) {
      throw new Error(`第${number}号が bills.json にありません`);
    }
    const contents = Object.fromEntries(
      DIFFICULTY_LEVELS.map((level) => {
        const file = path.join(dataDir, "contents", `${number}.${level}.md`);
        return [
          level,
          parseBillContentFile(
            fs.readFileSync(file, "utf-8"),
            path.basename(file)
          ),
        ];
      })
    ) as Record<DifficultyLevel, BillContentFile>;
    return { bill, contents };
  });
}

const sampleBills = loadSampleBills();

export const bills: BillInsert[] = sampleBills.map(({ bill }, index) => ({
  name: bill.name,
  bill_number: bill.number,
  status: bill.status,
  status_note: bill.statusNote,
  published_at: `${bill.submittedOn}T09:00:00+09:00`,
  publish_status: "published",
  is_featured: index < FEATURED_COUNT,
}));

// 議案名 → タグ（normal の解説ファイルの tags）
export const billTagMap: { [billName: string]: string[] } =
  Object.fromEntries(
    sampleBills.map(({ bill, contents }) => [bill.name, contents.normal.tags])
  );

export function createBillContents(
  insertedBills: { id: string; name: string }[]
) {
  return sampleBills.flatMap(({ bill, contents }) => {
    const inserted = insertedBills.find((b) => b.name === bill.name);
    if (!inserted) {
      throw new Error(`Bill not found for content: ${bill.name}`);
    }

    return DIFFICULTY_LEVELS.map((level) => ({
      bill_id: inserted.id,
      difficulty_level: level,
      title: contents[level].title,
      summary: contents[level].summary,
      content: contents[level].content,
    }));
  });
}
