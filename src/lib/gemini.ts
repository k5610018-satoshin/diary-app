import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini 3 Flash モデルを使用
const GEMINI_MODEL = "gemini-3-flash-preview";

const DIARY_FEEDBACK_PROMPT = `あなたは小学生の日記に優しくコメントするAIアシスタントです。
児童が書いた日記に対して、以下の2つを日本語で返してください。

重要なルール:
- 「先生」「私」などの1人称は絶対に使わないでください
- 主語を省略するか、「〇〇さん」のように児童の呼びかけを使ってください
- 温かく励ます口調で書いてください

1. 肯定的なフィードバック（80文字以内）
   - 具体的に褒める（例：「すごい発見だね！」「よく気づいたね！」）
   - 努力を認める
   - 子どもが嬉しくなる言葉
   - 日記の内容に触れて共感を示す

2. 深堀りの問い（50文字以内）
   - 感情をより深く聞く
   - 詳細を聞いて思考を促す
   - 次の行動や気づきを促す

必ず以下のJSON形式のみで返答してください（説明文は不要）:
{"feedback": "肯定的なフィードバック", "question": "深堀りの問い"}

日記内容:
`;

const COMMENT_FEEDBACK_PROMPT = `あなたは小学生の日記に優しくコメントするAIアシスタントです。
児童が日記の追記（質問への回答）を書きました。
この追記に対して、以下の2つを日本語で返してください。

重要なルール:
- 「先生」「私」などの1人称は絶対に使わないでください
- 主語を省略するか、「〇〇さん」のように児童の呼びかけを使ってください
- 温かく励ます口調で書いてください

1. 追記へのフィードバック（80文字以内）
   - 回答してくれたことを褒める（例：「教えてくれてありがとう！」）
   - 内容を具体的に認める
   - さらに考えを深めた点を評価する

2. 次の深堀りの問い（50文字以内）
   - さらに思考を深める質問
   - 別の視点からの問いかけ
   - 成長や学びにつながる問い

必ず以下のJSON形式のみで返答してください（説明文は不要）:
{"feedback": "追記へのフィードバック", "question": "次の深堀りの問い"}

元の日記:
{originalContent}

前回の質問:
{previousQuestion}

児童の追記（回答）:
{additionContent}
`;

export interface GeminiFeedbackResponse {
  feedback: string;
  question: string;
}

export async function generateFeedback(
  apiKey: string,
  diaryContent: string
): Promise<GeminiFeedbackResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = DIARY_FEEDBACK_PROMPT + diaryContent;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid response format from Gemini");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    feedback: parsed.feedback || "素敵な日記ですね！",
    question: parsed.question || "その時どんな気持ちでしたか？",
  };
}

export async function generateAdditionFeedback(
  apiKey: string,
  originalContent: string,
  previousQuestion: string,
  additionContent: string
): Promise<GeminiFeedbackResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = COMMENT_FEEDBACK_PROMPT
    .replace("{originalContent}", originalContent)
    .replace("{previousQuestion}", previousQuestion)
    .replace("{additionContent}", additionContent);

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid response format from Gemini");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    feedback: parsed.feedback || "追記してくれてありがとう！",
    question: parsed.question || "他に気づいたことはありますか？",
  };
}
