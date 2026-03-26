#!/bin/bash
# install-morning-launchd.sh
#
# Installs a launchd agent that runs morning-prep.sh at 7:00 AM on weekdays.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PLIST_PATH="$HOME/Library/LaunchAgents/com.kateiq.morning-prep.plist"
LOG_DIR="$HOME/Library/Logs"
OUT_LOG="$LOG_DIR/com.kateiq.morning-prep.out.log"
ERR_LOG="$LOG_DIR/com.kateiq.morning-prep.err.log"

mkdir -p "$HOME/Library/LaunchAgents" "$LOG_DIR"

cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.kateiq.morning-prep</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$REPO_DIR/scripts/morning-prep.sh</string>
  </array>

  <key>WorkingDirectory</key>
  <string>$REPO_DIR</string>

  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Weekday</key><integer>1</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>2</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>3</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>4</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>5</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
  </array>

  <key>StandardOutPath</key>
  <string>$OUT_LOG</string>
  <key>StandardErrorPath</key>
  <string>$ERR_LOG</string>

  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
EOF

if launchctl list | grep -q "com.kateiq.morning-prep"; then
  launchctl unload "$PLIST_PATH" || true
fi

launchctl load "$PLIST_PATH"

echo "[schedule] Installed: $PLIST_PATH"
echo "[schedule] Logs: $OUT_LOG and $ERR_LOG"
echo "[schedule] Next weekday run: 07:00 local time"
