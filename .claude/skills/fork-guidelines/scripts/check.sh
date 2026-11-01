#!/usr/bin/env bash
# みらい議会 fork ガイドライン（唐津市版）の自動チェック
# 使い方: リポジトリルートで bash .claude/skills/fork-guidelines/scripts/check.sh
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

ng=0
ok()   { echo "OK   $1"; }
bad()  { echo "NG   $1"; ng=$((ng + 1)); }
warn() { echo "WARN $1"; }

# 1. サービス名
if grep -q 'siteName: "みらい議会＠唐津市"' web/src/config/site.config.ts \
  && grep -q 'siteName: "みらい議会＠唐津市"' admin/src/config/site.config.ts \
  && grep -q '"name": "みらい議会＠唐津市"' web/public/manifest.json; then
  ok "サービス名が「みらい議会＠唐津市」で統一されている"
else
  bad "サービス名（web/admin site.config.ts, manifest.json）が「みらい議会＠唐津市」になっていない"
fi

# 2-3. ロゴ・アイコン・トップ画像・OGP（本家・fork 元のどれとも同一でないか）
refs=""
for r in upstream/develop fukuoka/kawasaki/develop fukuoka/fukuoka-city/develop; do
  git rev-parse --verify -q "$r" >/dev/null && refs="$refs $r"
done
[ -z "$refs" ] && warn "比較対象の上流ブランチが無い（git fetch upstream / git fetch fukuoka を実行）"
for f in web/public/img/logo.svg web/public/icons/pwa/icon_android_192.png \
  web/public/icons/pwa/icon_android_512.png web/public/icons/pwa/icon_ios.png \
  web/public/img/hero_background.png web/public/ogp.jpg; do
  same=""
  for r in $refs; do
    if git cat-file -e "$r:$f" 2>/dev/null \
      && [ "$(git hash-object "$f")" = "$(git rev-parse "$r:$f")" ]; then
      same="$r"; break
    fi
  done
  if [ -n "$same" ]; then
    bad "$f が $same と同一（独自素材に差し替える）"
  elif [ -n "$refs" ]; then
    ok "$f は独自素材"
  fi
done

# 4. 本家ブランドカラー
hits=$(grep -rniE '#(2aa693|0f8472|64d8c6|bcecd3)\b' web/src web/public/manifest.json \
  --include='*.ts' --include='*.tsx' --include='*.css' --include='*.json' 2>/dev/null)
if [ -n "$hits" ]; then
  bad "本家ブランドカラーが残っている:"; echo "$hits" | sed 's/^/       /'
else
  ok "本家ブランドカラー（#2aa693 等）は使われていない"
fi

# 5. 免責文言
if grep -rq "これは政党チームみらいが運営しているものではありません" web/src/components/layouts/footer/; then
  ok "フッターに免責文言がある"
else
  bad "フッターに免責文言「これは政党チームみらいが運営しているものではありません」が無い"
fi

# 6. ソースコード公開先
src_url=$(grep -oE 'sourceCode: "[^"]+"' web/src/config/site.config.ts | cut -d'"' -f2)
if [ -z "$src_url" ]; then
  bad "siteConfig.externalLinks.sourceCode が未設定"
elif echo "$src_url" | grep -q "team-mirai/mirai-gikai"; then
  bad "sourceCode が本家リポジトリを指している（fork 版自身の URL にする）"
elif ! grep -q "sourceCode" web/src/components/layouts/footer/footer.tsx; then
  bad "フッターにソースコードリンクが表示されていない"
else
  ok "ソースコード公開先: $src_url"
fi

# チームみらいの党関連表示
if grep -q 'showTeamMiraiSection: false' web/src/config/site.config.ts; then
  ok "showTeamMiraiSection は false"
else
  bad "showTeamMiraiSection が false になっていない"
fi

# 他地域の名残（固定文言）
leftover=$(grep -rnE '川崎|福岡' web/src admin/src --include='*.ts' --include='*.tsx' 2>/dev/null \
  | grep -vE '\.test\.tsx?:|site\.config\.ts:')
if [ -n "$leftover" ]; then
  warn "他地域名（川崎・福岡）の固定文言が残っている:"; echo "$leftover" | sed 's/^/       /'
else
  ok "web/admin のコードに他地域名の固定文言は無い"
fi

echo
if [ "$ng" -gt 0 ]; then
  echo "NG: $ng 件。fork ガイドライン違反を修正してください。"
  exit 1
fi
echo "fork ガイドラインの自動チェックはすべて OK"
