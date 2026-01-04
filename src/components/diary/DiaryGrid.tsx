"use client";

import { Diary } from "@/types/diary";
import { DiaryCard } from "./DiaryCard";

interface DiaryGridProps {
  diaries: Diary[];
  onDiaryClick?: (diary: Diary) => void;
  showUserName?: boolean;
  emptyMessage?: string;
}

export function DiaryGrid({
  diaries,
  onDiaryClick,
  showUserName = false,
  emptyMessage = "日記がありません",
}: DiaryGridProps) {
  if (diaries.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-zinc-500 dark:text-zinc-400 text-lg">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {diaries.map((diary) => (
        <DiaryCard
          key={diary.id}
          diary={diary}
          onClick={() => onDiaryClick?.(diary)}
          showUserName={showUserName}
        />
      ))}
    </div>
  );
}
