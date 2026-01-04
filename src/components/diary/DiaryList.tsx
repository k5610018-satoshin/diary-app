"use client";

import { Diary } from "@/types/diary";
import { Card } from "@/components/ui/Card";
import { MessageCircle, Sparkles, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface DiaryListProps {
  diaries: Diary[];
  onDiaryClick: (diary: Diary) => void;
  showUserName?: boolean;
  emptyMessage?: string;
}

export function DiaryList({
  diaries,
  onDiaryClick,
  showUserName = false,
  emptyMessage = "日記がありません",
}: DiaryListProps) {
  if (diaries.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-400 dark:text-zinc-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {diaries.map((diary) => {
        const hasAIFeedback = !!diary.aiFeedback;
        const hasTeacherComment = diary.teacherComments.length > 0;
        const hasImages = diary.images && diary.images.length > 0;

        return (
          <Card
            key={diary.id}
            hoverable
            onClick={() => onDiaryClick(diary)}
            className="flex gap-4 group"
          >
            {/* 画像サムネイル */}
            {hasImages && (
              <div className="flex-shrink-0">
                <img
                  src={diary.images[0].data}
                  alt=""
                  className="w-20 h-20 object-cover rounded-xl shadow-sm group-hover:shadow-md transition-shadow"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* ヘッダー */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100 truncate mb-1">
                    {diary.title}
                  </h3>
                  {showUserName && (
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      {diary.userName}
                    </p>
                  )}
                </div>
                <time className="text-xs font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap ml-3 px-2 py-1 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg">
                  {format(new Date(diary.createdAt), "M/d(E) HH:mm", {
                    locale: ja,
                  })}
                </time>
              </div>

              {/* 本文プレビュー */}
              <p className="text-zinc-600 dark:text-zinc-300 text-sm line-clamp-2 leading-relaxed mb-3">
                {diary.content}
              </p>

              {/* バッジ */}
              <div className="flex items-center gap-2 flex-wrap">
                {hasImages && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-lg">
                    <ImageIcon className="w-3.5 h-3.5" />
                    {diary.images.length}
                  </span>
                )}
                {hasAIFeedback && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI
                  </span>
                )}
                {hasTeacherComment && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {diary.teacherComments.length}
                  </span>
                )}
                {diary.additions.length > 0 && (
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700/50 px-2.5 py-1 rounded-lg">
                    +{diary.additions.length}追記
                  </span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
