import { describe, expect, it } from "vitest";
import { withBasePath } from "./base-path";

describe("withBasePath", () => {
  it("basePath 未設定のときはパスをそのまま返す", () => {
    expect(withBasePath("/icons/a.svg")).toBe("/icons/a.svg");
  });
});
