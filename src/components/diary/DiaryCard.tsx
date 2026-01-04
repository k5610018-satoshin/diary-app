"use client";

import { Diary } from "@/types/diary";
import { Card } from "@/components/ui/Card";
import { MessageCircle, Sparkles, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface DiaryCardProps {
  diary: Diary;
  onClick?: () => void;
  showUserName?: boolean;
}

export function DiaryCard({ diary, onClick, showUserName = false }: DiaryCardProps) {
  const hasAIFeedback = !!diary.aiFeedback;
  const hasTeacherComment = diary.teacherComments.length > 0;
  const hasImages = diary.images && diary.images.length > 0;

  return (
    <Card hoverable onClick={onClick} className="flex flex-col h-full group overflow-hidden">
      {/* 画像サムネイル */}
      {hasImages && (
        <div className="mb-4 -mx-6 -mt-6 rounded-t-2xl overflow-hidden relative">
          <img
            src={diary.images[0].data}
            alt=""
            className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {diary.images.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
              +{diary.images.length - 1}
            </div>
          )}
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 truncate mb-1">
            {diary.title}
          </h3>
          {showUserName && (
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {diary.userName}
            </p>
          )}
        </div>
        <time className="text-xs font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap ml-3 px-2 py-1 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg">
          {format(new Date(diary.createdAt), "M/d(E)", { locale: ja })}
        </time>
      </div>

      <p className="text-zinc-600 dark:text-zinc-300 text-sm line-clamp-3 flex-1 leading-relaxed">
        {diary.content}
      </p>

      {(hasAIFeedback || hasTeacherComment || diary.additions.length > 0 || hasImages) && (
        <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-700/60 flex-wrap">
          {hasImages && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-lg">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{diary.images.length}枚</span>
            </div>
          )}
          {hasAIFeedback && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1 rounded-lg">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AIフィードバック</span>
            </div>
          )}
          {hasTeacherComment && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>先生コメント</span>
            </div>
          )}
          {diary.additions.length > 0 && (
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700/50 px-2.5 py-1 rounded-lg">
              +{diary.additions.length}件の追記
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
