"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BookOpen, Smile, Users, Lock, AlertCircle, UserPlus } from "lucide-react";
import { getRegisteredUsers, findRegisteredUserByName, verifyUserPassword, registerUser } from "@/lib/localStorage";

const REMEMBERED_NAMES_KEY = "diary-app-remembered-names";
const MAX_REMEMBERED_NAMES = 10;

// 記憶された名前を取得
function getRememberedNames(): string[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(REMEMBERED_NAMES_KEY);
  return data ? JSON.parse(data) : [];
}

// 名前を記憶に追加
function addRememberedName(name: string): void {
  if (typeof window === "undefined") return;
  const names = getRememberedNames();
  const filtered = names.filter((n) => n !== name);
  const updated = [name, ...filtered].slice(0, MAX_REMEMBERED_NAMES);
  localStorage.setItem(REMEMBERED_NAMES_KEY, JSON.stringify(updated));
}

// 登録済みの名前かどうかを確認
function isRegisteredName(name: string): boolean {
  const users = getRegisteredUsers();
  return users.some((u) => u.name === name);
}

export function LoginForm() {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberedNames, setRememberedNames] = useState<string[]>([]);
  const [showNameList, setShowNameList] = useState(true);
  const [mode, setMode] = useState<"select" | "login" | "register">("select");
  const [passwordError, setPasswordError] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);

  useEffect(() => {
    setRememberedNames(getRememberedNames());
  }, []);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const trimmedName = name.trim();

    // 既存ユーザーかどうか確認
    if (isRegisteredName(trimmedName)) {
      setIsExistingUser(true);
      setMode("login");
    } else {
      setIsExistingUser(false);
      setMode("register");
    }
    setPasswordError("");
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyUserPassword(name.trim(), password)) {
      addRememberedName(name.trim());
      login(name.trim(), "student");
    } else {
      setPasswordError("パスワードがちがいます");
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 1) {
      setPasswordError("パスワードを入れてね");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("パスワードがあってないよ");
      return;
    }

    // 新規登録
    registerUser(name.trim(), password);
    addRememberedName(name.trim());
    login(name.trim(), "student");
  };

  const handleSelectName = (selectedName: string) => {
    setName(selectedName);
    setIsExistingUser(true);
    setMode("login");
    setPasswordError("");
  };

  const resetForm = () => {
    setMode("select");
    setPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setShowNameList(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center px-4">
      <Card className="w-full max-w-md animate-slide-in">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-lg">
              <BookOpen className="w-14 h-14 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
            My Diary
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            日記アプリへようこそ
          </p>
        </div>

        {/* 記憶された名前リスト */}
        {mode === "select" && rememberedNames.length > 0 && showNameList && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                なまえを えらんでね
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {rememberedNames.map((savedName) => (
                <button
                  key={savedName}
                  type="button"
                  onClick={() => handleSelectName(savedName)}
                  className="px-4 py-3 rounded-xl border-2 border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:border-amber-400 dark:hover:border-amber-600 transition-all text-amber-800 dark:text-amber-200 font-medium text-lg text-center active:scale-95"
                >
                  {savedName}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowNameList(false)}
              className="w-full mt-3 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              あたらしい なまえで はじめる
            </button>
          </div>
        )}

        {/* 新規名前入力フォーム */}
        {mode === "select" && (rememberedNames.length === 0 || !showNameList) && (
          <form onSubmit={handleNameSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2"
              >
                なまえを おしえてね
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="なまえ"
                className="w-full px-4 py-4 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-300 dark:focus:border-amber-600/50 transition-all shadow-sm hover:shadow-md text-xl text-center"
                required
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl text-lg py-4"
              size="lg"
              disabled={!name.trim()}
            >
              <Smile className="w-5 h-5 mr-2" />
              はじめる
            </Button>

            {rememberedNames.length > 0 && (
              <button
                type="button"
                onClick={() => setShowNameList(true)}
                className="w-full text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                まえの なまえで ログイン
              </button>
            )}
          </form>
        )}

        {/* ログインフォーム（既存ユーザー用） */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <span className="text-amber-800 dark:text-amber-200 font-medium">
                  {name}
                </span>
                <span className="text-amber-600 dark:text-amber-400 text-sm">
                  さん おかえり！
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2"
              >
                <Lock className="w-4 h-4 inline mr-1" />
                パスワードを いれてね
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                placeholder="パスワード"
                className="w-full px-4 py-4 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-300 dark:focus:border-amber-600/50 transition-all shadow-sm hover:shadow-md text-xl text-center"
                required
                autoFocus
              />
              {passwordError && (
                <div className="mt-2 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {passwordError}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl text-lg py-4"
              size="lg"
              disabled={!password}
            >
              <Smile className="w-5 h-5 mr-2" />
              ログイン
            </Button>

            <button
              type="button"
              onClick={resetForm}
              className="w-full text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              もどる
            </button>
          </form>
        )}

        {/* 新規登録フォーム */}
        {mode === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <UserPlus className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-200 font-medium">
                  {name}
                </span>
                <span className="text-green-600 dark:text-green-400 text-sm">
                  さん はじめまして！
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2"
              >
                <Lock className="w-4 h-4 inline mr-1" />
                じぶんの パスワードを きめてね
              </label>
              <input
                type="password"
                id="newPassword"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                placeholder="パスワード"
                className="w-full px-4 py-4 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-300 dark:focus:border-green-600/50 transition-all shadow-sm hover:shadow-md text-xl text-center"
                required
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2"
              >
                <Lock className="w-4 h-4 inline mr-1" />
                もういちど おなじパスワード
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError("");
                }}
                placeholder="パスワード（かくにん）"
                className="w-full px-4 py-4 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-300 dark:focus:border-green-600/50 transition-all shadow-sm hover:shadow-md text-xl text-center"
                required
              />
              {passwordError && (
                <div className="mt-2 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {passwordError}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl text-lg py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              size="lg"
              disabled={!password || !confirmPassword}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              登録して はじめる
            </Button>

            <button
              type="button"
              onClick={resetForm}
              className="w-full text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              もどる
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
