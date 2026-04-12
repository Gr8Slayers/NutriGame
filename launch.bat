@echo off

title NutriGame Runner

SET "BACKEND_PATH=backend" 
SET "FRONTEND_PATH=frontend" 

start cmd /k "cd /d %BACKEND_PATH% && npm run dev"

start cmd /k "cd /d %FRONTEND_PATH% && npx expo start -c"

