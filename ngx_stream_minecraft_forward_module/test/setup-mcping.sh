#!/bin/bash

# Github Action:
# https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/accessing-contextual-information-about-workflow-runs
# RUNNER_OS: Linux, Windows, macOS
# RUNNER_ARCH: X86, X64, ARM, ARM64

# Environment variables:
# WORKING_DIR

var_os=""
var_arch=""

case "$RUNNER_OS" in
  Linux)
    var_os="linux"
    ;;
  Windows)
    var_os="windows"
    ;;
  macOS)
    var_os="darwin"
    ;;
esac

case "$RUNNER_ARCH" in
  X64)
    var_arch="amd64"
    ;;
  ARM64)
    var_arch="arm64"
    ;;
  *)
    echo "NOT SUPPORTED: $RUNNER_ARCH"
    exit 1
    ;;
esac

wget --no-verbose -O "$WORKING_DIR/mcping" "https://github.com/NetherRealmSpigot/mcping/releases/download/v0.0.1/mcping-0.0.1-$var_os-$var_arch"
chmod +x "$WORKING_DIR/mcping"
