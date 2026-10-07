#!/usr/bin/env bash
# Usage: bash scripts/verify.sh   (run from the frontend/ folder, on the feature branch)
# Does NOT stop at the first failure; prints a summary at the end.
FAIL=0
step() { echo; echo "== $1"; }
bad()  { echo "FAIL: $1"; FAIL=1; }

SHARED='^(src/types/index\.ts|src/constants/index\.ts|src/routes/index\.tsx|src/hooks/index\.ts|package\.json|package-lock\.json|tsconfig.*\.json|vite\.config\.ts|src/lib/utils\.ts|src/lib/axios\.ts|src/store/auth\.store\.ts)$'

step "lint";  npm run lint 2>&1 | tail -n 6;           [ "${PIPESTATUS[0]}" -eq 0 ] || bad "lint"
step "build"; npm run build 2>&1 | tail -n 8;          [ "${PIPESTATUS[0]}" -eq 0 ] || bad "build"
step "tests"; npx vitest run 2>&1 | tail -n 12;        [ "${PIPESTATUS[0]}" -eq 0 ] || bad "tests"

step "forbidden: .data.data"
grep -rnE '\.data\.data' src tests && bad ".data.data found"

step "forbidden: string-literal query keys"
grep -rnE "(queryKey|invalidateQueries|setQueryData|getQueryData)[^\n]*\[\s*['\"\`]" src && bad "string-literal query key (use QUERY_KEYS)"

step "forbidden: string-literal page routes"
grep -rnE "(navigate\(|<Navigate to=|<Link to=|to=)\s*[{(]?\s*['\"\`]/" src --include=*.tsx --include=*.ts && bad "route string literal (use ROUTES)"

step "forbidden: file edits outside the feature (shared/partner files)"
CHANGED=$( { git diff --name-only; git diff --cached --name-only; } | sort -u )
echo "$CHANGED" | grep -E "$SHARED" && bad "shared file modified (needs separate tiny PR)"
git diff --name-only HEAD -- src/hooks/index.ts | grep . && bad "src/hooks/index.ts modified"

step "git status --short"
git status --short

echo
[ "$FAIL" -eq 0 ] && echo "VERIFY: PASS" || echo "VERIFY: FAIL"
exit $FAIL
