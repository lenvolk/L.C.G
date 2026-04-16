#!/usr/bin/env bash
# bootstrap.sh — cross-platform entry point for first-time setup.
#
# This is the ONLY shell script in the project. Its single job is to
# ensure Node.js (>=18) is installed, then hand off to scripts/bootstrap.js
# which does the real work. All other automation lives in Node.js modules
# under scripts/.
#
# Usage:
#   ./scripts/bootstrap.sh            # full bootstrap
#   ./scripts/bootstrap.sh --check    # verify prereqs only
#   ./scripts/bootstrap.sh --skip-install

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIN_NODE_MAJOR=18

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; CYAN='\033[0;36m'; RESET='\033[0m'
say()  { printf "%b\n" "$*"; }
ok()   { say "  ${GREEN}✔${RESET} $*"; }
warn() { say "  ${YELLOW}⚠${RESET} $*"; }
fail() { say "  ${RED}✖${RESET} $*"; }
info() { say "  ${CYAN}→${RESET} $*"; }

# ── Detect node ────────────────────────────────────────────────────
node_ok() {
  command -v node >/dev/null 2>&1 || return 1
  local v; v="$(node -v 2>/dev/null | sed 's/^v//')"
  local major="${v%%.*}"
  [ -n "$major" ] && [ "$major" -ge "$MIN_NODE_MAJOR" ]
}

install_node_macos() {
  if command -v brew >/dev/null 2>&1; then
    info "Installing Node via Homebrew…"
    brew install node
  else
    fail "Homebrew not found."
    info "Install Homebrew: https://brew.sh  — then re-run this script."
    info "Or install Node directly: https://nodejs.org"
    return 1
  fi
}

install_node_linux() {
  if command -v apt-get >/dev/null 2>&1; then
    info "Installing Node via apt (NodeSource LTS)…"
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command -v dnf >/dev/null 2>&1; then
    info "Installing Node via dnf…"
    sudo dnf install -y nodejs
  elif command -v yum >/dev/null 2>&1; then
    info "Installing Node via yum…"
    sudo yum install -y nodejs
  elif command -v pacman >/dev/null 2>&1; then
    info "Installing Node via pacman…"
    sudo pacman -S --noconfirm nodejs npm
  else
    fail "No supported package manager found (apt/dnf/yum/pacman)."
    info "Install Node manually: https://nodejs.org  (or use nvm)"
    return 1
  fi
}

ensure_node() {
  if node_ok; then
    ok "Node.js $(node -v) detected"
    return 0
  fi

  warn "Node.js >= ${MIN_NODE_MAJOR} not found."

  local uname_s; uname_s="$(uname -s)"
  case "$uname_s" in
    Darwin)  install_node_macos ;;
    Linux)   install_node_linux ;;
    *)
      fail "Unsupported OS: $uname_s"
      info "Install Node >= ${MIN_NODE_MAJOR} manually: https://nodejs.org"
      return 1
      ;;
  esac

  if ! node_ok; then
    fail "Node installation did not succeed or version still too old."
    return 1
  fi
  ok "Node.js $(node -v) installed"
}

# ── Run ────────────────────────────────────────────────────────────
say "${CYAN}━━━ Ensuring Node.js ≥ ${MIN_NODE_MAJOR} ━━━${RESET}"
ensure_node || exit 1

say "${CYAN}━━━ Handing off to scripts/bootstrap.js ━━━${RESET}"
exec node "$ROOT/scripts/bootstrap.js" "$@"
