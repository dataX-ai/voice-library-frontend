#!/bin/bash

# Refresh environment variables
# macOS typically uses /etc/profile and /etc/zprofile
if [ -f "/etc/profile" ]; then
    source /etc/profile
fi

CURRENT_SHELL=$(basename "$SHELL")

if [ "$CURRENT_SHELL" = "zsh" ]; then
    # Source zsh profiles without executing zsh-specific code
    if [ -f "$HOME/.zprofile" ]; then
        # Use grep to filter out zsh-specific syntax
        grep -v "^\s*\(\|\)\|setopt\|typeset\|autoload\|zstyle\|compdef" "$HOME/.zprofile" | source /dev/stdin
    fi
else
    # Source bash profiles
    if [ -f "$HOME/.bash_profile" ]; then
        source "$HOME/.bash_profile"
    elif [ -f "$HOME/.profile" ]; then
        source "$HOME/.profile"
    fi
fi

# Debug: Try to find docker
DOCKER_PATH=$(command -v docker)

# Check if docker command is available
if [ -z "$DOCKER_PATH" ]; then
    echo "NOT INSTALLED"
    exit 0
fi

if ! docker info &> /dev/null; then
    # On macOS, we can't use systemctl. Docker.app needs to be started manually
    echo "NOT RUNNING"
else
    echo "RUNNING"
fi
