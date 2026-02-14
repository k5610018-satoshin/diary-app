/**
 * ふりかえり日記アプリ - データベース操作
 * Google スプレッドシートをDBとして使用
 */

// ===== 振り返り（Reflections）CRUD =====

/**
 * 振り返りを保存
 */
function saveReflection(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.REFLECTIONS);
  if (!sheet) {
    setupSpreadsheet();
    sheet = ss.getSheetByName(SHEET_NAMES.REFLECTIONS);
  }

  const id = data.id || Utilities.getUuid();
  const now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');

  // 既存の振り返りを検索（更新の場合）
  if (data.id) {
    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === data.id) {
        // 更新
        sheet.getRange(i + 1, 4).setValue(data.title || allData[i][3]);
        sheet.getRange(i + 1, 5).setValue(data.content || allData[i][4]);
        sheet.getRange(i + 1, 7).setValue(now);
        if (data.aiFeedback) sheet.getRange(i + 1, 8).setValue(data.aiFeedback);
        if (data.aiQuestion) sheet.getRange(i + 1, 9).setValue(data.aiQuestion);
        if (data.addition) {
          const existing = allData[i][9] || '';
          const separator = existing ? '\n---\n' : '';
          sheet.getRange(i + 1, 10).setValue(existing + separator + data.addition);
        }
        if (data.category) sheet.getRange(i + 1, 11).setValue(data.category);
        if (data.mood) sheet.getRange(i + 1, 12).setValue(data.mood);

        return { success: true, id: data.id };
      }
    }
  }

  // 新規作成
  sheet.appendRow([
    id,
    data.studentId,
    data.studentName,
    data.title || '',
    data.content || '',
    now,
    now,
    data.aiFeedback || '',
    data.aiQuestion || '',
    data.addition || '',
    data.category || '',
    data.mood || ''
  ]);

  return { success: true, id: id };
}

/**
 * 児童の振り返り一覧を取得
 */
function getReflectionsByStudent(studentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.REFLECTIONS);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getDataRange().getValues();
  const reflections = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === studentId) {
      const comments = getCommentsByReflection(data[i][0]);
      reflections.push({
        id: data[i][0],
        studentId: data[i][1],
        studentName: data[i][2],
        title: data[i][3],
        content: data[i][4],
        createdAt: data[i][5],
        updatedAt: data[i][6],
        aiFeedback: data[i][7],
        aiQuestion: data[i][8],
        addition: data[i][9],
        category: data[i][10],
        mood: data[i][11],
        teacherComments: comments
      });
    }
  }

  // 日付順（新しい順）でソート
  reflections.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return reflections;
}

/**
 * 全ての振り返りを取得（教師用）
 */
function getAllReflections(filters) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.REFLECTIONS);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getDataRange().getValues();
  const reflections = [];

  for (let i = 1; i < data.length; i++) {
    const reflection = {
      id: data[i][0],
      studentId: data[i][1],
      studentName: data[i][2],
      title: data[i][3],
      content: data[i][4],
      createdAt: data[i][5],
      updatedAt: data[i][6],
      aiFeedback: data[i][7],
      aiQuestion: data[i][8],
      addition: data[i][9],
      category: data[i][10],
      mood: data[i][11],
      teacherComments: getCommentsByReflection(data[i][0])
    };

    // フィルタ適用
    if (filters) {
      if (filters.studentName && !reflection.studentName.includes(filters.studentName)) continue;
      if (filters.dateFrom && new Date(reflection.createdAt) < new Date(filters.dateFrom)) continue;
      if (filters.dateTo && new Date(reflection.createdAt) > new Date(filters.dateTo + ' 23:59:59')) continue;
      if (filters.category && reflection.category !== filters.category) continue;
      if (filters.hasComment === 'yes' && reflection.teacherComments.length === 0) continue;
      if (filters.hasComment === 'no' && reflection.teacherComments.length > 0) continue;
    }

    reflections.push(reflection);
  }

  // 日付順（新しい順）でソート
  reflections.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return reflections;
}

/**
 * 振り返りを1件取得
 */
function getReflection(reflectionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.REFLECTIONS);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === reflectionId) {
      return {
        id: data[i][0],
        studentId: data[i][1],
        studentName: data[i][2],
        title: data[i][3],
        content: data[i][4],
        createdAt: data[i][5],
        updatedAt: data[i][6],
        aiFeedback: data[i][7],
        aiQuestion: data[i][8],
        addition: data[i][9],
        category: data[i][10],
        mood: data[i][11],
        teacherComments: getCommentsByReflection(data[i][0])
      };
    }
  }
  return null;
}

/**
 * 振り返りを削除
 */
function deleteReflection(reflectionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.REFLECTIONS);
  if (!sheet) return { success: false };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === reflectionId) {
      sheet.deleteRow(i + 1);
      // 関連コメントも削除
      deleteCommentsByReflection(reflectionId);
      return { success: true };
    }
  }
  return { success: false, message: '振り返りが見つかりません' };
}

// ===== 先生コメント CRUD =====

/**
 * 先生のコメントを保存
 */
function saveTeacherComment(reflectionId, teacherName, content) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.COMMENTS);
  if (!sheet) {
    setupSpreadsheet();
    sheet = ss.getSheetByName(SHEET_NAMES.COMMENTS);
  }

  const id = Utilities.getUuid();
  const now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');

  sheet.appendRow([id, reflectionId, teacherName, content, now]);

  return { success: true, id: id };
}

/**
 * 振り返りに紐づくコメントを取得
 */
function getCommentsByReflection(reflectionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.COMMENTS);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getDataRange().getValues();
  const comments = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === reflectionId) {
      comments.push({
        id: data[i][0],
        reflectionId: data[i][1],
        teacherName: data[i][2],
        content: data[i][3],
        createdAt: data[i][4]
      });
    }
  }

  comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return comments;
}

/**
 * 振り返りに紐づくコメントを全削除
 */
function deleteCommentsByReflection(reflectionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.COMMENTS);
  if (!sheet || sheet.getLastRow() <= 1) return;

  const data = sheet.getDataRange().getValues();
  // 下から削除（行番号がずれないように）
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === reflectionId) {
      sheet.deleteRow(i + 1);
    }
  }
}

/**
 * コメントを削除
 */
function deleteComment(commentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.COMMENTS);
  if (!sheet) return { success: false };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === commentId) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

// ===== 児童管理 =====

/**
 * 全児童を取得
 */
function getAllStudents() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getDataRange().getValues();
  const students = [];

  for (let i = 1; i < data.length; i++) {
    students.push({
      id: data[i][0],
      name: data[i][1],
      classId: data[i][3],
      registeredAt: data[i][4]
    });
  }

  return students;
}

/**
 * 児童ごとの振り返り数を取得
 */
function getReflectionCountByStudent() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.REFLECTIONS);
  if (!sheet || sheet.getLastRow() <= 1) return {};

  const data = sheet.getDataRange().getValues();
  const counts = {};

  for (let i = 1; i < data.length; i++) {
    const studentName = data[i][2];
    counts[studentName] = (counts[studentName] || 0) + 1;
  }

  return counts;
}

/**
 * CSVエクスポート用データを取得
 */
function getExportData() {
  const reflections = getAllReflections();
  const rows = [['日付', '児童名', 'タイトル', '内容', '追記', 'AIフィードバック', 'AI質問', '先生コメント', 'カテゴリ', '気分']];

  reflections.forEach(r => {
    const commentTexts = r.teacherComments.map(c => `${c.teacherName}: ${c.content}`).join(' / ');
    rows.push([
      r.createdAt,
      r.studentName,
      r.title,
      r.content,
      r.addition || '',
      r.aiFeedback || '',
      r.aiQuestion || '',
      commentTexts,
      r.category || '',
      r.mood || ''
    ]);
  });

  return rows;
}
