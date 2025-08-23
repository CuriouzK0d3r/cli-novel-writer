#!/usr/bin/env bash
#
# writers-cli/install-ffmpeg-macos.sh
#
# Simple helper script to install FFmpeg on macOS using Homebrew.
# - Detects macOS
# - Checks for Homebrew and offers to install it (unless --yes is passed)
# - Installs/updates Homebrew and installs FFmpeg
# - Verifies installation (runs `ffmpeg -version`)
#
# Usage:
#   bash install-ffmpeg-macos.sh        # interactive
#   bash install-ffmpeg-macos.sh --yes  # non-interactive (assume Yes)
#
# NOTE:
# - This script runs commands that may require network access and user privileges.
# - Installing Homebrew will run the official Homebrew install script if chosen.
# - Homebrew's install location differs on Apple Silicon vs Intel Macs:
#     - Apple Silicon: /opt/homebrew
#     - Intel: /usr/local
#
set -euo pipefail

# Defaults
AUTO_YES=0

for arg in "$@"; do
  case "$arg" in
    -y|--yes|--non-interactive)
      AUTO_YES=1
      shift
      ;;
    -h|--help)
      cat <<'EOF'
Usage: install-ffmpeg-macos.sh [options]

Options:
  -y, --yes, --non-interactive   Assume "yes" to prompts (automated install)
  -h, --help                     Show this help and exit
EOF
      exit 0
      ;;
    *)
      # ignore unknown args for forward compatibility
      ;;
  esac
done

info() { printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[WARN]\033[0m %s\n" "$*"; }
err()  { printf "\033[1;31m[ERROR]\033[0m %s\n" "$*"; }

# 1) Ensure we're on macOS
if [[ "$(uname -s)" != "Darwin" ]]; then
  err "This installer is for macOS only. Detected: $(uname -s)"
  exit 2
fi

info "Detected macOS."

# 2) Locate brew if present
BREW_BIN=""
if command -v brew >/dev/null 2>&1; then
  BREW_BIN="$(command -v brew)"
  info "Homebrew already installed: ${BREW_BIN}"
fi

# Try common Homebrew locations if not in PATH (useful right after Homebrew install)
probe_brew_locations() {
  local candidates=( "/opt/homebrew/bin/brew" "/usr/local/bin/brew" "/home/linuxbrew/.linuxbrew/bin/brew" )
  for c in "${candidates[@]}"; do
    if [[ -x "$c" ]]; then
      BREW_BIN="$c"
      return 0
    fi
  done
  return 1
}

if [[ -z "${BREW_BIN}" ]]; then
  probe_brew_locations || true
fi

# 3) Offer to install Homebrew if missing
if [[ -z "${BREW_BIN}" ]]; then
  warn "Homebrew not found on this system."
  if [[ "${AUTO_YES}" -eq 1 ]]; then
    user_choice="y"
  else
    printf "\nHomebrew is required to install FFmpeg. Install Homebrew now? [Y/n]: "
    read -r user_choice || user_choice="n"
  fi

  user_choice="$(echo "${user_choice}" | tr '[:upper:]' '[:lower:]' | awk '{print $1}')"
  if [[ -z "${user_choice}" || "${user_choice}" == "y" || "${user_choice}" == "yes" ]]; then
    info "Installing Homebrew (official installer)..."
    # Run the official Homebrew installer
    # This will prompt for the user's password if necessary and may ask for interactive confirmation.
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # After installation, attempt to discover brew location and add to PATH for this script
    if probe_brew_locations; then
      info "Found Homebrew at ${BREW_BIN}"
      # Add the brew path to PATH for this script session
      export PATH="$(dirname "$BREW_BIN"):$PATH"
    else
      err "Homebrew installed but not found in expected locations. Please ensure Homebrew is on your PATH and re-run this script."
      exit 3
    fi
  else
    err "Homebrew is required to proceed. Aborting."
    exit 4
  fi
fi

# Final check: ensure brew is executable
if ! command -v brew >/dev/null 2>&1; then
  # Try the detected BREW_BIN
  if [[ -n "${BREW_BIN}" && -x "${BREW_BIN}" ]]; then
    export PATH="$(dirname "${BREW_BIN}"):$PATH"
  fi
fi

if ! command -v brew >/dev/null 2>&1; then
  err "Homebrew still not available in PATH. Please open a new terminal or add Homebrew to your PATH, then re-run this script."
  err "Common locations: /opt/homebrew/bin or /usr/local/bin"
  exit 5
fi

# 4) Update Homebrew and install FFmpeg
info "Updating Homebrew..."
brew update || warn "brew update returned a non-zero exit code — continuing."

# Note: Homebrew's ffmpeg formula provides a reasonably featured build by default.
# If you need custom codecs/options, install them via brew taps/formulae or compile manually.
info "Installing FFmpeg via Homebrew..."
if brew list ffmpeg >/dev/null 2>&1; then
  info "FFmpeg already installed via Homebrew. Attempting to upgrade to the latest version..."
  brew upgrade ffmpeg || warn "brew upgrade ffmpeg failed or is no-op."
else
  brew install ffmpeg
fi

# 5) Verify installation
info "Verifying FFmpeg installation..."
if command -v ffmpeg >/dev/null 2>&1; then
  ffmpeg -version | head -n 1
  info "FFmpeg installation successful."
  info "You can now transcribe non-WAV audio files (WebM, MP3, M4A, FLAC, OGG) with the Writers CLI."
  exit 0
else
  err "FFmpeg not found after installation. Please check Homebrew logs and try installing manually."
  err "You can also install FFmpeg from https://ffmpeg.org/download.html and ensure 'ffmpeg' is on your PATH."
  exit 6
fi
