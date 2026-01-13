#!/bin/bash
set -e

echo "=========================================="
echo "Presentation Converter - Installation"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

echo "Step 1/5: Updating system packages..."
apt-get update -y

echo ""
echo "Step 2/5: Installing Node.js 18..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
else
  echo "Node.js already installed: $(node --version)"
fi

echo ""
echo "Step 3/5: Installing LibreOffice..."
if ! command -v libreoffice &> /dev/null; then
  apt-get install -y libreoffice libreoffice-writer libreoffice-impress
else
  echo "LibreOffice already installed"
fi

echo ""
echo "Step 4/5: Installing poppler-utils (pdftoppm)..."
if ! command -v pdftoppm &> /dev/null; then
  apt-get install -y poppler-utils
else
  echo "poppler-utils already installed"
fi

echo ""
echo "Step 5/5: Installing fonts..."
apt-get install -y fonts-dejavu fonts-liberation ttf-mscorefonts-installer

echo ""
echo "=========================================="
echo "System dependencies installed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. cd /path/to/infra-converter/server"
echo "2. npm install"
echo "3. cp .env.example .env"
echo "4. Edit .env with your Supabase credentials"
echo "5. npm start"
echo ""
