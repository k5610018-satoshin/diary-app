"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useDiaries, useFilteredDiaries } from "@/hooks/useDiaries";
import { DiaryGrid } from "@/components/diary/DiaryGrid";
import { DiaryList } from "@/components/diary/DiaryList";
import { DiaryCalendar } from "@/components/diary/DiaryCalendar";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LoadingScreen } from "@/components/ui/Loading";
import { SortOrder, ViewMode, Diary } from "@/types/diary";
import { Plus, LogOut, BookOpen, PenLine } from "lucide-react";
import { DiaryForm } from "@/components/diary/DiaryForm";
import { DiaryDetail } from "@/components/diary/DiaryDetail";
import { LoginForm } from "@/components/auth/LoginForm";

export default function Home() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { settings } = useSettings();
  const { diaries, isLoading: diariesLoading, addDiary, updateDiary, deleteDiary, addAddition } = useDiaries(
    user?.id
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isNewDiaryOpen, setIsNewDiaryOpen] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null);
  const [diaryToDelete, setDiaryToDelete] = useState<Diary | null>(null);

  const filteredDiaries = useFilteredDiaries(diaries, searchQuery, sortOrder);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center">
        <LoadingScreen message="読み込み中..." />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800">
      {/* ヘッダー */}
      <header className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-amber-200/60 dark:border-zinc-700/60 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                  My Diary
                </h1>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  {user.name}さんの日記
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                onClick={() => setIsNewDiaryOpen(true)}
                className="flex items-center gap-2 rounded-xl"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">日記を書く</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={logout} className="rounded-xl">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計バナー */}
        <div className="mb-6 p-4 bg-white/60 dark:bg-zinc-800/60 rounded-2xl backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-700/60 shadow-sm">
          <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <PenLine className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <span className="font-medium">
                {filteredDiaries.length === 0
                  ? "まだ日記がありません。最初の日記を書いてみよう！"
                  : `これまでに${filteredDiaries.length}件の日記を書きました`
                }
              </span>
            </div>
          </div>
        </div>

        {/* 検索・ソート・表示モード */}
        <div className="mb-8">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {/* 日記一覧 */}
        {diariesLoading ? (
          <LoadingScreen message="日記を読み込み中..." />
        ) : viewMode === "calendar" ? (
          <DiaryCalendar
            diaries={filteredDiaries}
            onDiaryClick={setSelectedDiary}
            showUserName={false}
          />
        ) : viewMode === "list" ? (
          <DiaryList
            diaries={filteredDiaries}
            onDiaryClick={setSelectedDiary}
            showUserName={false}
            emptyMessage="日記を書いてみましょう！"
          />
        ) : (
          <DiaryGrid
            diaries={filteredDiaries}
            onDiaryClick={setSelectedDiary}
            showUserName={false}
            emptyMessage="日記を書いてみましょう！"
          />
        )}
      </main>

      {/* 新規日記モーダル */}
      <Modal
        isOpen={isNewDiaryOpen}
        onClose={() => setIsNewDiaryOpen(false)}
        title="新しい日記を書く"
        size="lg"
      >
        <DiaryForm
          user={user}
          geminiApiKey={settings.geminiApiKey}
          onSubmit={async (diary) => {
            const newDiary = addDiary(diary);
            setIsNewDiaryOpen(false);

            // スプレッドシートに送信
            if (settings.appsScriptUrl && newDiary) {
              try {
                await fetch("/api/spreadsheet/sync", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    scriptUrl: settings.appsScriptUrl,
                    name: diary.userName,
                    date: new Date().toLocaleString("ja-JP"),
                    title: diary.title,
                    content: diary.content,
                  }),
                });
              } catch (e) {
                console.error("Spreadsheet sync error:", e);
              }
            }
          }}
          onCancel={() => setIsNewDiaryOpen(false)}
        />
      </Modal>

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
            isTeacher={false}
            user={user}
            geminiApiKey={settings.geminiApiKey}
            onAddition={(content, questionContext) => {
              addAddition(selectedDiary.id, { content, questionContext });
              const updated = diaries.find(d => d.id === selectedDiary.id);
              if (updated) setSelectedDiary(updated);
            }}
            onTeacherComment={() => { }}
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
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                {diaryToDelete.content}
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
