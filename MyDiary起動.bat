@echo off
title My Diary - 日記アプリ
echo ====================================
echo   My Diary - 日記アプリを起動しています
echo ====================================
echo.
echo 少々お待ちください...
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo 依存関係をインストール中...
    npm install
)

REM Start the server
echo サーバーを起動しています...
echo.
echo ブラウザで http://localhost:3000 が自動で開きます
echo.
echo 終了するにはこのウィンドウを閉じてください
echo ====================================
echo.

start "" "http://localhost:3000"
npm run start
