@echo off
echo Compiling TypeScript files...
npx tsc
if %errorlevel% neq 0 (
    echo TypeScript compilation failed. Exiting...
    exit /b %errorlevel%
)
echo TypeScript compilation successful. Starting the bot...
node dist/index.js
pause
