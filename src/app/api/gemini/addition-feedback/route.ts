import { NextRequest, NextResponse } from "next/server";
import { generateAdditionFeedback } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { originalContent, previousQuestion, additionContent, apiKey } = await request.json();

    if (!originalContent || !additionContent) {
      return NextResponse.json(
        { error: "必要なデータが不足しています" },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini APIキーが設定されていません" },
        { status: 400 }
      );
    }

    const feedback = await generateAdditionFeedback(
      apiKey,
      originalContent,
      previousQuestion || "",
      additionContent
    );

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "フィードバックの生成に失敗しました" },
      { status: 500 }
    );
  }
}
