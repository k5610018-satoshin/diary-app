import { NextRequest, NextResponse } from "next/server";
import { generateFeedback } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { content, apiKey } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "日記の内容が必要です" },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini APIキーが設定されていません" },
        { status: 400 }
      );
    }

    const feedback = await generateFeedback(apiKey, content);

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "フィードバックの生成に失敗しました" },
      { status: 500 }
    );
  }
}
