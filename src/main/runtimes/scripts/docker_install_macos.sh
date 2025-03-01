#!/bin/bash

# Function to prompt for password with a GUI dialog if needed
prompt_for_sudo() {
    # AppleScript to show a more user-friendly password prompt
    osascript -e 'tell application "System Events" to display dialog "The installation requires admin privileges to continue." buttons {"OK"} default button "OK" with title "Admin Privileges Required"'
    
    # Get admin privileges
    if ! sudo -n true 2>/dev/null; then
        echo "Please enter your password for admin privileges:"
        sudo -v
        # Keep-alive: update existing sudo time stamp until script has finished
        while true; do sudo -n true; sleep 60; kill -0 "$$" || exit; done 2>/dev/null &
    fi
}

echo "Checking for Homebrew installation..."
# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Homebrew not found. Installing Homebrew..."
    
    # First try the regular installation (non-sudo) in non-interactive mode
    if ! NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" </dev/null; then
        echo "Standard installation failed. Requesting admin privileges..."
        prompt_for_sudo
        
        # After getting sudo, try again with privilege in non-interactive mode
        NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" </dev/null
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

# Install Docker Desktop for Mac in non-interactive mode
echo "Installing Docker Desktop..."
NONINTERACTIVE=1 brew install --cask docker

# Open Docker to complete setup
echo "Opening Docker. Please complete the setup when prompted."
open /Applications/Docker.app 