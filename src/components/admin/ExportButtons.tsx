"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Diary } from "@/types/diary";
import { generateDiaryPDF, downloadPDF } from "@/lib/pdf";
import { FileDown, FileSpreadsheet, Users, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface ExportButtonsProps {
  diaries: Diary[];
  spreadsheetId?: string;
}

// CSVエスケープ処理
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// 日記データをCSV形式に変換
function diariesToCSV(diaries: Diary[]): string {
  const headers = ["日付", "児童名", "タイトル", "内容", "追記", "AIフィードバック", "AI質問", "先生コメント"];

  const rows = diaries.map(diary => {
    const additions = diary.additions.map(a => a.content).join(" / ");
    const teacherComments = diary.teacherComments.map(c => `${c.teacherName}先生: ${c.content}`).join(" / ");

    return [
      format(new Date(diary.createdAt), "yyyy/MM/dd", { locale: ja }),
      diary.userName,
      diary.title,
      diary.content,
      additions,
      diary.aiFeedback?.feedback || "",
      diary.aiFeedback?.question || "",
      teacherComments
    ].map(escapeCSV).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

// CSVダウンロード
function downloadCSV(content: string, filename: string) {
  // BOMを追加してExcelでの文字化けを防ぐ
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportButtons({ diaries, spreadsheetId }: ExportButtonsProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pdf" | "csv">("pdf");

  // 児童ごとにグループ化
  const diariesByUser = diaries.reduce((acc, diary) => {
    if (!acc[diary.userName]) {
      acc[diary.userName] = [];
    }
    acc[diary.userName].push(diary);
    return acc;
  }, {} as Record<string, Diary[]>);

  const students = Object.keys(diariesByUser);

  const handleExportPDF = async (studentName: string) => {
    setIsExporting(true);
    setExportStatus(`${studentName}さんのPDFを作成中...`);

    try {
      const studentDiaries = diariesByUser[studentName];
      const blob = await generateDiaryPDF(studentDiaries, studentName);
      downloadPDF(blob, `${studentName}_日記.pdf`);
      setExportStatus(`${studentName}さんのPDFをダウンロードしました`);
    } catch (error) {
      console.error("PDF export error:", error);
      setExportStatus("PDFの作成に失敗しました");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllPDF = async () => {
    setIsExporting(true);

    for (const studentName of students) {
      setExportStatus(`${studentName}さんのPDFを作成中...`);
      try {
        const studentDiaries = diariesByUser[studentName];
        const blob = await generateDiaryPDF(studentDiaries, studentName);
        downloadPDF(blob, `${studentName}_日記.pdf`);
      } catch (error) {
        console.error(`PDF export error for ${studentName}:`, error);
      }
    }

    setExportStatus("全員のPDFをダウンロードしました");
    setIsExporting(false);
  };

  // 全員のCSVをエクスポート
  const handleExportAllCSV = () => {
    setExportStatus("CSVファイルを作成中...");
    try {
      const csv = diariesToCSV(diaries);
      const today = format(new Date(), "yyyyMMdd");
      downloadCSV(csv, `日記一覧_${today}.csv`);
      setExportStatus("CSVファイルをダウンロードしました。Googleスプレッドシートにインポートできます。");
    } catch (error) {
      console.error("CSV export error:", error);
      setExportStatus("CSVの作成に失敗しました");
    }
  };

  // 個別の児童のCSVをエクスポート
  const handleExportStudentCSV = (studentName: string) => {
    setExportStatus(`${studentName}さんのCSVを作成中...`);
    try {
      const studentDiaries = diariesByUser[studentName];
      const csv = diariesToCSV(studentDiaries);
      const today = format(new Date(), "yyyyMMdd");
      downloadCSV(csv, `${studentName}_日記_${today}.csv`);
      setExportStatus(`${studentName}さんのCSVをダウンロードしました`);
    } catch (error) {
      console.error("CSV export error:", error);
      setExportStatus("CSVの作成に失敗しました");
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setIsExportModalOpen(true)}
        className="flex items-center gap-2"
      >
        <FileDown className="w-4 h-4" />
        エクスポート
      </Button>

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportStatus(null);
        }}
        title="データのエクスポート"
        size="md"
      >
        <div className="space-y-4">
          {/* タブ切り替え */}
          <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700 pb-2">
            <button
              onClick={() => setActiveTab("pdf")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "pdf"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                PDF
              </span>
            </button>
            <button
              onClick={() => setActiveTab("csv")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "csv"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                CSV（スプレッドシート用）
              </span>
            </button>
          </div>

          {/* PDF出力タブ */}
          {activeTab === "pdf" && (
            <div>
              <p className="text-xs text-zinc-500 mb-3">
                日記をPDFファイルとしてダウンロードできます。印刷にも適しています。
              </p>

              {students.length === 0 ? (
                <p className="text-zinc-500 text-sm">出力できる日記がありません</p>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleExportAllPDF}
                    disabled={isExporting}
                    isLoading={isExporting}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    全員分をダウンロード ({students.length}名)
                  </Button>

                  <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-3">
                    <p className="text-xs text-zinc-500 mb-2">または個別にダウンロード：</p>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {students.map((studentName) => (
                        <Button
                          key={studentName}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportPDF(studentName)}
                          disabled={isExporting}
                          className="text-left justify-start"
                        >
                          {studentName} ({diariesByUser[studentName].length}件)
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CSV出力タブ */}
          {activeTab === "csv" && (
            <div>
              <p className="text-xs text-zinc-500 mb-3">
                CSV形式でダウンロードし、Googleスプレッドシートやエクセルにインポートできます。
              </p>

              {students.length === 0 ? (
                <p className="text-zinc-500 text-sm">出力できる日記がありません</p>
              ) : (
                <div className="space-y-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleExportAllCSV}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Download className="w-4 h-4" />
                    全員分をCSVでダウンロード ({diaries.length}件)
                  </Button>

                  <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-3">
                    <p className="text-xs text-zinc-500 mb-2">または個別にダウンロード：</p>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {students.map((studentName) => (
                        <Button
                          key={studentName}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportStudentCSV(studentName)}
                          disabled={isExporting}
                          className="text-left justify-start"
                        >
                          {studentName} ({diariesByUser[studentName].length}件)
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* スプレッドシートへのインポート手順 */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Googleスプレッドシートへのインポート方法
                    </h4>
                    <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
                      <li>CSVファイルをダウンロード</li>
                      <li>Googleスプレッドシートを開く</li>
                      <li>「ファイル」→「インポート」を選択</li>
                      <li>ダウンロードしたCSVファイルを選択</li>
                      <li>「スプレッドシートを置換」または「新しいシートを挿入」を選択</li>
                    </ol>
                  </div>

                  {/* スプレッドシートリンク */}
                  {spreadsheetId && (
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 text-sm"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      設定済みスプレッドシートを開く
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ステータス表示 */}
          {exportStatus && (
            <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg text-sm text-zinc-600 dark:text-zinc-400">
              {exportStatus}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
