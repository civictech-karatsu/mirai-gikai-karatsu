/**
 * 配信パス（next.config.ts の basePath）
 *
 * civictech-karatsu.org/mirai-gikai の下で配信するため、Next.js が自動で
 * basePath を付けない public 配下の画像・アイコン・manifest や fetch の URL に使う。
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
