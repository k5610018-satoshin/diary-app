import { google } from "googleapis";
import { Diary } from "@/types/diary";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export async function syncToSpreadsheet(
  spreadsheetId: string,
  accessToken: string,
  diary: Diary
): Promise<boolean> {
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: "v4", auth });

    // シート名は児童の名前
    const sheetName = diary.userName;

    // シートが存在するか確認
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const existingSheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    );

    // シートが存在しない場合は作成
    if (!existingSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });

      // ヘッダー行を追加
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:G1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [
            ["日付", "タイトル", "内容", "追記", "AIフィードバック", "AI質問", "先生コメント"],
          ],
        },
      });
    }

    // 日記データを追加
    const additions = diary.additions
      .map((a) => a.content)
      .join("\n---\n");
    const teacherComments = diary.teacherComments
      .map((c) => `${c.teacherName}先生: ${c.content}`)
      .join("\n---\n");

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:G`,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            format(new Date(diary.createdAt), "yyyy/MM/dd", { locale: ja }),
            diary.title,
            diary.content,
            additions || "",
            diary.aiFeedback?.feedback || "",
            diary.aiFeedback?.question || "",
            teacherComments || "",
          ],
        ],
      },
    });

    return true;
  } catch (error) {
    console.error("Spreadsheet sync error:", error);
    return false;
  }
}

export async function exportAllDiariesToSpreadsheet(
  spreadsheetId: string,
  accessToken: string,
  diaries: Diary[]
): Promise<boolean> {
  try {
    // 児童ごとにグループ化
    const diariesByUser = diaries.reduce((acc, diary) => {
      if (!acc[diary.userName]) {
        acc[diary.userName] = [];
      }
      acc[diary.userName].push(diary);
      return acc;
    }, {} as Record<string, Diary[]>);

    // 各児童のシートに出力
    for (const [userName, userDiaries] of Object.entries(diariesByUser)) {
      for (const diary of userDiaries) {
        await syncToSpreadsheet(spreadsheetId, accessToken, diary);
      }
    }

    return true;
  } catch (error) {
    console.error("Export error:", error);
    return false;
  }
}
