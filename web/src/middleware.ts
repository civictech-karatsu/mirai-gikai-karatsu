import { type NextRequest, NextResponse } from "next/server";
import { siteConfig } from "./config/site.config";
import {
  DIFFICULTY_COOKIE_NAME,
  DIFFICULTY_COOKIE_OPTIONS,
  type DifficultyLevelEnum,
  VALID_DIFFICULTY_LEVELS,
} from "./features/bill-difficulty/shared/types";
import {
  createUnauthorizedResponse,
  getBasicAuthConfig,
  isPageSpeedInsights,
  validateBasicAuth,
} from "./lib/basic-auth";
import { updateSupabaseSession } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // /dev routes: 本番では404、開発ではauthスキップ
  if (request.nextUrl.pathname.startsWith("/dev")) {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.rewrite(new URL("/not-found", request.url));
    }
    return NextResponse.next();
  }

  // AIインタビュー機能がオフのときは、関連ページ・APIを URL 直打ちでも開けないようにする
  if (
    !siteConfig.features.aiInterview &&
    isInterviewPath(request.nextUrl.pathname)
  ) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  // AIチャット機能がオフのときは、チャットAPIを直接呼ばれてもトークンを消費しないようにする
  if (!siteConfig.features.aiChat && isChatApiPath(request.nextUrl.pathname)) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // Supabaseセッションをリフレッシュ（トークン期限切れ時に自動更新）
  const response = await updateSupabaseSession(request);

  // URLパラメータからdifficulty Cookieをセット
  _applyDifficultyCookie(request, response);

  const authConfig = getBasicAuthConfig();

  // Basic認証の設定がない場合はスキップ
  if (!authConfig) {
    return response;
  }

  // HTML ナビゲーションだけ認証（画像やJSON, css/js, fetch等は通す）
  if (!_isHtmlRequest(request)) return response;

  // PageSpeed Insightsからのアクセスは認証をスキップ
  if (isPageSpeedInsights(request)) {
    return response;
  }

  // Basic認証の検証
  if (validateBasicAuth(request, authConfig)) {
    return response;
  }

  return createUnauthorizedResponse();
}

/**
 * 有効な難易度レベルかチェック
 */
export function isValidDifficultyLevel(
  value: string | null
): value is DifficultyLevelEnum {
  if (!value) return false;
  return VALID_DIFFICULTY_LEVELS.includes(value as DifficultyLevelEnum);
}

/**
 * URLパラメータからdifficultyを取得し、レスポンスのCookieにセット
 */
function _applyDifficultyCookie(
  request: NextRequest,
  response: NextResponse
): void {
  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get("difficulty");

  if (isValidDifficultyLevel(difficulty)) {
    response.cookies.set(
      DIFFICULTY_COOKIE_NAME,
      difficulty,
      DIFFICULTY_COOKIE_OPTIONS
    );
  }
}

const INTERVIEW_PATH_PATTERNS = [
  /^\/(preview\/)?bills\/[^/]+\/interview(\/|$)/,
  /^\/bills\/[^/]+\/opinions(\/|$)/,
  /^\/report(\/|$)/,
  /^\/api\/interview(\/|$)/,
  /^\/api\/og\/report(\/|$)/,
];

/**
 * AIインタビュー機能に属するパスかどうか
 */
export function isInterviewPath(pathname: string): boolean {
  return INTERVIEW_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

/**
 * AIチャット機能のAPIパスかどうか
 */
export function isChatApiPath(pathname: string): boolean {
  return /^\/api\/chat(\/|$)/.test(pathname);
}

export function isHtmlAcceptHeader(accept: string): boolean {
  return accept.includes("text/html");
}

function _isHtmlRequest(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  return isHtmlAcceptHeader(accept);
}

export const config = {
  matcher: [
    /*
     * _next/static, _next/image, favicon.ico, 画像ファイル等の
     * 静的アセットを除外し、ページリクエストのみでミドルウェアを実行する
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
