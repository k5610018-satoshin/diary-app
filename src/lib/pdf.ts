import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Diary } from "@/types/diary";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export async function generateDiaryPDF(
  diaries: Diary[],
  studentName: string
): Promise<Blob> {
  // 一時的なHTMLコンテナを作成
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "210mm";
  container.style.padding = "20mm";
  container.style.backgroundColor = "#fff";
  container.style.fontFamily = "sans-serif";

  // タイトル
  const title = document.createElement("h1");
  title.textContent = `${studentName}さんの日記`;
  title.style.fontSize = "24px";
  title.style.marginBottom = "20px";
  title.style.color = "#d97706";
  title.style.borderBottom = "2px solid #d97706";
  title.style.paddingBottom = "10px";
  container.appendChild(title);

  // 日記ごとにセクションを作成
  for (const diary of diaries) {
    const section = document.createElement("div");
    section.style.marginBottom = "30px";
    section.style.pageBreakInside = "avoid";

    // 日付とタイトル
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.marginBottom = "10px";

    const diaryTitle = document.createElement("h2");
    diaryTitle.textContent = diary.title;
    diaryTitle.style.fontSize = "18px";
    diaryTitle.style.color = "#1f2937";
    diaryTitle.style.margin = "0";

    const date = document.createElement("span");
    date.textContent = format(new Date(diary.createdAt), "yyyy年M月d日(E)", {
      locale: ja,
    });
    date.style.fontSize = "12px";
    date.style.color = "#6b7280";

    header.appendChild(diaryTitle);
    header.appendChild(date);
    section.appendChild(header);

    // 本文
    const content = document.createElement("p");
    content.textContent = diary.content;
    content.style.fontSize = "14px";
    content.style.lineHeight = "1.8";
    content.style.color = "#374151";
    content.style.whiteSpace = "pre-wrap";
    section.appendChild(content);

    // 追記
    if (diary.additions.length > 0) {
      const additionsTitle = document.createElement("h4");
      additionsTitle.textContent = "追記";
      additionsTitle.style.fontSize = "12px";
      additionsTitle.style.color = "#d97706";
      additionsTitle.style.marginTop = "15px";
      additionsTitle.style.marginBottom = "5px";
      section.appendChild(additionsTitle);

      for (const addition of diary.additions) {
        const additionEl = document.createElement("p");
        additionEl.textContent = addition.content;
        additionEl.style.fontSize = "13px";
        additionEl.style.color = "#4b5563";
        additionEl.style.paddingLeft = "10px";
        additionEl.style.borderLeft = "2px solid #fcd34d";
        section.appendChild(additionEl);
      }
    }

    // AIフィードバック
    if (diary.aiFeedback) {
      const aiSection = document.createElement("div");
      aiSection.style.backgroundColor = "#faf5ff";
      aiSection.style.padding = "10px";
      aiSection.style.borderRadius = "8px";
      aiSection.style.marginTop = "15px";

      const aiTitle = document.createElement("h4");
      aiTitle.textContent = "AIからのフィードバック";
      aiTitle.style.fontSize = "12px";
      aiTitle.style.color = "#7c3aed";
      aiTitle.style.marginBottom = "5px";
      aiSection.appendChild(aiTitle);

      const aiFeedback = document.createElement("p");
      aiFeedback.textContent = diary.aiFeedback.feedback;
      aiFeedback.style.fontSize = "13px";
      aiFeedback.style.color = "#4b5563";
      aiSection.appendChild(aiFeedback);

      section.appendChild(aiSection);
    }

    // 先生コメント
    if (diary.teacherComments.length > 0) {
      const commentsSection = document.createElement("div");
      commentsSection.style.backgroundColor = "#eff6ff";
      commentsSection.style.padding = "10px";
      commentsSection.style.borderRadius = "8px";
      commentsSection.style.marginTop = "15px";

      const commentsTitle = document.createElement("h4");
      commentsTitle.textContent = "先生からのコメント";
      commentsTitle.style.fontSize = "12px";
      commentsTitle.style.color = "#2563eb";
      commentsTitle.style.marginBottom = "5px";
      commentsSection.appendChild(commentsTitle);

      for (const comment of diary.teacherComments) {
        const commentEl = document.createElement("p");
        commentEl.textContent = `${comment.teacherName}先生: ${comment.content}`;
        commentEl.style.fontSize = "13px";
        commentEl.style.color = "#4b5563";
        commentsSection.appendChild(commentEl);
      }

      section.appendChild(commentsSection);
    }

    // 区切り線
    const hr = document.createElement("hr");
    hr.style.border = "none";
    hr.style.borderTop = "1px solid #e5e7eb";
    hr.style.marginTop = "20px";
    section.appendChild(hr);

    container.appendChild(section);
  }

  document.body.appendChild(container);

  // HTML to Canvas
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
  });

  document.body.removeChild(container);

  // Canvas to PDF
  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;

  const pdf = new jsPDF("p", "mm", "a4");
  let position = 0;

  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    0,
    position,
    imgWidth,
    imgHeight
  );
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      position,
      imgWidth,
      imgHeight
    );
    heightLeft -= pageHeight;
  }

  return pdf.output("blob");
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
