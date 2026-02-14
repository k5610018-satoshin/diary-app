/**
 * ふりかえり日記アプリ - Google Apps Script版
 * メインサーバーサイドコード
 *
 * スプレッドシートをデータベースとして使用し、
 * 児童の振り返り・教師のコメント機能を提供する
 */

// ===== 定数 =====
const TEACHER_PASSWORD = 'teacher2024';
const SHEET_NAMES = {
  STUDENTS: '児童マスタ',
  REFLECTIONS: '振り返り',
  COMMENTS: '先生コメント',
  SETTINGS: '設定'
};

// ===== Web App エントリポイント =====

/**
 * GETリクエスト処理 - HTMLページの表示
 */
function doGet(e) {
  const page = e.parameter.page || 'student';

  let template;
  if (page === 'teacher') {
    template = HtmlService.createTemplateFromFile('TeacherView');
  } else {
    template = HtmlService.createTemplateFromFile('StudentView');
  }

  return template.evaluate()
    .setTitle('ふりかえり日記')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * HTMLファイルのインクルード用ヘルパー
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ===== 初期セットアップ =====

/**
 * スプレッドシートの初期セットアップ
 * メニューから実行、またはアプリ初回起動時に自動実行
 */
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 児童マスタシート
  let studentsSheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  if (!studentsSheet) {
    studentsSheet = ss.insertSheet(SHEET_NAMES.STUDENTS);
    studentsSheet.appendRow(['ID', '名前', 'パスワード', 'クラス', '登録日']);
    studentsSheet.getRange('1:1').setFontWeight('bold').setBackground('#4CAF50').setFontColor('white');
    studentsSheet.setColumnWidths(1, 5, 120);
  }

  // 振り返りシート
  let reflectionsSheet = ss.getSheetByName(SHEET_NAMES.REFLECTIONS);
  if (!reflectionsSheet) {
    reflectionsSheet = ss.insertSheet(SHEET_NAMES.REFLECTIONS);
    reflectionsSheet.appendRow([
      'ID', '児童ID', '児童名', 'タイトル', '内容',
      '作成日', '更新日', 'AIフィードバック', 'AI質問',
      '追記', 'カテゴリ', '気分'
    ]);
    reflectionsSheet.getRange('1:1').setFontWeight('bold').setBackground('#2196F3').setFontColor('white');
    reflectionsSheet.setColumnWidths(1, 12, 150);
  }

  // 先生コメントシート
  let commentsSheet = ss.getSheetByName(SHEET_NAMES.COMMENTS);
  if (!commentsSheet) {
    commentsSheet = ss.insertSheet(SHEET_NAMES.COMMENTS);
    commentsSheet.appendRow(['ID', '振り返りID', '先生名', 'コメント内容', '作成日']);
    commentsSheet.getRange('1:1').setFontWeight('bold').setBackground('#FF9800').setFontColor('white');
    commentsSheet.setColumnWidths(1, 5, 150);
  }

  // 設定シート
  let settingsSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SHEET_NAMES.SETTINGS);
    settingsSheet.appendRow(['キー', '値']);
    settingsSheet.appendRow(['OPENAI_API_KEY', '']);
    settingsSheet.appendRow(['TEACHER_PASSWORD', TEACHER_PASSWORD]);
    settingsSheet.appendRow(['AI_MODEL', 'gpt-4o-mini']);
    settingsSheet.appendRow(['WHISPER_MODEL', 'whisper-1']);
    settingsSheet.appendRow(['SCHOOL_NAME', '']);
    settingsSheet.appendRow(['CLASS_NAME', '']);
    settingsSheet.getRange('1:1').setFontWeight('bold').setBackground('#9C27B0').setFontColor('white');
    settingsSheet.setColumnWidth(1, 200);
    settingsSheet.setColumnWidth(2, 400);
  }

  // デフォルトのSheet1を削除（あれば）
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('シート1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  return { success: true, message: 'セットアップが完了しました' };
}

/**
 * スプレッドシートを開いたときにメニューを追加
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ふりかえり日記')
    .addItem('初期セットアップ', 'setupSpreadsheet')
    .addItem('アプリを開く（児童用）', 'openStudentApp')
    .addItem('アプリを開く（先生用）', 'openTeacherApp')
    .addSeparator()
    .addItem('データ集計', 'showSummary')
    .addToUi();
}

function openStudentApp() {
  const url = ScriptApp.getService().getUrl();
  const html = HtmlService.createHtmlOutput(
    `<script>window.open("${url}?page=student", "_blank");google.script.host.close();</script>`
  );
  SpreadsheetApp.getUi().showModalDialog(html, 'アプリを開いています...');
}

function openTeacherApp() {
  const url = ScriptApp.getService().getUrl();
  const html = HtmlService.createHtmlOutput(
    `<script>window.open("${url}?page=teacher", "_blank");google.script.host.close();</script>`
  );
  SpreadsheetApp.getUi().showModalDialog(html, 'アプリを開いています...');
}

// ===== 設定管理 =====

/**
 * 設定値を取得
 */
function getSetting(key) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return data[i][1];
    }
  }
  return null;
}

/**
 * 設定値を保存
 */
function setSetting(key, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return true;
    }
  }
  // キーが存在しない場合は新規追加
  sheet.appendRow([key, value]);
  return true;
}

// ===== 認証 =====

/**
 * 児童のログイン
 */
function studentLogin(name, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  if (!sheet) {
    setupSpreadsheet();
    return studentLogin(name, password);
  }

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === name && data[i][2] === password) {
      return {
        success: true,
        user: {
          id: data[i][0],
          name: data[i][1],
          classId: data[i][3]
        }
      };
    }
  }
  return { success: false, message: '名前またはパスワードが違います' };
}

/**
 * 児童の新規登録
 */
function registerStudent(name, password, classId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  if (!sheet) {
    setupSpreadsheet();
    sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  }

  // 名前の重複チェック
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === name) {
      return { success: false, message: 'その名前は既に登録されています' };
    }
  }

  const id = Utilities.getUuid();
  const now = new Date();
  sheet.appendRow([id, name, password, classId || '', Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss')]);

  return {
    success: true,
    user: { id: id, name: name, classId: classId || '' }
  };
}

/**
 * 先生のログイン
 */
function teacherLogin(password) {
  const storedPassword = getSetting('TEACHER_PASSWORD') || TEACHER_PASSWORD;
  if (password === storedPassword) {
    return { success: true };
  }
  return { success: false, message: 'パスワードが違います' };
}

// ===== データ集計 =====

/**
 * データの集計表示
 */
function showSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reflections = ss.getSheetByName(SHEET_NAMES.REFLECTIONS);
  const students = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  const comments = ss.getSheetByName(SHEET_NAMES.COMMENTS);

  const rCount = reflections ? Math.max(0, reflections.getLastRow() - 1) : 0;
  const sCount = students ? Math.max(0, students.getLastRow() - 1) : 0;
  const cCount = comments ? Math.max(0, comments.getLastRow() - 1) : 0;

  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>📊 ふりかえり日記 データ集計</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr style="background: #f5f5f5;">
          <td style="padding: 12px; border: 1px solid #ddd;">👦 登録児童数</td>
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${sCount}人</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd;">📝 振り返り総数</td>
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${rCount}件</td>
        </tr>
        <tr style="background: #f5f5f5;">
          <td style="padding: 12px; border: 1px solid #ddd;">💬 先生コメント数</td>
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${cCount}件</td>
        </tr>
      </table>
    </div>
  `).setWidth(400).setHeight(250);

  SpreadsheetApp.getUi().showModalDialog(html, 'データ集計');
}
