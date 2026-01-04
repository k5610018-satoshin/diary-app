@echo off
title My Diary - デスクトップアプリ
echo ====================================
echo   My Diary - Electronアプリを起動中
echo ====================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo 依存関係をインストール中...
    npm install
)

echo Electronアプリを起動しています...
echo 終了するにはアプリを閉じてください
echo ====================================

npm run electron:dev
