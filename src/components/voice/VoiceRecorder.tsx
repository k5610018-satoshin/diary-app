"use client";

import { Mic, MicOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useEffect } from "react";

interface VoiceRecorderProps {
  onTranscriptChange: (transcript: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({
  onTranscriptChange,
  disabled = false,
}: VoiceRecorderProps) {
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    onTranscriptChange(transcript);
  }, [transcript, onTranscriptChange]);

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm">
          お使いのブラウザは音声入力に対応していません。Chromeの使用をおすすめします。
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={isListening ? "danger" : "primary"}
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              録音停止
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              音声入力
            </>
          )}
        </Button>

        {transcript && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetTranscript}
          >
            クリア
          </Button>
        )}
      </div>

      {isListening && (
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-sm text-red-500">録音中...</span>
        </div>
      )}

      {interimTranscript && (
        <p className="text-zinc-400 italic text-sm">
          {interimTranscript}
        </p>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
