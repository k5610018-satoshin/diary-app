# Google認証の設定方法

このアプリにGoogle認証機能を追加しました。以下の手順で設定してください。

## 1. Google Cloud ConsoleでOAuth認証情報を作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuth クライアント ID」を選択
5. アプリケーションの種類で「ウェブアプリケーション」を選択
6. 承認済みのリダイレクト URIに以下を追加：
   - 開発環境: `http://localhost:3000/api/auth/callback/google`
   - 本番環境: `https://your-domain.com/api/auth/callback/google`
7. クライアントIDとクライアントシークレットをコピー

## 2. 環境変数の設定

プロジェクトのルートディレクトリに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
# NextAuth設定
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth設定
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### NEXTAUTH_SECRETの生成方法

以下のコマンドでランダムなシークレットキーを生成できます：

```bash
openssl rand -base64 32
```

または、以下のサイトを使用：
- https://generate-secret.vercel.app/32

## 3. 使用方法

1. ログインページで「Googleでログイン」ボタンをクリック
2. Googleアカウントでログイン
3. 初回ログイン時は自動的に「student」ロールが割り当てられます

## 注意事項

- Google認証とローカル認証（名前入力）の両方が使用可能です
- Google認証でログインしたユーザーは、デフォルトで「student」ロールが割り当てられます
- 教師ロールが必要な場合は、管理者が手動で変更する必要があります（今後実装予定）

