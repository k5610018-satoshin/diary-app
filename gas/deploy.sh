#!/bin/bash
# ============================================
# ふりかえり日記 GAS 自動デプロイスクリプト
# ============================================
# 使い方: cd gas && bash deploy.sh
# 前提: Node.js がインストール済みであること
# ============================================

set -e

echo "============================================"
echo "  ふりかえり日記 GAS デプロイツール"
echo "============================================"
echo ""

# --- Step 1: clasp インストール確認 ---
if ! command -v clasp &> /dev/null; then
    echo "[1/5] clasp をインストール中..."
    npm install -g @google/clasp
else
    echo "[1/5] clasp 確認OK ($(clasp --version))"
fi

# --- Step 2: ログイン ---
echo ""
echo "[2/5] Google アカウント認証"
echo "  ブラウザが開きます。Googleアカウントでログインしてください。"
echo ""

# ログイン済みかチェック
if [ -f ~/.clasprc.json ]; then
    echo "  既にログイン済みのようです。再ログインしますか？"
    read -p "  (y/N): " RELOGIN
    if [ "$RELOGIN" = "y" ] || [ "$RELOGIN" = "Y" ]; then
        clasp login
    fi
else
    clasp login
fi

# --- Step 3: プロジェクト作成 ---
echo ""
echo "[3/5] Apps Script プロジェクト作成"

if grep -q '"scriptId"' .clasp.json 2>/dev/null; then
    EXISTING_ID=$(grep '"scriptId"' .clasp.json | sed 's/.*: *"\(.*\)".*/\1/')
    if [ -n "$EXISTING_ID" ] && [ "$EXISTING_ID" != "." ]; then
        echo "  既存のプロジェクトが見つかりました: $EXISTING_ID"
        read -p "  新規作成しますか？ (y/N): " CREATE_NEW
        if [ "$CREATE_NEW" != "y" ] && [ "$CREATE_NEW" != "Y" ]; then
            echo "  既存プロジェクトを使用します。"
            SKIP_CREATE=true
        fi
    fi
fi

if [ "$SKIP_CREATE" != "true" ]; then
    echo "  デプロイ方式を選択してください:"
    echo "    1) スタンドアロン（推奨 - 新規スクリプトを作成）"
    echo "    2) スプレッドシート連携（既存のスプレッドシートに紐付け）"
    read -p "  選択 (1/2): " DEPLOY_TYPE

    if [ "$DEPLOY_TYPE" = "2" ]; then
        read -p "  スプレッドシートのIDを入力: " SHEET_ID
        clasp create --type sheets --parentId "$SHEET_ID" --title "ふりかえり日記" --rootDir .
    else
        clasp create --type webapp --title "ふりかえり日記" --rootDir .
    fi
    echo "  プロジェクト作成完了！"
fi

# --- Step 4: ファイルをプッシュ ---
echo ""
echo "[4/5] ファイルをアップロード中..."
clasp push --force
echo "  アップロード完了！"

# --- Step 5: デプロイ ---
echo ""
echo "[5/5] Web アプリとしてデプロイ中..."
DEPLOY_OUTPUT=$(clasp deploy --description "ふりかえり日記 v1 - 自動デプロイ" 2>&1)
echo "$DEPLOY_OUTPUT"

# デプロイIDを抽出
DEPLOY_ID=$(echo "$DEPLOY_OUTPUT" | grep -oP '(?<=- )AKfycb[a-zA-Z0-9_-]+' | head -1)

echo ""
echo "============================================"
echo "  デプロイ完了！"
echo "============================================"
echo ""

# スクリプトIDを取得
SCRIPT_ID=$(grep '"scriptId"' .clasp.json | sed 's/.*: *"\(.*\)".*/\1/')

if [ -n "$SCRIPT_ID" ]; then
    WEB_URL="https://script.google.com/macros/s/${DEPLOY_ID}/exec"
    echo "  Apps Script エディタ:"
    echo "    https://script.google.com/d/${SCRIPT_ID}/edit"
    echo ""
    if [ -n "$DEPLOY_ID" ]; then
        echo "  Web アプリ URL:"
        echo "    児童用: ${WEB_URL}?page=student"
        echo "    教師用: ${WEB_URL}?page=teacher"
    else
        echo "  ※ Web アプリURLはApps Scriptエディタの"
        echo "    「デプロイ」→「デプロイを管理」から確認できます。"
    fi
fi

echo ""
echo "============================================"
echo "  初期セットアップ"
echo "============================================"
echo ""
echo "  1. 上記エディタURLを開く"
echo "  2. 関数セレクタで 'setupSpreadsheet' を選択"
echo "  3. 「実行」をクリック（初回は権限承認が必要）"
echo "  4. スプレッドシートの「設定」シートにAPIキーを入力"
echo ""
echo "  教師ログインパスワード（初期値）: teacher2024"
echo ""
