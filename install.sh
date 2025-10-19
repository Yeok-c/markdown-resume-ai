#!/bin/bash

# Resume AI - Installation Script
# This script sets up the entire Resume AI system

set -e

echo "🚀 Starting Resume AI Installation..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed${NC}"
    echo "Please install pnpm first: npm install -g pnpm"
    exit 1
fi

echo -e "${GREEN}✓ pnpm found${NC}"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
pnpm install
echo -e "${GREEN}✓ Root dependencies installed${NC}"
echo ""

# Build all packages
echo "🔨 Building packages..."
pnpm build:pkg
echo -e "${GREEN}✓ Packages built${NC}"
echo ""

# Setup API server
echo "⚙️  Setting up API server..."
cd api-server

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Created .env file - please add your API keys!${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

pnpm install
echo -e "${GREEN}✓ API server dependencies installed${NC}"
cd ..
echo ""

# Setup Chrome extension
echo "🔧 Setting up Chrome extension..."
cd chrome-extension

if [ ! -f package.json ]; then
    npm init -y
fi

npm install
npm run build || echo -e "${YELLOW}⚠️  Chrome extension TypeScript build failed - you may need to install @types/chrome${NC}"
cd ..
echo -e "${GREEN}✓ Chrome extension setup complete${NC}"
echo ""

# Create resources directory if it doesn't exist
if [ ! -d "resources" ]; then
    echo -e "${YELLOW}⚠️  Resources directory not found (should have been created by setup)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Configure your API keys:"
echo "   cd api-server && edit .env"
echo ""
echo "2. Start the API server:"
echo "   cd api-server && pnpm dev"
echo ""
echo "3. (Optional) Start the frontend:"
echo "   pnpm dev"
echo ""
echo "4. Install Chrome extension:"
echo "   - Open Chrome -> chrome://extensions/"
echo "   - Enable 'Developer mode'"
echo "   - Click 'Load unpacked'"
echo "   - Select: chrome-extension/dist"
echo ""
echo "5. Read the documentation:"
echo "   - QUICK_START.md"
echo "   - PROJECT_README.md"
echo ""
echo -e "${GREEN}Happy resume building! 🎉${NC}"
