#!/bin/sh

# Simple launcher for Troubles Simulator
# Tries Node.js first, then Python

PORT=8080
URL="http://localhost:$PORT"

echo "Starting Troubles Simulator Server..."

open_browser() {
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$URL" >/dev/null 2>&1 &
    elif command -v open >/dev/null 2>&1; then
        open "$URL" >/dev/null 2>&1 &
    fi
}

start_and_wait() {
    SERVER_PID=$1
    echo "Server started at $URL"
    open_browser
    echo "Press Ctrl+C to stop the server."
    trap 'echo "Stopping server..."; kill $SERVER_PID 2>/dev/null; exit 0' INT TERM
    wait $SERVER_PID
}

if command -v node >/dev/null 2>&1; then
    echo "Using Node.js server..."
    node server.js &
    start_and_wait $!
    exit 0
fi

if command -v python >/dev/null 2>&1; then
    echo "Using Python server..."
    python start_server.py &
    start_and_wait $!
    exit 0
fi

if command -v python3 >/dev/null 2>&1; then
    echo "Using Python3 server..."
    python3 start_server.py &
    start_and_wait $!
    exit 0
fi

cat <<EOM
ERROR: Neither Node.js nor Python found!
Please install Node.js from https://nodejs.org/ or Python from https://python.org/
EOM
exit 1
