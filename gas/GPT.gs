/**
 * ふりかえり日記アプリ - GPT API連携
 * OpenAI APIを使用したAIフィードバック生成と音声認識
 */

/**
 * OpenAI APIキーを取得
 */
function getOpenAIKey() {
  return getSetting('OPENAI_API_KEY');
}

/**
 * GPTでフィードバックを生成
 */
function generateFeedback(studentName, title, content, category, mood) {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    return {
      success: false,
      error: 'OpenAI APIキーが設定されていません。設定シートにAPIキーを入力してください。'
    };
  }

  const model = getSetting('AI_MODEL') || 'gpt-4o-mini';

  const systemPrompt = `あなたは小学校の優しい先生です。児童の振り返り日記に対して、温かく励ましのフィードバックを返してください。

ルール:
- フィードバックは80文字以内で、温かく具体的に褒めてください
- 質問は50文字以内で、さらに深く考えるきっかけになる問いかけをしてください
- 小学生にもわかる簡単な言葉を使ってください
- 「先生は」「私は」などの一人称は使わないでください
- 児童の名前を呼んであげてください
- 絵文字は使わず、ひらがなを多めにしてください

回答は必ず以下のJSON形式で返してください:
{"feedback": "フィードバック文", "question": "質問文"}`;

  const userPrompt = `${studentName}さんの振り返り日記:
タイトル: ${title}
内容: ${content}
${category ? 'カテゴリ: ' + category : ''}
${mood ? '気分: ' + mood : ''}`;

  try {
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    const text = result.choices[0].message.content.trim();

    // JSON部分を抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        feedback: parsed.feedback || 'すばらしい振り返りですね！',
        question: parsed.question || 'もっと詳しく教えてくれますか？'
      };
    }

    return {
      success: true,
      feedback: text.substring(0, 80),
      question: 'もっと詳しく教えてくれますか？'
    };

  } catch (e) {
    Logger.log('GPT API Error: ' + e.toString());
    return { success: false, error: 'AIフィードバックの生成に失敗しました: ' + e.message };
  }
}

/**
 * 追記に対するフィードバックを生成
 */
function generateAdditionFeedback(studentName, originalContent, addition, question) {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    return { success: false, error: 'OpenAI APIキーが設定されていません' };
  }

  const model = getSetting('AI_MODEL') || 'gpt-4o-mini';

  const systemPrompt = `あなたは小学校の優しい先生です。児童が質問に答えて追記してくれた内容に対して、フィードバックを返してください。

ルール:
- 80文字以内で、答えてくれたことを具体的に褒めてください
- 小学生にもわかる簡単な言葉を使ってください
- 「先生は」「私は」などの一人称は使わないでください
- 追記の内容に触れて、共感や気づきを伝えてください`;

  const userPrompt = `${studentName}さんの元の振り返り:
${originalContent}

質問: ${question}

${studentName}さんの追記:
${addition}`;

  try {
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return {
      success: true,
      feedback: result.choices[0].message.content.trim()
    };

  } catch (e) {
    Logger.log('GPT Addition Feedback Error: ' + e.toString());
    return { success: false, error: 'フィードバック生成に失敗しました' };
  }
}

/**
 * 音声データをWhisper APIで文字起こし
 * クライアントからBase64エンコードされた音声データを受け取る
 */
function transcribeAudio(audioBase64, mimeType) {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    return { success: false, error: 'OpenAI APIキーが設定されていません' };
  }

  const whisperModel = getSetting('WHISPER_MODEL') || 'whisper-1';

  try {
    // Base64デコード
    const audioBlob = Utilities.newBlob(
      Utilities.base64Decode(audioBase64),
      mimeType || 'audio/webm',
      'audio.webm'
    );

    // Whisper APIにリクエスト
    const boundary = '----FormBoundary' + Utilities.getUuid();

    const requestBody = Utilities.newBlob('').getBytes();
    const parts = [];

    // model パート
    parts.push(
      '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="model"\r\n\r\n' +
      whisperModel + '\r\n'
    );

    // language パート
    parts.push(
      '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="language"\r\n\r\n' +
      'ja\r\n'
    );

    // response_format パート
    parts.push(
      '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="response_format"\r\n\r\n' +
      'json\r\n'
    );

    // file パート（バイナリ）
    const fileHeader =
      '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="file"; filename="audio.webm"\r\n' +
      'Content-Type: ' + (mimeType || 'audio/webm') + '\r\n\r\n';

    const fileFooter = '\r\n--' + boundary + '--\r\n';

    // テキストパートをバイト配列に変換
    const textParts = parts.join('');
    const textBytes = Utilities.newBlob(textParts).getBytes();
    const headerBytes = Utilities.newBlob(fileHeader).getBytes();
    const footerBytes = Utilities.newBlob(fileFooter).getBytes();
    const fileBytes = audioBlob.getBytes();

    // 全パートを結合
    const allBytes = [];
    textBytes.forEach(b => allBytes.push(b));
    headerBytes.forEach(b => allBytes.push(b));
    fileBytes.forEach(b => allBytes.push(b));
    footerBytes.forEach(b => allBytes.push(b));

    const response = UrlFetchApp.fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
      contentType: 'multipart/form-data; boundary=' + boundary,
      payload: allBytes,
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return {
      success: true,
      text: result.text
    };

  } catch (e) {
    Logger.log('Whisper API Error: ' + e.toString());
    return { success: false, error: '音声認識に失敗しました: ' + e.message };
  }
}

/**
 * APIキーのテスト
 */
function testOpenAIKey() {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    return { success: false, error: 'APIキーが設定されていません' };
  }

  try {
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/models', {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
      muteHttpExceptions: true
    });

    const status = response.getResponseCode();
    if (status === 200) {
      return { success: true, message: 'APIキーは有効です' };
    } else {
      const result = JSON.parse(response.getContentText());
      return { success: false, error: result.error?.message || '無効なAPIキーです' };
    }
  } catch (e) {
    return { success: false, error: '接続テストに失敗しました: ' + e.message };
  }
}
