import { createDeepSeek } from "@ai-sdk/deepseek";
import { customProvider, gateway, type LanguageModel } from "ai";
import { AI_MODELS } from "./models";

/**
 * 文字列で指定したモデル（"provider/model" 形式）の接続先を決める
 *
 * - DeepSeek は AI Gateway を通さず、DeepSeek API に直接つなぐ（DEEPSEEK_API_KEY）
 * - それ以外は AI SDK の既定どおり Vercel AI Gateway（AI_GATEWAY_API_KEY）
 */
export function createDefaultAiProvider() {
  const deepseek = createDeepSeek();

  return customProvider({
    languageModels: {
      [AI_MODELS.deepseek_flash]: deepseek("deepseek-flash"),
    },
    fallbackProvider: gateway,
  });
}

const defaultAiProvider = createDefaultAiProvider();

export function resolveLanguageModel(model: LanguageModel) {
  return typeof model === "string"
    ? defaultAiProvider.languageModel(model)
    : model;
}
