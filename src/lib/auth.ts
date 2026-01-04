import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { UserRole } from "@/types/diary";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Google認証が成功した場合
      if (account?.provider === "google") {
        return true;
      }
      return true;
    },
    async session({ session, token }) {
      // セッションにユーザー情報を追加
      if (session.user && token) {
        session.user.id = token.sub || token.id || "";
        session.user.role = (token.role as UserRole) || "student";
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      // 初回ログイン時にユーザー情報をトークンに保存
      if (account && user) {
        token.id = user.id || token.sub || "";
        // デフォルトでstudentロールを設定（後で変更可能）
        token.role = (user.role as UserRole) || "student";
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

