import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function isLLMEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

/**
 * 프롬프트를 보내고 JSON 하나만 응답하도록 강제한다.
 * ANTHROPIC_API_KEY가 없으면 호출하지 않고 상위 로직이 heuristic 폴백을 쓰도록 에러를 던진다.
 */
export async function callLLMForJSON<T>(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  if (!isLLMEnabled()) {
    throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");
  }

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: params.maxTokens ?? 2000,
    system: params.system,
    messages: [{ role: "user", content: params.user }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("LLM 응답에서 텍스트를 찾지 못했습니다.");
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("LLM 응답이 JSON 형식이 아닙니다.");
  }

  return JSON.parse(jsonMatch[0]) as T;
}
