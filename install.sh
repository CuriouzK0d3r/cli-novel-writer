#!/bin/bash

# Writers CLI Installation Script
# A powerful CLI tool for writing novels with markdown support

set -e

echo "📝 Writers CLI Installation"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "Please install Node.js 14.0 or higher from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="14.0.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
    echo "❌ Node.js version $NODE_VERSION is too old."
    echo "Please upgrade to Node.js 14.0 or higher."
    exit 1
fi

echo "✅ Node.js $NODE_VERSION detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    echo "Please install npm or use the Node.js installer from https://nodejs.org/"
    exit 1
fi

echo "✅ npm detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Make the CLI executable
echo "🔧 Setting up CLI executable..."
chmod +x bin/writers.js

# Check if user wants global installation
echo "🌍 Global Installation"
echo "Do you want to install Writers CLI globally? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Installing globally..."
    npm link

    if [ $? -eq 0 ]; then
        echo "✅ Writers CLI installed globally!"
        echo "You can now use 'writers' command from anywhere."
    else
        echo "⚠️  Global installation failed. You can still use:"
        echo "   node bin/writers.js <command>"
    fi
else
    echo "✅ Local installation complete!"
    echo "Use: node bin/writers.js <command>"
fi

echo ""
echo "🚀 Installation Complete!"
echo ""
echo "📖 Quick Start:"
echo "1. Create a new directory for your novel"
echo "2. Run: writers init (or node bin/writers.js init)"
echo "3. Start writing: writers new chapter \"Chapter 1\""
echo ""
echo "📚 Documentation:"
echo "- Run 'writers --help' for command overview"
echo "- Check README.md for detailed documentation"
echo "- Visit the project repository for examples"
echo ""
echo "🎉 Happy writing!"
