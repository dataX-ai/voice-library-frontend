#!/bin/bash

# Flag to indicate if we're running with sudo privileges
WITH_SUDO=false

# Check for the --with-sudo flag
if [[ "$1" == "--with-sudo" ]]; then
    WITH_SUDO=true
fi

echo "Checking for Homebrew installation..."
# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Homebrew not found. Installing Homebrew..."
    
    if $WITH_SUDO; then
        # We're already running with sudo privileges from AppleScript
        # Just install homebrew directly (which doesn't want sudo)
        NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" </dev/null
    else
        # First try the regular installation (non-sudo) in non-interactive mode
        if ! NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" </dev/null; then
            echo "Standard installation failed."
            exit 1
        fi
    fi
    
    # Add Homebrew to PATH if needed
    if [[ $(uname -m) == "arm64" ]]; then
        # For Apple Silicon Macs
        echo "Adding Homebrew to PATH for Apple Silicon Mac..."
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        # For Intel Macs
        echo "Adding Homebrew to PATH for Intel Mac..."
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/usr/local/bin/brew shellenv)"
    fi
else
    echo "Homebrew is already installed."
fi

# Fix: Need to ensure brew is in PATH for this script session
# Source the profile to make brew available in this script
if [[ $(uname -m) == "arm64" ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null
else
    eval "$(/usr/local/bin/brew shellenv)" 2>/dev/null
fi

# Install Docker Desktop for Mac in non-interactive mode
echo "Installing Docker Desktop..."
NONINTERACTIVE=1 brew install --cask docker

# Open Docker to complete setup
echo "Opening Docker. Please complete the setup when prompted."
open /Applications/Docker.app 