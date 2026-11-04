import { describe, expect, it } from "vitest";
import {
  createDefaultAiProvider,
  resolveLanguageModel,
} from "./default-provider";
import { AI_MODELS } from "./models";

describe("createDefaultAiProvider", () => {
  it("DeepSeek のモデルは DeepSeek API に直接つなぐ", () => {
    const model = createDefaultAiProvider().languageModel(
      AI_MODELS.deepseek_flash
    );

    expect(model.provider).toMatch(/^deepseek/);
    expect(model.modelId).toBe("deepseek-flash");
  });

  it("それ以外のモデルは AI Gateway につなぐ", () => {
    const model = createDefaultAiProvider().languageModel(AI_MODELS.gpt4o);

    expect(model.provider).toBe("gateway");
    expect(model.modelId).toBe(AI_MODELS.gpt4o);
  });
});

describe("resolveLanguageModel", () => {
  it("文字列のモデル ID を接続先のモデルに変換する", () => {
    const model = resolveLanguageModel(AI_MODELS.deepseek_flash);

    expect(typeof model).not.toBe("string");
  });
});
