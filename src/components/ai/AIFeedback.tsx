"use client";

import { Sparkles, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";

interface AIFeedbackProps {
  feedback?: string;
  question?: string;
  isLoading?: boolean;
  onAnswerQuestion?: () => void;
}

export function AIFeedback({
  feedback,
  question,
  isLoading = false,
  onAnswerQuestion,
}: AIFeedbackProps) {
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-3">
          <Loading size="sm" />
          <span className="text-purple-600 dark:text-purple-400">
            AIがフィードバックを考えています...
          </span>
        </div>
      </Card>
    );
  }

  if (!feedback && !question) return null;

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-300" />
        </div>
        <div className="flex-1 space-y-3">
          {feedback && (
            <div>
              <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                AIからのフィードバック
              </h4>
              <p className="text-zinc-700 dark:text-zinc-300">{feedback}</p>
            </div>
          )}

          {question && (
            <div className="pt-2 border-t border-purple-200 dark:border-purple-700">
              <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                もっと教えて！
              </h4>
              <p className="text-zinc-700 dark:text-zinc-300 mb-3">{question}</p>
              {onAnswerQuestion && (
                <button
                  onClick={onAnswerQuestion}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  答える
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
