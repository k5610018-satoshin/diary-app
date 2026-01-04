"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { useDiaries, useFilteredDiaries } from "@/hooks/useDiaries";
import { DiaryGrid } from "@/components/diary/DiaryGrid";
import { DiaryList } from "@/components/diary/DiaryList";
import { DiaryCalendar } from "@/components/diary/DiaryCalendar";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { LoadingScreen } from "@/components/ui/Loading";
import { SortOrder, ViewMode, Diary, User } from "@/types/diary";
import { Settings, LogOut, GraduationCap, Users, Shield, Key, FileSpreadsheet, Calendar, User as UserIcon, Filter, X } from "lucide-react";
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { DiaryDetail } from "@/components/diary/DiaryDetail";
import { ExportButtons } from "@/components/admin/ExportButtons";
import * as storage from "@/lib/localStorage";

export default function AdminPage() {
  const { settings, updateSettings } = useSettings();
  const [teacherUser, setTeacherUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const { diaries, isLoading: diariesLoading, updateDiary, deleteDiary, addTeacherComment } = useDiaries();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null);
  const [diaryToDelete, setDiaryToDelete] = useState<Diary | null>(null);

  // フィルター状態
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  // 設定フォームの状態
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || "");
  const [spreadsheetId, setSpreadsheetId] = useState(settings.spreadsheetId || "");
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const filteredDiaries = useFilteredDiaries(diaries, searchQuery, sortOrder);

  // ユニークな児童リストを取得
  const uniqueStudents = Array.from(
    new Map(diaries.map(d => [d.userId, { id: d.userId, name: d.userName }])).values()
  ).sort((a, b) => a.name.localeCompare(b.name, 'ja'));

  // ユニークな日付リストを取得（新しい順）
  const uniqueDates = Array.from(
    new Set(diaries.map(d => format(parseISO(d.createdAt), 'yyyy-MM-dd')))
  ).sort((a, b) => b.localeCompare(a));

  // 日付・児童フィルターを適用
  const advancedFilteredDiaries = filteredDiaries.filter(diary => {
    // 日付フィルター
    if (selectedDate) {
      const diaryDate = format(parseISO(diary.createdAt), 'yyyy-MM-dd');
      if (diaryDate !== selectedDate) return false;
    }
    // 児童フィルター
    if (selectedStudent && diary.userId !== selectedStudent) {
      return false;
    }
    return true;
  });

  // 先生用のローカルストレージキー
  const TEACHER_USER_KEY = "diary-app-teacher-user";

  useEffect(() => {
    // 先生ユーザーを読み込む
    const savedTeacher = localStorage.getItem(TEACHER_USER_KEY);
    if (savedTeacher) {
      setTeacherUser(JSON.parse(savedTeacher));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // 設定が変更されたらフォームに反映
    setGeminiApiKey(settings.geminiApiKey || "");
    setSpreadsheetId(settings.spreadsheetId || "");
  }, [settings]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    // シンプルなパスワード認証（実際の環境では適切な認証システムを使用）
    if (loginPassword === "teacher2024" || loginPassword === "admin") {
      const newTeacher: User = {
        id: storage.generateId(),
        email: `${loginName}@teacher.local`,
        name: loginName,
        role: "teacher",
      };
      localStorage.setItem(TEACHER_USER_KEY, JSON.stringify(newTeacher));
      setTeacherUser(newTeacher);
    } else {
      setLoginError("パスワードが正しくありません");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TEACHER_USER_KEY);
    setTeacherUser(null);
  };

  const handleSaveSettings = () => {
    updateSettings({
      geminiApiKey: geminiApiKey.trim() || undefined,
      spreadsheetId: spreadsheetId.trim() || undefined,
    });
    setApiTestResult(null);
    setIsSettingsOpen(false);
  };

  const handleTestGeminiApi = async () => {
    if (!geminiApiKey.trim()) {
      setApiTestResult({ success: false, message: "APIキーを入力してください" });
      return;
    }

    setIsTestingApi(true);
    setApiTestResult(null);

    try {
      const response = await fetch("/api/gemini/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "今日は学校で友達と楽しく遊びました。",
          apiKey: geminiApiKey.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.feedback && data.question) {
          setApiTestResult({
            success: true,
            message: `接続成功！\nフィードバック: ${data.feedback}\n質問: ${data.question}`
          });
        } else {
          setApiTestResult({ success: false, message: "レスポンス形式が不正です" });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setApiTestResult({
          success: false,
          message: errorData.error || `エラー: ${response.status}`
        });
      }
    } catch (error) {
      console.error("API test error:", error);
      setApiTestResult({ success: false, message: "接続に失敗しました。ネットワークを確認してください。" });
    } finally {
      setIsTestingApi(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center">
        <LoadingScreen message="読み込み中..." />
      </div>
    );
  }

  // 先生ログイン画面
  if (!teacherUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Shield className="w-14 h-14 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
              先生用管理画面
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              教員専用のログインページです
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="teacherName"
                className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2"
              >
                先生の名前
              </label>
              <input
                type="text"
                id="teacherName"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="山田 太郎"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 dark:focus:border-blue-600/50 transition-all shadow-sm"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2"
              >
                パスワード
              </label>
              <input
                type="password"
                id="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 dark:focus:border-blue-600/50 transition-all shadow-sm"
                required
              />
            </div>

            {loginError && (
              <p className="text-sm text-red-500 text-center">{loginError}</p>
            )}

            <Button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              size="lg"
              disabled={!loginName.trim() || !loginPassword}
            >
              <GraduationCap className="w-5 h-5 mr-2" />
              ログイン
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // 先生用管理画面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800">
      {/* ヘッダー */}
      <header className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-blue-200/60 dark:border-zinc-700/60 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  先生用管理画面
                </h1>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  {teacherUser.name}先生
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
                className="rounded-xl"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-xl">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索・ソート・表示モード */}
        <div className="mb-4">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {/* フィルターパネル */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all shadow-sm hover:shadow-md ${showFilters || selectedDate || selectedStudent
              ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
              : "bg-white/80 dark:bg-zinc-800/80 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300"
              }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">フィルター</span>
            {(selectedDate || selectedStudent) && (
              <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-blue-500 text-white rounded-full">
                {(selectedDate ? 1 : 0) + (selectedStudent ? 1 : 0)}
              </span>
            )}
          </button>

          {showFilters && (
            <div className="mt-3 p-4 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-sm">
              <div className="flex flex-wrap gap-4">
                {/* 日付フィルター */}
                <div className="flex-1 min-w-[200px]">
                  <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    <Calendar className="w-4 h-4" />
                    日付で絞り込み
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 dark:focus:border-blue-600/50 transition-all"
                  >
                    <option value="">すべての日付</option>
                    {uniqueDates.map(date => (
                      <option key={date} value={date}>
                        {format(parseISO(date), 'yyyy年M月d日 (E)', { locale: ja })}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 児童フィルター */}
                <div className="flex-1 min-w-[200px]">
                  <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    <UserIcon className="w-4 h-4" />
                    児童で絞り込み
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 dark:focus:border-blue-600/50 transition-all"
                  >
                    <option value="">すべての児童</option>
                    {uniqueStudents.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* フィルタークリアボタン */}
                {(selectedDate || selectedStudent) && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSelectedDate("");
                        setSelectedStudent("");
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 transition-all"
                    >
                      <X className="w-4 h-4" />
                      <span className="text-sm font-medium">クリア</span>
                    </button>
                  </div>
                )}
              </div>

              {/* アクティブフィルター表示 */}
              {(selectedDate || selectedStudent) && (
                <div className="mt-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-700/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">適用中:</span>
                    {selectedDate && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(selectedDate), 'M月d日', { locale: ja })}
                        <button
                          onClick={() => setSelectedDate("")}
                          className="ml-1 hover:text-blue-900 dark:hover:text-blue-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {selectedStudent && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-medium">
                        <UserIcon className="w-3 h-3" />
                        {uniqueStudents.find(s => s.id === selectedStudent)?.name}
                        <button
                          onClick={() => setSelectedStudent("")}
                          className="ml-1 hover:text-green-900 dark:hover:text-green-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 統計情報 */}
        <div className="mb-6 flex items-center justify-between p-4 bg-white/60 dark:bg-zinc-800/60 rounded-2xl backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-700/60 shadow-sm">
          <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <span className="font-medium">
                {selectedStudent
                  ? `${uniqueStudents.find(s => s.id === selectedStudent)?.name}さんの日記`
                  : "全児童の日記一覧"
                }
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400 ml-2">
                ({advancedFilteredDiaries.length}件
                {(selectedDate || selectedStudent) && ` / 全${diaries.length}件`})
              </span>
            </div>
          </div>
          <ExportButtons diaries={advancedFilteredDiaries} spreadsheetId={settings.spreadsheetId} />
        </div>

        {/* 日記一覧 */}
        {diariesLoading ? (
          <LoadingScreen message="日記を読み込み中..." />
        ) : viewMode === "calendar" ? (
          <DiaryCalendar
            diaries={advancedFilteredDiaries}
            onDiaryClick={setSelectedDiary}
            showUserName={true}
          />
        ) : viewMode === "list" ? (
          <DiaryList
            diaries={advancedFilteredDiaries}
            onDiaryClick={setSelectedDiary}
            showUserName={true}
            emptyMessage={selectedDate || selectedStudent ? "条件に一致する日記がありません" : "まだ日記が投稿されていません"}
          />
        ) : (
          <DiaryGrid
            diaries={advancedFilteredDiaries}
            onDiaryClick={setSelectedDiary}
            showUserName={true}
            emptyMessage={selectedDate || selectedStudent ? "条件に一致する日記がありません" : "まだ日記が投稿されていません"}
          />
        )}
      </main>

      {/* 日記詳細モーダル */}
      <Modal
        isOpen={!!selectedDiary}
        onClose={() => setSelectedDiary(null)}
        title={selectedDiary?.title}
        size="lg"
      >
        {selectedDiary && (
          <DiaryDetail
            diary={selectedDiary}
            isTeacher={true}
            user={teacherUser}
            geminiApiKey={settings.geminiApiKey}
            onAddition={() => { }}
            onTeacherComment={(content) => {
              addTeacherComment(selectedDiary.id, {
                teacherId: teacherUser.id,
                teacherName: teacherUser.name,
                content,
              });
              const updated = diaries.find(d => d.id === selectedDiary.id);
              if (updated) setSelectedDiary(updated);
            }}
            onUpdate={(updates) => {
              const updated = updateDiary(selectedDiary.id, updates);
              if (updated) setSelectedDiary(updated);
            }}
            onDelete={() => {
              setDiaryToDelete(selectedDiary);
            }}
          />
        )}
      </Modal>

      {/* 設定モーダル */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="設定"
        size="md"
      >
        <div className="space-y-6">
          {/* Gemini API Key */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              <Key className="w-4 h-4" />
              Gemini API Key
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => {
                  setGeminiApiKey(e.target.value);
                  setApiTestResult(null);
                }}
                placeholder="AIzaSy..."
                className="flex-1 px-4 py-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleTestGeminiApi}
                disabled={isTestingApi || !geminiApiKey.trim()}
                isLoading={isTestingApi}
                className="rounded-xl whitespace-nowrap"
              >
                テスト
              </Button>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              AIフィードバック機能に使用します。
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline ml-1"
              >
                APIキーを取得
              </a>
            </p>
            {apiTestResult && (
              <div className={`mt-2 p-3 rounded-lg text-sm whitespace-pre-wrap ${apiTestResult.success
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                }`}>
                {apiTestResult.message}
              </div>
            )}
          </div>

          {/* Spreadsheet ID */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              <FileSpreadsheet className="w-4 h-4" />
              Google Spreadsheet ID（任意）
            </label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300"
            />
            <p className="text-xs text-zinc-500 mt-1">
              スプレッドシートへのリンク用です。データはCSVでエクスポートしてインポートできます。
            </p>
            {spreadsheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 mt-1"
              >
                <FileSpreadsheet className="w-3 h-3" />
                スプレッドシートを開く
              </a>
            )}
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-700/60">
            <Button
              variant="ghost"
              onClick={() => {
                setIsSettingsOpen(false);
                setApiTestResult(null);
              }}
              className="rounded-xl"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600"
            >
              保存する
            </Button>
          </div>
        </div>
      </Modal>

      {/* 削除確認モーダル */}
      <Modal
        isOpen={!!diaryToDelete}
        onClose={() => setDiaryToDelete(null)}
        title="日記を削除"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-zinc-700 dark:text-zinc-300">
            この日記を削除してもよろしいですか？
          </p>
          {diaryToDelete && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-200/60 dark:border-zinc-700/60">
              <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                {diaryToDelete.title}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {diaryToDelete.userName}
              </p>
            </div>
          )}
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            この操作は取り消せません。
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setDiaryToDelete(null)}
              className="rounded-xl"
            >
              キャンセル
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (diaryToDelete) {
                  deleteDiary(diaryToDelete.id);
                  setDiaryToDelete(null);
                  setSelectedDiary(null);
                }
              }}
              className="rounded-xl"
            >
              削除する
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
