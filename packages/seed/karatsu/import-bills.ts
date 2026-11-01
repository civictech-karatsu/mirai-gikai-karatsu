/**
 * data/<slug>/bills.json と contents/*.md を DB に反映する（冪等）
 *
 * 使い方（packages/seed で実行。接続先は --env-file の SUPABASE_URL）:
 *   pnpm exec tsx --env-file=../../.env karatsu/import-bills.ts r8-4 --dry-run
 *   pnpm exec tsx --env-file=../../.env karatsu/import-bills.ts r8-4
 *   pnpm exec tsx --env-file=../../.env karatsu/import-bills.ts r8-4 --publish
 *
 * - 一意キーは (council_session_id, bill_number)。既存の議案は状態だけ更新し、publish_status は変えない
 * - 新規の議案は draft で登録する。--publish を付けると、解説（normal / hard）がそろった議案だけ published にする
 * - 人事案件・報告は取り込まない
 */
import fs from "node:fs";
import path from "node:path";
import type { Database } from "@mirai-gikai/supabase";
import { createAdminClient } from "../shared/helper";
import { type BillContentFile, parseBillContentFile } from "./bill-content-file";
import type { BillCategory, VotingResult } from "./parse-voting-results";
import { findSession, SHIGIKAI_BASE_URL } from "./sessions";

type BillInsert = Database["public"]["Tables"]["bills"]["Insert"];
type Difficulty = Database["public"]["Enums"]["difficulty_level_enum"];

const EXCLUDED_CATEGORIES: BillCategory[] = ["人事", "報告"];
const DIFFICULTIES: Difficulty[] = ["normal", "hard"];

type BillsFile = { session: string; sourceUrl: string; bills: VotingResult[] };

function loadContents(dir: string, number: string) {
  const contents: Partial<Record<Difficulty, BillContentFile>> = {};
  for (const level of DIFFICULTIES) {
    const file = path.join(dir, `${number}.${level}.md`);
    if (fs.existsSync(file)) {
      contents[level] = parseBillContentFile(
        fs.readFileSync(file, "utf-8"),
        path.basename(file)
      );
    }
  }
  return contents;
}

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith("--"));
  const dryRun = args.includes("--dry-run");
  const publish = args.includes("--publish");
  if (!slug) {
    console.error("使い方: tsx karatsu/import-bills.ts <会期slug> [--dry-run] [--publish]");
    process.exit(1);
  }

  const session = findSession(slug);
  const dataDir = path.join(import.meta.dirname, "data", slug);
  const billsFile: BillsFile = JSON.parse(
    fs.readFileSync(path.join(dataDir, "bills.json"), "utf-8")
  );
  const targets = billsFile.bills.filter(
    (b) => !EXCLUDED_CATEGORIES.includes(b.category)
  );
  const contentsDir = path.join(dataDir, "contents");
  const plans = targets.map((bill) => ({
    bill,
    contents: loadContents(contentsDir, bill.number),
  }));

  const withContents = plans.filter((p) => p.contents.normal && p.contents.hard);
  const partial = plans.filter(
    (p) => Boolean(p.contents.normal) !== Boolean(p.contents.hard)
  );
  console.log(`📋 ${session.name}: 取り込み対象 ${targets.length} 件（除外 ${billsFile.bills.length - targets.length} 件）`);
  console.log(`   解説あり ${withContents.length} 件 / 解説なし ${plans.length - withContents.length} 件`);
  for (const p of partial) {
    console.warn(`   ⚠️ 第${p.bill.number}号: normal と hard の片方しかありません`);
  }

  if (dryRun) {
    for (const p of withContents) {
      console.log(`   - 第${p.bill.number}号 ${p.contents.normal?.title} [${p.contents.normal?.tags.join(", ")}]`);
    }
    console.log("🔎 --dry-run のため DB は変更していません");
    return;
  }

  const supabase = createAdminClient();

  // 会期
  const { data: councilSession, error: sessionError } = await supabase
    .from("council_sessions")
    .upsert(
      {
        slug: session.slug,
        name: session.name,
        start_date: session.startDate,
        end_date: session.endDate,
        council_url: `${SHIGIKAI_BASE_URL}${session.schedulePageId}.html`,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();
  if (sessionError) throw new Error(`会期の登録に失敗: ${sessionError.message}`);

  // タグ（label で照合し、無ければ作る）
  const tagLabels = [
    ...new Set(withContents.flatMap((p) => p.contents.normal?.tags ?? [])),
  ];
  const tagIds = new Map<string, string>();
  if (tagLabels.length > 0) {
    const { data: tags, error } = await supabase
      .from("tags")
      .upsert(
        tagLabels.map((label) => ({ label })),
        { onConflict: "label", ignoreDuplicates: false }
      )
      .select("id, label");
    if (error) throw new Error(`タグの登録に失敗: ${error.message}`);
    for (const t of tags ?? []) tagIds.set(t.label, t.id);
  }

  const { data: existing, error: existingError } = await supabase
    .from("bills")
    .select("id, bill_number")
    .eq("council_session_id", councilSession.id);
  if (existingError) throw new Error(existingError.message);
  const existingIds = new Map(existing.map((b) => [b.bill_number, b.id]));

  let inserted = 0;
  let updated = 0;
  let contentsUpserted = 0;
  let published = 0;

  for (const { bill, contents } of plans) {
    const hasContents = Boolean(contents.normal && contents.hard);
    const fields: BillInsert = {
      name: bill.name,
      bill_number: bill.number,
      council_session_id: councilSession.id,
      status: bill.status,
      status_note: bill.statusNote,
      published_at: `${bill.submittedOn ?? session.startDate}T09:00:00+09:00`,
    };
    if (publish && hasContents) fields.publish_status = "published";

    let billId = existingIds.get(bill.number);
    if (billId) {
      const { error } = await supabase.from("bills").update(fields).eq("id", billId);
      if (error) throw new Error(`第${bill.number}号の更新に失敗: ${error.message}`);
      updated++;
    } else {
      const { data, error } = await supabase
        .from("bills")
        .insert({ publish_status: "draft", ...fields })
        .select("id")
        .single();
      if (error) throw new Error(`第${bill.number}号の登録に失敗: ${error.message}`);
      billId = data.id;
      inserted++;
    }
    if (fields.publish_status === "published") published++;

    if (!hasContents) continue;

    const { error: contentsError } = await supabase.from("bill_contents").upsert(
      DIFFICULTIES.map((level) => ({
        bill_id: billId,
        difficulty_level: level,
        title: contents[level]!.title,
        summary: contents[level]!.summary,
        content: contents[level]!.content,
      })),
      { onConflict: "bill_id,difficulty_level" }
    );
    if (contentsError) throw new Error(`第${bill.number}号の解説の登録に失敗: ${contentsError.message}`);
    contentsUpserted++;

    // タグは解説ファイルの指定で置き換える
    await supabase.from("bills_tags").delete().eq("bill_id", billId);
    const links = (contents.normal?.tags ?? []).map((label) => ({
      bill_id: billId,
      tag_id: tagIds.get(label)!,
    }));
    if (links.length > 0) {
      const { error } = await supabase.from("bills_tags").insert(links);
      if (error) throw new Error(`第${bill.number}号のタグ付けに失敗: ${error.message}`);
    }
  }

  console.log(`✅ 議案 新規 ${inserted} 件 / 更新 ${updated} 件、解説 ${contentsUpserted} 件、公開 ${published} 件`);
}

main().catch((error) => {
  console.error("❌", error);
  process.exit(1);
});
