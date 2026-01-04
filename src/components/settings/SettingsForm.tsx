"use client";

import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/Button";
import { Save, Eye, EyeOff, FileSpreadsheet, Sparkles } from "lucide-react";

interface SettingsFormProps {
  onClose: () => void;
}

export function SettingsForm({ onClose }: SettingsFormProps) {
  const { settings, updateSettings } = useSettings();
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || "");
  const [spreadsheetId, setSpreadsheetId] = useState(
    settings.spreadsheetId || ""
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    updateSettings({
      geminiApiKey: geminiApiKey.trim() || undefined,
      spreadsheetId: spreadsheetId.trim() || undefined,
    });

    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Gemini API キー */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          Gemini API キー
        </label>
        <div className="relative">
          <input
            type={showApiKey ? "text" : "password"}
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="AIxxxxxxxxxxxxxx"
            className="w-full px-4 py-2 pr-12 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            {showApiKey ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          AIフィードバック機能に必要です。
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:underline ml-1"
          >
            APIキーを取得
          </a>
        </p>
      </div>

      {/* スプレッドシート ID */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          <FileSpreadsheet className="w-4 h-4 text-green-500" />
          Google スプレッドシート ID
        </label>
        <input
          type="text"
          value={spreadsheetId}
          onChange={(e) => setSpreadsheetId(e.target.value)}
          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
          className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        <p className="text-xs text-zinc-500 mt-1">
          スプレッドシートのURLから取得できます。
          例: docs.google.com/spreadsheets/d/
          <span className="text-amber-600">ここがID</span>
          /edit
        </p>
      </div>

      {/* 保存ボタン */}
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <Button type="button" variant="ghost" onClick={onClose}>
          キャンセル
        </Button>
        <Button type="submit" isLoading={isSaving} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          保存
        </Button>
      </div>
    </form>
  );
}
