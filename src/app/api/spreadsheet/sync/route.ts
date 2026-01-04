import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { scriptUrl, name, date, content, title } = await request.json();

        if (!scriptUrl) {
            return NextResponse.json(
                { error: "Apps Script URLが設定されていません" },
                { status: 400 }
            );
        }

        // Google Apps Scriptにデータを送信
        const response = await fetch(scriptUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                date,
                title,
                content,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            return NextResponse.json(
                { error: `送信に失敗しました: ${text}` },
                { status: response.status }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Spreadsheet sync error:", error);
        return NextResponse.json(
            { error: "スプレッドシートへの送信に失敗しました" },
            { status: 500 }
        );
    }
}
