#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

LOG_PREFIX="[issue-worker]"
ISSUE_IDENTIFIER="${ISSUE_IDENTIFIER:-}"
ISSUE_SCRIPT_PATH="${ISSUE_SCRIPT_PATH:-}"
IMPLEMENT_FALLBACK_COMMAND="${IMPLEMENT_FALLBACK_COMMAND:-}"

log() {
    printf "%s %s\n" "$LOG_PREFIX" "$*"
}

fail() {
    printf "%s ERROR: %s\n" "$LOG_PREFIX" "$*" >&2
    exit 1
}

require_issue_context() {
    [ -n "$ISSUE_IDENTIFIER" ] || fail "ISSUE_IDENTIFIER is required."
}

run_issue_script() {
    local script_path="$1"
    [ -f "$script_path" ] || return 1

    log "Running implementation script: ${script_path}"
    bash "$script_path"
}

main() {
    require_issue_context

    local issue_id_lc candidate_paths=()
    issue_id_lc="$(echo "$ISSUE_IDENTIFIER" | tr '[:upper:]' '[:lower:]')"

    if [ -n "$ISSUE_SCRIPT_PATH" ]; then
        candidate_paths+=("$ISSUE_SCRIPT_PATH")
    fi

    candidate_paths+=(
        "scripts/automation/issues/${ISSUE_IDENTIFIER}.sh"
        "scripts/automation/issues/${issue_id_lc}.sh"
        "scripts/automation/issues/default.sh"
    )

    for candidate in "${candidate_paths[@]}"; do
        if run_issue_script "$candidate"; then
            return 0
        fi
    done

    if [ -n "$IMPLEMENT_FALLBACK_COMMAND" ]; then
        log "Running IMPLEMENT_FALLBACK_COMMAND"
        bash -lc "$IMPLEMENT_FALLBACK_COMMAND"
        return 0
    fi

    fail "No issue implementation script found. Add scripts/automation/issues/${ISSUE_IDENTIFIER}.sh or set IMPLEMENT_FALLBACK_COMMAND."
}

main "$@"
