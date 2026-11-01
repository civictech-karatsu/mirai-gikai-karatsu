import { describe, expect, it } from "vitest";
import { parseVotingResults, toIsoDate, toStatus } from "./parse-voting-results";

const row = (cells: string[]) =>
  `<tr>${cells.map((c) => `<td>\n<p>${c}</p>\n</td>`).join("")}</tr>`;

const html = `<table>
${row(["種別", "番号", "件名", "結果", "提出日", "会議名<br>議決日"])}
${row(["補正予算", "議案第86号", "令和８年度唐津市一般会計補正予算", "原案可決", "9月1日", "第4回定例会"])}
${row(["9月25日", "第4回定例会"])}
${row(["決算", "議案第130号", "令和７年度唐津市一般会計歳入歳出決算", "認定", "9月25日", "第4回定例会"])}
${row(["10月13日", "第4回定例会"])}
${row(["報告", "報告第19号", "専決処分の報告について（その１）", "受理", "9月1日", "第4回定例会"])}
${row(["-", "-"])}
</table>`;

describe("parseVotingResults", () => {
  it("2行で1件の表から議案を取り出し、議決日を2行目から読む", () => {
    const bills = parseVotingResults(html, 2026);

    expect(bills).toHaveLength(3);
    expect(bills[0]).toEqual({
      category: "補正予算",
      label: "議案第86号",
      number: "86",
      name: "令和８年度唐津市一般会計補正予算",
      result: "原案可決",
      status: "approved",
      statusNote: null,
      submittedOn: "2026-09-01",
      decidedOn: "2026-09-25",
    });
  });

  it("決算の「認定」は可決扱いにし、表記を statusNote に残す", () => {
    const [, settlement] = parseVotingResults(html, 2026);

    expect(settlement.status).toBe("approved");
    expect(settlement.statusNote).toBe("認定");
    expect(settlement.decidedOn).toBe("2026-10-13");
  });

  it("議決日が「-」の報告は decidedOn を null にする", () => {
    const report = parseVotingResults(html, 2026)[2];

    expect(report.category).toBe("報告");
    expect(report.decidedOn).toBeNull();
  });
});

describe("toStatus", () => {
  it.each([
    ["原案可決", "approved", null],
    ["修正可決", "approved", "修正可決"],
    ["否決", "rejected", null],
    ["不採択", "rejected", "不採択"],
    ["不認定", "rejected", "不認定"],
    ["継続審査", "in_committee", "継続審査"],
  ])("%s → %s", (result, status, note) => {
    expect(toStatus(result)).toEqual({ status, statusNote: note });
  });
});

describe("toIsoDate", () => {
  it("全角数字の月日も西暦日付にする", () => {
    expect(toIsoDate("１０月１３日", 2026)).toBe("2026-10-13");
  });

  it("日付でない文字列は null", () => {
    expect(toIsoDate("-", 2026)).toBeNull();
  });
});
