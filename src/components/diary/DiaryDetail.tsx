"use client";

import { useState } from "react";
import { Diary, User } from "@/types/diary";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { MessageCircle, Send, Plus, Trash2, Sparkles } from "lucide-react";

interface DiaryDetailProps {
  diary: Diary;
  isTeacher: boolean;
  user: User;
  geminiApiKey?: string;
  onAddition: (content: string, questionContext: string) => void;
  onTeacherComment: (content: string) => void;
  onUpdate: (updates: Partial<Diary>) => void;
  onDelete?: () => void;
}

export function DiaryDetail({
  diary,
  isTeacher,
  user,
  geminiApiKey,
  onAddition,
  onTeacherComment,
  onUpdate,
  onDelete,
}: DiaryDetailProps) {
  const [additionContent, setAdditionContent] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [showAdditionForm, setShowAdditionForm] = useState(false);

  const handleAddition = () => {
    if (!additionContent.trim()) return;
    onAddition(additionContent.trim(), "");
    setAdditionContent("");
    setShowAdditionForm(false);
  };

  const handleTeacherComment = () => {
    if (!commentContent.trim()) return;
    onTeacherComment(commentContent.trim());
    setCommentContent("");
  };

  const canDelete = isTeacher || (diary.userId === user.id);

  return (
    <div className="space-y-6">
      {/* 日記情報 */}
      <div className="border-b border-zinc-200/60 dark:border-zinc-700/60 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-amber-600 dark:text-amber-400 font-semibold text-lg">
              {diary.userName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <time className="text-sm font-medium text-zinc-500 dark:text-zinc-400 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg">
              {format(new Date(diary.createdAt), "yyyy年M月d日(E)", {
                locale: ja,
              })}
            </time>
            {canDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 日記本文 */}
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed text-base">
          {diary.content}
        </p>
      </div>

      {/* 画像ギャラリー */}
      {diary.images && diary.images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
            <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
            写真
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {diary.images.map((image) => (
              <a
                key={image.id}
                href={image.data}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square rounded-xl overflow-hidden border border-zinc-200/60 dark:border-zinc-700/60 hover:ring-2 hover:ring-amber-500/50 hover:shadow-lg transition-all group"
              >
                <img
                  src={image.data}
                  alt={image.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 追記一覧 */}
      {diary.additions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
            追記
          </h4>
          {diary.additions.map((addition) => (
            <div
              key={addition.id}
              className="pl-5 border-l-4 border-purple-400 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-900/10 rounded-r-xl p-3"
            >
              <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed mb-1">
                {addition.content}
              </p>
              <time className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {format(new Date(addition.createdAt), "M/d HH:mm", {
                  locale: ja,
                })}
              </time>
            </div>
          ))}
        </div>
      )}

      {/* 追記ボタン・フォーム（児童用） */}
      {!isTeacher && diary.userId === user.id && (
        <>
          {showAdditionForm ? (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 rounded-xl p-5 space-y-4 border border-purple-200/60 dark:border-purple-700/60">
              <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                追記を書く
              </h4>
              <textarea
                value={additionContent}
                onChange={(e) => setAdditionContent(e.target.value)}
                placeholder="追記したいことを書いてね..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-purple-200/60 dark:border-purple-700/60 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 dark:focus:border-purple-600/50 resize-none text-sm transition-all shadow-sm"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdditionForm(false)}
                  className="rounded-xl"
                >
                  キャンセル
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddition}
                  disabled={!additionContent.trim()}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl"
                >
                  <Send className="w-4 h-4 mr-1" />
                  送る
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAdditionForm(true)}
              className="flex items-center gap-2 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              追記する
            </Button>
          )}
        </>
      )}

      {/* 教師コメント一覧（AIフィードバックより先に表示） */}
      {diary.teacherComments.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
            <MessageCircle className="w-4 h-4" />
            先生からのコメント
          </h4>
          {diary.teacherComments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200/60 dark:border-blue-700/60"
            >
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {comment.content}
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                <span>{comment.teacherName}先生</span>
                <span>•</span>
                <span>
                  {format(new Date(comment.createdAt), "M/d HH:mm", {
                    locale: ja,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 教師コメント入力 */}
      {isTeacher && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl p-5 space-y-4 border border-blue-200/60 dark:border-blue-700/60">
          <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            コメントを書く
          </h4>
          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="児童へのコメントを書いてください..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-blue-200/60 dark:border-blue-700/60 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 dark:focus:border-blue-600/50 resize-none text-sm transition-all shadow-sm"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleTeacherComment}
              disabled={!commentContent.trim()}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl"
            >
              <Send className="w-4 h-4 mr-1" />
              コメントを送る
            </Button>
          </div>
        </div>
      )}

      {/* AIフィードバック（一番下に表示） */}
      {diary.aiFeedback && (
        <div className="bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-800/50 dark:to-zinc-700/30 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              AIからのコメント
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {diary.aiFeedback.feedback}
          </p>
        </div>
      )}
    </div>
  );
}
