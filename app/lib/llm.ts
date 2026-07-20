import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

type Provider = "gemini" | "anthropic";

function activeProvider(): Provider | null {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

export function isLLMEnabled(): boolean {
  return activeProvider() !== null;
}

let anthropicClient: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

function extractJSON<T>(text: string): T {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("LLM 응답이 JSON 형식이 아닙니다.");
  }
  return JSON.parse(jsonMatch[0]) as T;
}

async function callAnthropic<T>(params: { system: string; user: string; maxTokens?: number }): Promise<T> {
  const response = await getAnthropicClient().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: params.maxTokens ?? 2000,
    system: params.system,
    messages: [{ role: "user", content: params.user }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("LLM 응답에서 텍스트를 찾지 못했습니다.");
  }
  return extractJSON<T>(textBlock.text);
}

async function callGemini<T>(params: { system: string; user: string; maxTokens?: number }): Promise<T> {
  const response = await getGeminiClient().models.generateContent({
    model: GEMINI_MODEL,
    contents: params.user,
    config: {
      systemInstruction: params.system,
      responseMimeType: "application/json",
      maxOutputTokens: params.maxTokens ?? 2000,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("LLM 응답에서 텍스트를 찾지 못했습니다.");
  }
  return extractJSON<T>(text);
}

/**
 * 프롬프트를 보내고 JSON 하나만 응답하도록 강제한다.
 * GEMINI_API_KEY가 있으면 Gemini를, 없고 ANTHROPIC_API_KEY만 있으면 Claude를 쓴다.
 * 둘 다 없으면 호출하지 않고 상위 로직이 heuristic 폴백을 쓰도록 에러를 던진다.
 */
export async function callLLMForJSON<T>(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const provider = activeProvider();
  if (!provider) {
    throw new Error("GEMINI_API_KEY 또는 ANTHROPIC_API_KEY가 설정되지 않았습니다.");
  }
  return provider === "gemini" ? callGemini<T>(params) : callAnthropic<T>(params);
}
