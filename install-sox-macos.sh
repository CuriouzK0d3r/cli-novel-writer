#!/usr/bin/env bash
#
# writers-cli/install-sox-macos.sh
#
# Install SoX (Sound eXchange) on macOS for voice recording functionality.
# SoX is required by node-record-lpcm16 for audio recording capabilities.
#
# Usage:
#   bash install-sox-macos.sh        # interactive
#   bash install-sox-macos.sh --yes  # non-interactive (assume Yes)
#
# This script will:
# - Check if running on macOS
# - Install Homebrew if not present (with user permission)
# - Install SoX via Homebrew
# - Verify SoX installation
# - Test basic SoX functionality
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
Usage: install-sox-macos.sh [options]

Install SoX (Sound eXchange) for voice recording functionality.

Options:
  -y, --yes, --non-interactive   Assume "yes" to prompts (automated install)
  -h, --help                     Show this help and exit

About SoX:
  SoX is a cross-platform command line utility that can convert various
  formats of computer audio files into other formats. It's required by
  the Writers CLI voice recording system.
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
success() { printf "\033[1;32m[SUCCESS]\033[0m %s\n" "$*"; }

# 1) Ensure we're on macOS
if [[ "$(uname -s)" != "Darwin" ]]; then
  err "This installer is for macOS only. Detected: $(uname -s)"
  err "For other platforms:"
  err "  • Ubuntu/Debian: sudo apt install sox"
  err "  • CentOS/RHEL: sudo yum install sox"
  err "  • Windows: Download from http://sox.sourceforge.net/"
  exit 2
fi

info "Detected macOS ($(sw_vers -productVersion))"

# 2) Check if SoX is already installed
if command -v sox >/dev/null 2>&1; then
  SOX_VERSION=$(sox --version 2>/dev/null | head -n 1 || echo "unknown version")
  success "SoX is already installed: ${SOX_VERSION}"
  info "Testing SoX functionality..."

  # Test SoX with a simple command
  if sox --help >/dev/null 2>&1; then
    success "SoX is working correctly!"
    info "You can now use voice recording in Writers CLI."
    info "Try: ./bin/writers.js voice record test.md"
    exit 0
  else
    warn "SoX is installed but may not be working properly."
    warn "Continuing with installation to fix potential issues..."
  fi
fi

# 3) Locate brew if present
BREW_BIN=""
if command -v brew >/dev/null 2>&1; then
  BREW_BIN="$(command -v brew)"
  info "Homebrew found: ${BREW_BIN}"
fi

# Try common Homebrew locations if not in PATH
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

# 4) Install Homebrew if missing
if [[ -z "${BREW_BIN}" ]]; then
  warn "Homebrew not found. SoX installation requires Homebrew."

  if [[ "${AUTO_YES}" -eq 1 ]]; then
    user_choice="y"
  else
    printf "\nInstall Homebrew now? This is required for SoX installation. [Y/n]: "
    read -r user_choice || user_choice="n"
  fi

  user_choice="$(echo "${user_choice}" | tr '[:upper:]' '[:lower:]' | awk '{print $1}')"
  if [[ -z "${user_choice}" || "${user_choice}" == "y" || "${user_choice}" == "yes" ]]; then
    info "Installing Homebrew (this may take several minutes)..."

    # Run the official Homebrew installer
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # After installation, attempt to discover brew location
    if probe_brew_locations; then
      info "Found Homebrew at ${BREW_BIN}"
      # Add the brew path to PATH for this script session
      export PATH="$(dirname "$BREW_BIN"):$PATH"
    else
      err "Homebrew installed but not found in expected locations."
      err "Please add Homebrew to your PATH and re-run this script."
      err "Common locations: /opt/homebrew/bin or /usr/local/bin"
      exit 3
    fi
  else
    err "Homebrew is required to install SoX. Installation cancelled."
    err "To install manually:"
    err "1. Install Homebrew: https://brew.sh"
    err "2. Run: brew install sox"
    exit 4
  fi
fi

# Ensure brew command is available
if ! command -v brew >/dev/null 2>&1; then
  # Try the detected BREW_BIN
  if [[ -n "${BREW_BIN}" && -x "${BREW_BIN}" ]]; then
    export PATH="$(dirname "${BREW_BIN}"):$PATH"
  fi
fi

if ! command -v brew >/dev/null 2>&1; then
  err "Homebrew still not available in PATH after installation."
  err "Please open a new terminal or add Homebrew to your PATH:"
  err "  export PATH=\"/opt/homebrew/bin:\$PATH\"  # Apple Silicon Macs"
  err "  export PATH=\"/usr/local/bin:\$PATH\"     # Intel Macs"
  err "Then re-run this script."
  exit 5
fi

# 5) Update Homebrew
info "Updating Homebrew..."
brew update || warn "brew update failed or returned non-zero exit code - continuing."

# 6) Install SoX
info "Installing SoX via Homebrew..."

if brew list sox >/dev/null 2>&1; then
  info "SoX already installed via Homebrew. Attempting to upgrade..."
  brew upgrade sox || warn "SoX upgrade failed or is no-op - continuing."
else
  info "Installing SoX for the first time..."
  brew install sox
fi

# 7) Verify SoX installation
info "Verifying SoX installation..."

if command -v sox >/dev/null 2>&1; then
  SOX_VERSION=$(sox --version 2>/dev/null | head -n 1 || echo "version unknown")
  success "SoX installed successfully: ${SOX_VERSION}"

  # Test basic SoX functionality
  info "Testing SoX functionality..."
  if sox --help >/dev/null 2>&1; then
    success "SoX is working correctly!"
  else
    warn "SoX installed but help command failed - may still work for recording"
  fi

  # Show SoX capabilities
  info "SoX audio format support:"
  sox --help-format all 2>/dev/null | head -10 || info "Could not retrieve format list"

  success "Installation complete!"
  info ""
  info "🎙️ Voice recording is now available in Writers CLI!"
  info ""
  info "Try these commands:"
  info "  ./bin/writers.js voice check          # Verify system is ready"
  info "  ./bin/writers.js voice record test.md # Record a voice note"
  info "  node voice-quickstart.js             # Interactive demo"
  info ""

else
  err "SoX installation appeared to succeed but 'sox' command not found."
  err "Please check your PATH or try installing manually:"
  err "  brew install sox"
  exit 6
fi

# 8) Optional: Add to shell profile for persistence
if [[ "${AUTO_YES}" -eq 0 ]]; then
  printf "\nAdd Homebrew to your shell profile for permanent PATH setup? [y/N]: "
  read -r add_to_profile || add_to_profile="n"

  add_to_profile="$(echo "${add_to_profile}" | tr '[:upper:]' '[:lower:]')"
  if [[ "${add_to_profile}" == "y" || "${add_to_profile}" == "yes" ]]; then

    # Detect shell and profile file
    if [[ -n "${ZSH_VERSION:-}" ]] || [[ "${SHELL}" == *"zsh"* ]]; then
      PROFILE_FILE="$HOME/.zshrc"
      SHELL_NAME="zsh"
    elif [[ -n "${BASH_VERSION:-}" ]] || [[ "${SHELL}" == *"bash"* ]]; then
      PROFILE_FILE="$HOME/.bash_profile"
      SHELL_NAME="bash"
    else
      PROFILE_FILE="$HOME/.profile"
      SHELL_NAME="generic"
    fi

    # Determine Homebrew path based on architecture
    if [[ "$(uname -m)" == "arm64" ]]; then
      HOMEBREW_PATH="/opt/homebrew/bin"
    else
      HOMEBREW_PATH="/usr/local/bin"
    fi

    # Add to profile if not already present
    EXPORT_LINE="export PATH=\"${HOMEBREW_PATH}:\$PATH\""

    if [[ -f "${PROFILE_FILE}" ]] && grep -q "${HOMEBREW_PATH}" "${PROFILE_FILE}"; then
      info "Homebrew PATH already in ${PROFILE_FILE}"
    else
      echo "" >> "${PROFILE_FILE}"
      echo "# Added by Writers CLI sox installer" >> "${PROFILE_FILE}"
      echo "${EXPORT_LINE}" >> "${PROFILE_FILE}"
      success "Added Homebrew to ${PROFILE_FILE}"
      info "Restart your terminal or run: source ${PROFILE_FILE}"
    fi
  fi
fi

success "SoX installation completed successfully! 🎵"
