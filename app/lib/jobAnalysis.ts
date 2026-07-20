import { callLLMForJSON, isLLMEnabled } from "@/lib/llm";
import type { JobAnalysis, JobSite } from "@/lib/types";

interface LLMJobAnalysisResult {
  company: string;
  title: string;
  mainTasks: string[];
  requiredQualifications: string[];
  preferredQualifications: string[];
  coreValues: string[];
  deadline: string | null;
}

export async function analyzeJobPosting(params: {
  text: string;
  site: JobSite;
  sourceUrl: string | null;
}): Promise<JobAnalysis> {
  const { text, site, sourceUrl } = params;

  if (isLLMEnabled()) {
    try {
      const result = await callLLMForJSON<LLMJobAnalysisResult>({
        system:
          "너는 채용 공고 원문을 구조화하는 도우미다. 반드시 순수 JSON 객체 하나만 출력한다. " +
          "설명 문장, 마크다운 코드블록 표시를 절대 포함하지 마라. " +
          "스키마: {company: string, title: string, mainTasks: string[], requiredQualifications: string[], " +
          "preferredQualifications: string[], coreValues: string[], deadline: string|null}. " +
          "coreValues는 공고에서 드러나는 인재상/핵심가치 키워드다. 원문에 없는 내용을 추측해서 채우지 마라.",
        user: `다음은 채용 공고 원문이다:\n\n${truncate(text, 12000)}`,
      });
      return { site, sourceUrl, rawText: text, analyzedBy: "llm", ...result };
    } catch {
      // LLM 실패 시 heuristic으로 폴백
    }
  }

  return { site, sourceUrl, rawText: text, analyzedBy: "heuristic", ...heuristicAnalyze(text) };
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) : text;
}

const SECTION_KEYWORDS: Record<string, keyof LLMJobAnalysisResult> = {
  "주요업무": "mainTasks",
  "담당업무": "mainTasks",
  "업무내용": "mainTasks",
  "자격요건": "requiredQualifications",
  "지원자격": "requiredQualifications",
  "필수사항": "requiredQualifications",
  "우대사항": "preferredQualifications",
  "우대조건": "preferredQualifications",
};

function heuristicAnalyze(text: string): LLMJobAnalysisResult {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const buckets: Record<string, string[]> = {
    mainTasks: [],
    requiredQualifications: [],
    preferredQualifications: [],
  };

  let currentBucket: keyof typeof buckets | null = null;
  for (const line of lines) {
    const matchedKeyword = Object.keys(SECTION_KEYWORDS).find((kw) => line.includes(kw));
    if (matchedKeyword && line.length < 20) {
      currentBucket = SECTION_KEYWORDS[matchedKeyword] as keyof typeof buckets;
      continue;
    }
    if (currentBucket && line.length > 1 && line.length < 200) {
      buckets[currentBucket].push(line.replace(/^[-*•\d.)\s]+/, ""));
      if (buckets[currentBucket].length >= 8) currentBucket = null;
    }
  }

  const deadlineMatch = text.match(
    /(\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}|상시\s*채용|채용\s*시\s*마감)/
  );

  return {
    company: "(자동 인식 실패: 직접 입력 필요)",
    title: lines[0]?.slice(0, 80) ?? "(제목 인식 실패)",
    mainTasks: buckets.mainTasks.slice(0, 8),
    requiredQualifications: buckets.requiredQualifications.slice(0, 8),
    preferredQualifications: buckets.preferredQualifications.slice(0, 8),
    coreValues: [],
    deadline: deadlineMatch?.[0] ?? null,
  };
}
