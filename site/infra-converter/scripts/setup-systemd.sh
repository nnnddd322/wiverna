#!/bin/bash
set -e

echo "=========================================="
echo "Setting up systemd service"
echo "=========================================="
echo ""

if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

# Get the absolute path to the server directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/../server" && pwd)"

# Get current user (the one who ran sudo)
ACTUAL_USER="${SUDO_USER:-$USER}"

echo "Server directory: $SERVER_DIR"
echo "Running as user: $ACTUAL_USER"
echo ""

# Create systemd service file
cat > /etc/systemd/system/converter.service << EOF
[Unit]
Description=Presentation Converter Service
After=network.target

[Service]
Type=simple
User=$ACTUAL_USER
WorkingDirectory=$SERVER_DIR
ExecStart=/usr/bin/node $SERVER_DIR/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=converter

# Environment
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

echo "✓ Service file created at /etc/systemd/system/converter.service"
echo ""

# Reload systemd
systemctl daemon-reload
echo "✓ Systemd reloaded"
echo ""

# Enable service
systemctl enable converter.service
echo "✓ Service enabled (will start on boot)"
echo ""

echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "To manage the service:"
echo "  sudo systemctl start converter    # Start the service"
echo "  sudo systemctl stop converter     # Stop the service"
echo "  sudo systemctl restart converter  # Restart the service"
echo "  sudo systemctl status converter   # Check status"
echo "  sudo journalctl -u converter -f   # View logs"
echo ""
