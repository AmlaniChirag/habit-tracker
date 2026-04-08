#!/bin/bash
#
# Habit Tracker launcher
# Double-click this file to start the app and open it in your browser.
# Press Ctrl+C in this window to stop the server.
#

# === EDIT THIS LINE if your project is somewhere else ===
PROJECT_DIR="$HOME/habit-tracker"
# =========================================================

set -e

cd "$PROJECT_DIR" || {
  echo "Could not find project folder: $PROJECT_DIR"
  echo "Edit this file and update PROJECT_DIR to point to your habit-tracker folder."
  echo
  read -n 1 -s -r -p "Press any key to close..."
  exit 1
}

# Make sure we're on the feature branch
if command -v git >/dev/null 2>&1; then
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [ "$CURRENT_BRANCH" != "claude/habit-tracker-app-BnWwz" ]; then
    echo "Switching to branch claude/habit-tracker-app-BnWwz..."
    git checkout claude/habit-tracker-app-BnWwz
  fi
fi

# First-run install
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies (first time only, ~15s)..."
  npm install
fi

# Open the browser after the server has had a moment to boot.
URL="http://localhost:5173"
(
  sleep 2
  if command -v open >/dev/null 2>&1; then
    open "$URL"            # macOS
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL"        # Linux
  fi
) &

echo
echo "Starting Habit Tracker at $URL"
echo "Press Ctrl+C to stop."
echo

npm run dev
