#!/bin/bash

# Preflight: make the working copy match reality before any work starts.
#
# Why this exists: three separate sessions burned part of a run repairing the
# same class of entry-time drift, each time discovering it the hard way —
#   2026-08-29  local main held a commit origin never got; `git pull --ff-only`
#               failed for every run entering the repo.
#   2026-08-31  local main was 2 commits behind origin (#232, #233).
#   2026-09-02  local main was 3 commits behind (#234-#236), two merged
#               worktrees were still checked out, and `frontend/node_modules`
#               predated the prettier devDependency added in #233 — so the very
#               first gate of `npm run verify` died on "prettier: not found",
#               which looks like a repo bug and is not one.
# A bare `git status` reports "clean" in all three cases. This closes the class.
#
# Usage: npm run preflight   (read-only by default)
#        npm run preflight -- --fix   (fast-forward, prune, reinstall)

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

FIX=0
[[ "${1:-}" == "--fix" ]] && FIX=1

RED=$'\033[0;31m'; YELLOW=$'\033[1;33m'; GREEN=$'\033[0;32m'; NC=$'\033[0m'
drift=0

note()  { printf '%s\n' "  $1"; }
warn()  { printf '%s\n' "${YELLOW}!${NC} $1"; drift=1; }
ok()    { printf '%s\n' "${GREEN}✓${NC} $1"; }

# 1. Divergence from origin. `git status` alone cannot see this without a fetch.
git fetch --quiet --prune origin
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if git rev-parse --verify --quiet "origin/$BRANCH" >/dev/null; then
  behind="$(git rev-list --count "HEAD..origin/$BRANCH")"
  ahead="$(git rev-list --count "origin/$BRANCH..HEAD")"
  if [[ "$behind" != 0 || "$ahead" != 0 ]]; then
    warn "$BRANCH is ${ahead} ahead / ${behind} behind origin/$BRANCH"
    if [[ $FIX == 1 && "$ahead" == 0 ]]; then
      git merge --ff-only "origin/$BRANCH" >/dev/null && note "fast-forwarded to origin/$BRANCH"
    elif [[ "$ahead" != 0 ]]; then
      note "${RED}ahead of origin — a prior run may have left unpushed commits; inspect before pushing${NC}"
    fi
  else
    ok "$BRANCH in sync with origin"
  fi
else
  note "$BRANCH has no upstream yet — divergence check skipped"
fi

# 2. Worktrees and branches whose commits already landed upstream (squash-merged
#    PRs leave these behind; `git branch --merged` misses them because the squash
#    is a different commit — `git cherry` compares patch ids instead).
stale=()
while read -r _ _ ref; do
  [[ "$ref" =~ ^\[(.+)\]$ ]] || continue
  b="${BASH_REMATCH[1]}"
  [[ "$b" == "$BRANCH" ]] && continue
  if [[ -z "$(git cherry "$BRANCH" "$b" 2>/dev/null | grep '^+' || true)" ]]; then
    stale+=("$b")
  fi
done < <(git worktree list)

if ((${#stale[@]})); then
  warn "merged worktree branches still checked out: ${stale[*]}"
  if [[ $FIX == 1 ]]; then
    for b in "${stale[@]}"; do
      wt="$(git worktree list --porcelain | grep -B2 "branch refs/heads/$b\$" | head -1 | cut -d' ' -f2-)"
      if [[ -n "$(git -C "$wt" status --porcelain)" ]]; then
        note "${RED}$b has uncommitted changes — left alone${NC}"
        continue
      fi
      git worktree remove "$wt" && git branch -D "$b" >/dev/null && note "removed $b"
    done
    git worktree prune
  fi
else
  ok "no stale worktrees"
fi

# 3. Installed dependencies older than the lockfile. This is what breaks
#    `npm run verify` in a way that reads as a repo bug (see #233/prettier).
for pkg in frontend backend; do
  lock="$pkg/package-lock.json"
  stamp="$pkg/node_modules/.package-lock.json"
  [[ -f "$lock" ]] || continue
  if [[ ! -d "$pkg/node_modules" || "$lock" -nt "$stamp" ]]; then
    warn "$pkg/node_modules is stale or missing (older than $lock)"
    if [[ $FIX == 1 ]]; then
      # --legacy-peer-deps mirrors CI; frontend has unresolvable peers otherwise.
      (cd "$pkg" && npm ci --legacy-peer-deps) && note "reinstalled $pkg"
    fi
  else
    ok "$pkg/node_modules matches lockfile"
  fi
done

if [[ $drift == 1 && $FIX == 0 ]]; then
  printf '\n%s\n' "${YELLOW}Drift found. Re-run with:${NC} npm run preflight -- --fix"
  exit 1
fi
printf '\n%s\n' "${GREEN}Preflight clean.${NC}"
