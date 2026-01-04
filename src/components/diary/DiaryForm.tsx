"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { AIFeedback } from "@/components/ai/AIFeedback";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { User, Diary, DiaryImage, Addition } from "@/types/diary";
import { Send, ArrowRight, ArrowLeft, Sparkles, MessageCircle, CheckCircle } from "lucide-react";

interface DiaryFormProps {
  user: User;
  geminiApiKey?: string;
  onSubmit: (diary: Omit<Diary, "id" | "createdAt" | "updatedAt" | "teacherComments" | "syncStatus" | "images"> & { images?: DiaryImage[]; additions?: Addition[] }) => void;
  onCancel: () => void;
}

type FormStep = "write" | "feedback" | "complete";

export function DiaryForm({ user, geminiApiKey, onSubmit, onCancel }: DiaryFormProps) {
  const [step, setStep] = useState<FormStep>("write");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<DiaryImage[]>([]);
  const [aiFeedback, setAiFeedback] = useState<{ feedback: string; question: string } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addition, setAddition] = useState("");
  const [additions, setAdditions] = useState<Addition[]>([]);

  const handleTranscriptChange = useCallback((transcript: string) => {
    setContent((prev) => {
      if (transcript && !prev.endsWith(transcript)) {
        return transcript;
      }
      return prev;
    });
  }, []);

  // ステップ1からステップ2へ：AIフィードバックを取得
  const handleNextToFeedback = async () => {
    if (!title.trim() || !content.trim()) return;

    setStep("feedback");
    setAiError(null);

    // APIキーがある場合、AIフィードバックを自動生成
    if (geminiApiKey) {
      setIsLoadingAI(true);
      try {
        const response = await fetch("/api/gemini/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, apiKey: geminiApiKey }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.feedback && data.question) {
            setAiFeedback(data);
          } else {
            setAiError("AIからの応答形式が不正です");
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          setAiError(errorData.error || `エラー: ${response.status}`);
        }
      } catch (error) {
        console.error("AI feedback error:", error);
        setAiError("ネットワークエラーが発生しました");
      } finally {
        setIsLoadingAI(false);
      }
    } else {
      setAiError("APIキーが設定されていません。先生に確認してください。");
    }
  };

  // 追記を追加
  const handleAddAddition = () => {
    if (!addition.trim()) return;

    const newAddition: Addition = {
      id: crypto.randomUUID(),
      content: addition.trim(),
      questionContext: aiFeedback?.question || "",
      createdAt: new Date().toISOString(),
    };

    setAdditions([...additions, newAddition]);
    setAddition("");
  };

  // 先生に送信
  const handleSubmitToTeacher = async () => {
    setIsSubmitting(true);

    // 追記があれば本文に追加
    let finalContent = content.trim();
    if (addition.trim()) {
      finalContent += "\n\n" + addition.trim();
    }
    // 既存の追記リストも本文に追加
    for (const add of additions) {
      finalContent += "\n\n" + add.content;
    }

    onSubmit({
      userId: user.id,
      userName: user.name,
      title: title.trim(),
      content: finalContent,
      images: images,
      additions: [], // 追記は本文に統合したので空にする
      aiFeedback: aiFeedback
        ? {
          feedback: aiFeedback.feedback,
          question: aiFeedback.question,
          generatedAt: new Date().toISOString(),
        }
        : undefined,
    });

    setIsSubmitting(false);
  };

  // ステップ1: 日記を書く
  if (step === "write") {
    return (
      <div className="space-y-6">
        {/* ステップインジケーター */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">1</div>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">日記を書く</span>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 flex items-center justify-center text-sm font-bold">2</div>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">追記する</span>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 flex items-center justify-center text-sm font-bold">3</div>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">送信</span>
          </div>
        </div>

        {/* タイトル */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2"
          >
            タイトル
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="今日のできごと"
            className="w-full px-4 py-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-300 dark:focus:border-amber-600/50 transition-all shadow-sm hover:shadow-md"
            required
          />
        </div>

        {/* 音声入力 */}
        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            音声で入力
          </label>
          <VoiceRecorder onTranscriptChange={handleTranscriptChange} />
        </div>

        {/* 内容 */}
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2"
          >
            日記の内容
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今日あったことを書いてみよう..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-300 dark:focus:border-amber-600/50 resize-none transition-all shadow-sm hover:shadow-md"
            required
          />
        </div>

        {/* 画像添付 */}
        <ImageUpload images={images} onChange={setImages} />

        {/* ボタン */}
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-700/60">
          <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl">
            キャンセル
          </Button>
          <Button
            type="button"
            onClick={handleNextToFeedback}
            disabled={!title.trim() || !content.trim()}
            className="flex items-center gap-2 rounded-xl"
          >
            次へ
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ステップ2: AIフィードバック＆追記
  if (step === "feedback") {
    return (
      <div className="space-y-6">
        {/* ステップインジケーター */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">日記を書く</span>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">2</div>
            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">追記する</span>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 flex items-center justify-center text-sm font-bold">3</div>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">送信</span>
          </div>
        </div>

        {/* 書いた日記のプレビュー */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">{title}</h3>
          <p className="text-zinc-700 dark:text-zinc-300 text-sm whitespace-pre-wrap line-clamp-3">{content}</p>
        </div>

        {/* AIフィードバック */}
        <div className="space-y-4">
          {isLoadingAI ? (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                <span className="text-purple-600 dark:text-purple-400">
                  AIがコメントを考えています...
                </span>
              </div>
            </div>
          ) : aiFeedback ? (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                      AIからのコメント
                    </h4>
                    <p className="text-zinc-700 dark:text-zinc-300">{aiFeedback.feedback}</p>
                  </div>

                  <div className="pt-3 border-t border-purple-200 dark:border-purple-700">
                    <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      もっと教えて！
                    </h4>
                    <p className="text-zinc-700 dark:text-zinc-300">{aiFeedback.question}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : aiError ? (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium mb-1">
                AIコメントの取得に失敗しました
              </p>
              <p className="text-red-600 dark:text-red-400 text-xs">
                {aiError}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-2">
                このまま先生に送信することもできます。
              </p>
            </div>
          ) : (
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                AIコメント機能は利用できません。このまま送信できます。
              </p>
            </div>
          )}
        </div>

        {/* 追記入力 */}
        {aiFeedback && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              追記して答えてみよう！（任意）
            </label>

            {/* 音声入力 */}
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">音声で入力することもできます</p>
              <VoiceRecorder
                onTranscriptChange={(transcript) => {
                  if (transcript && !addition.endsWith(transcript)) {
                    setAddition(transcript);
                  }
                }}
              />
            </div>

            {/* テキスト入力 */}
            <div className="flex gap-2">
              <textarea
                value={addition}
                onChange={(e) => setAddition(e.target.value)}
                placeholder="質問への答えや、思ったことを書いてみよう..."
                rows={3}
                className="flex-1 px-4 py-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300 dark:focus:border-purple-600/50 resize-none transition-all shadow-sm"
              />
            </div>
            {addition.trim() && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddAddition}
                className="rounded-xl"
              >
                追記を追加
              </Button>
            )}
          </div>
        )}

        {/* 追記リスト */}
        {additions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">追記した内容：</h4>
            {additions.map((add, index) => (
              <div key={add.id} className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{add.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* ボタン */}
        <div className="flex justify-between gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-700/60">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep("write")}
            className="flex items-center gap-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Button>
          <Button
            type="button"
            onClick={handleSubmitToTeacher}
            isLoading={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Send className="w-4 h-4" />
            先生に送信する
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
