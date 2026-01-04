"use client";

import { useState, useRef } from "react";
import { DiaryImage } from "@/types/diary";
import { Button } from "./Button";
import { ImagePlus, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  images: DiaryImage[];
  onChange: (images: DiaryImage[]) => void;
  maxImages?: number;
  maxSizeKB?: number;
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 3,
  maxSizeKB = 500,
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    if (images.length >= maxImages) {
      setError(`画像は${maxImages}枚までです`);
      return;
    }

    const file = files[0];

    // ファイルタイプチェック
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }

    // サイズチェック
    if (file.size > maxSizeKB * 1024) {
      setError(`画像サイズは${maxSizeKB}KB以下にしてください`);
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      const newImage: DiaryImage = {
        id: generateId(),
        data: base64,
        name: file.name,
        type: file.type,
        createdAt: new Date().toISOString(),
      };
      onChange([...images, newImage]);
    } catch {
      setError("画像の読み込みに失敗しました");
    }

    // inputをリセット
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-zinc-500" />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          写真を添付 ({images.length}/{maxImages})
        </span>
      </div>

      {/* 画像プレビュー */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img
                src={img.data}
                alt={img.name}
                className="w-20 h-20 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
              />
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* アップロードボタン */}
      {images.length < maxImages && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <ImagePlus className="w-4 h-4" />
              写真を追加
            </Button>
          </label>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

// ヘルパー関数
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
