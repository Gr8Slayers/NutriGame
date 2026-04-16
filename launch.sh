#!/bin/bash

BACKEND_PATH="backend"
FRONTEND_PATH="frontend"

# Kill existing processes on ports
fuser -k 3000/tcp 2>/dev/null
fuser -k 8081/tcp 2>/dev/null

echo "Starting NutriGame Backend..."
gnome-terminal --title="NutriGame Backend" -- bash -c "cd $BACKEND_PATH && npm run dev; exec bash" 2>/dev/null \
  || xterm -title "NutriGame Backend" -e "cd $BACKEND_PATH && npm run dev; exec bash" 2>/dev/null \
  || bash -c "cd $BACKEND_PATH && npm run dev" &

sleep 2

echo "Starting NutriGame Frontend..."
gnome-terminal --title="NutriGame Frontend" -- bash -c "cd $FRONTEND_PATH && npx expo start -c; exec bash" 2>/dev/null \
  || xterm -title "NutriGame Frontend" -e "cd $FRONTEND_PATH && npx expo start -c; exec bash" 2>/dev/null \
  || bash -c "cd $FRONTEND_PATH && npx expo start -c" &

echo "NutriGame started!"
