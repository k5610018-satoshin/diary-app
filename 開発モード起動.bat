@echo off
title My Diary - 開発モード
echo ====================================
echo   My Diary - 開発サーバーを起動しています
echo ====================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo 依存関係をインストール中...
    npm install
)

echo ブラウザで http://localhost:3000 が自動で開きます
echo 終了するにはこのウィンドウを閉じてください
echo ====================================
echo.

start "" "http://localhost:3000"
npm run dev
