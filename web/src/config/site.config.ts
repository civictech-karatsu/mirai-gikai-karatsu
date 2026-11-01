/**
 * サイト設定ファイル
 * Fork して別の地方議会向けに使用する場合はこのファイルを変更してください。
 * @see docs/kawasaki/20260304_1000_別地域向けfork手順.md
 */
export const siteConfig = {
  siteName: "みらい議会＠唐津市",
  siteDescription:
    "唐津市議会で今どんな議案が検討されているか、わかりやすく伝えるプラットフォームです",
  cityName: "唐津市",
  councilName: "唐津市議会",
  keywords: [
    "みらい議会＠唐津市",
    "議案",
    "唐津市",
    "市議会",
    "地方政治",
    "政策",
    "解説",
  ],
  councilBaseUrl: "https://www.city.karatsu.lg.jp/site/shigikai/",
  /** 議案・議決結果の一覧ページ */
  councilBillsDetailUrl:
    "https://www.city.karatsu.lg.jp/site/shigikai/list134-332.html",
  twitterHashtag: "みらい議会唐津市版", // # なし
  externalLinks: {
    report: "" as string, // TODO: 問題報告用の Google フォームを作成して設定
    aboutNote: "",
    donation: "https://team-mir.ai/support/donation",
    teamAbout: "https://team-mir.ai/about",
    terms: "https://team-mir.ai/terms",
    privacy: "https://team-mir.ai/privacy",
    faq: "https://team-mirai.notion.site/FAQ-28cf6f56bae180bd84e7f7ae80f806a1",
    /** この fork 版自身のソースコード公開先（AGPL-3.0 第13条） */
    sourceCode: "https://github.com/civictech-karatsu/mirai-gikai-karatsu",
    /** fork 元（本家みらい議会） */
    upstreamSite: "https://gikai.team-mir.ai/",
    upstreamRepo: "https://github.com/team-mirai/mirai-gikai",
  },
  /**
   * ページを管理する政党名（空文字列の場合は政党名を省略した汎用表現を使用）
   * 例: "チームみらい"
   */
  managingParty: "" as string,
  /**
   * サービス運営者情報
   * 利用規約や問い合わせ先に使用します。
   */
  operator: {
    name: "シビックテック唐津" as string,
    contactUrl: "https://civictech-karatsu.org/" as string,
    /** 利用規約の準拠法・管轄裁判所（第一審の専属的合意管轄） */
    jurisdiction: "佐賀地方裁判所" as string,
  },
  /**
   * AI機能の有効/無効設定
   * 本番環境のコスト管理のため、機能ごとにオン/オフを切り替えられます。
   */
  features: {
    /** AIチャット機能（議案への質問・テキスト選択からの質問）*/
    aiChat: false,
    /** AIインタビュー機能（議案当事者へのヒアリング）*/
    aiInterview: false,
    /**
     * チームみらいセクションの表示（トップページ・フッター・デスクトップメニュー）
     * 非公式運営など、党の公式サービスとして出さない場合は false にする。
     */
    showTeamMiraiSection: false as boolean,
  },
} as const;
