import { callLLMForJSON, isLLMEnabled } from "@/lib/llm";
import {
  COVER_LETTER_SECTIONS,
  type CoverLetterSection,
  type CoverLetterSectionName,
  type JobAnalysis,
  type ResumeProfile,
} from "@/lib/types";

interface LLMSectionResult {
  content: string;
  reasoning: string;
}

function buildContextBlock(resume: ResumeProfile, job: JobAnalysis): string {
  const s = resume.student;
  return [
    `[지원자 학사 정보]`,
    `이름: ${s.name} / 학번: ${s.studentId} / ${s.college} ${s.department} / ${s.grade} (${s.status})`,
    `학점: ${s.gpa}/${s.gpaScale} / 어학: ${s.englishTest.name} ${s.englishTest.score}`,
    `자격증: ${s.certifications.join(", ") || "없음"}`,
    `활동/경력: ${s.activities.join(", ") || "없음"}`,
    `수상: ${s.awards.join(", ") || "없음"}`,
    ``,
    `[이력서 자유기술 원문(발췌)]`,
    resume.rawResumeText.slice(0, 3000),
    ``,
    `[지원 공고 분석 결과]`,
    `회사: ${job.company} / 공고 제목: ${job.title}`,
    `주요업무: ${job.mainTasks.join(" / ") || "정보 없음"}`,
    `자격요건: ${job.requiredQualifications.join(" / ") || "정보 없음"}`,
    `우대사항: ${job.preferredQualifications.join(" / ") || "정보 없음"}`,
    `인재상/핵심가치: ${job.coreValues.join(" / ") || "정보 없음"}`,
  ].join("\n");
}

const SECTION_GUIDE: Record<CoverLetterSectionName, string> = {
  "지원동기": "왜 이 회사/직무에 지원하는지, 공고의 업무·인재상과 지원자 경험의 접점을 중심으로.",
  "성장과정": "지원자의 학업/활동 경험에서 드러나는 가치관과 성장 스토리를 직무와 연결해서.",
  "강점(직무역량)": "공고의 자격/우대 요건과 가장 잘 맞는 지원자의 역량·경험을 근거와 함께.",
  "입사 후 포부": "입사 후 어떤 기여를 하고 싶은지, 공고의 주요업무와 연결해서 구체적으로.",
};

export async function generateAllSections(
  resume: ResumeProfile,
  job: JobAnalysis
): Promise<CoverLetterSection[]> {
  const results: CoverLetterSection[] = [];
  for (const section of COVER_LETTER_SECTIONS) {
    results.push(await generateSection(section, resume, job));
  }
  return results;
}

export async function generateSection(
  section: CoverLetterSectionName,
  resume: ResumeProfile,
  job: JobAnalysis,
  options?: { previousContent?: string; instruction?: string }
): Promise<CoverLetterSection> {
  const context = buildContextBlock(resume, job);

  if (isLLMEnabled()) {
    try {
      const regenNote = options?.previousContent
        ? `\n\n[이전 초안]\n${options.previousContent}\n\n[재작성 지시사항]\n${
            options.instruction || "더 구체적인 사례를 들어 다시 작성해줘."
          }`
        : "";

      const result = await callLLMForJSON<LLMSectionResult>({
        system:
          "너는 한국 대학생의 자기소개서 작성을 돕는 도우미다. " +
          "반드시 순수 JSON 객체 하나만 출력한다: {content: string, reasoning: string}. " +
          "content는 '" + section + "' 항목에 대한 자기소개서 본문(600~800자, 존댓말, 1인칭)이다. " +
          "이력서에 명시되지 않은 경력/사실을 지어내지 마라. " +
          "reasoning은 왜 이렇게 썼는지 - 공고의 어떤 요건과 이력서의 어떤 경험을 연결했는지 - 3문장 이내로 설명한다.",
        user: `작성할 항목: ${section}\n작성 가이드: ${SECTION_GUIDE[section]}\n\n${context}${regenNote}`,
        maxTokens: 1200,
      });
      return {
        section,
        content: result.content,
        reasoning: result.reasoning,
        generatedBy: "llm",
        version: options?.previousContent ? 2 : 1,
      };
    } catch {
      // heuristic 폴백
    }
  }

  return heuristicSection(section, resume, job, options);
}

function heuristicSection(
  section: CoverLetterSectionName,
  resume: ResumeProfile,
  job: JobAnalysis,
  options?: { previousContent?: string; instruction?: string }
): CoverLetterSection {
  const s = resume.student;
  const topRequirement = job.requiredQualifications[0] ?? job.mainTasks[0] ?? "귀사가 제시한 직무 요건";
  const topActivity = s.activities[0] ?? "학과 활동";
  const topCert = s.certifications[0];

  const templates: Record<CoverLetterSectionName, string> = {
    "지원동기": `${job.company !== "(자동 인식 실패: 직접 입력 필요)" ? job.company : "귀사"}의 '${job.title}' 공고를 보고 지원하게 되었습니다. 서강대학교 ${s.department}에서 학업을 이어오며 ${topActivity} 활동을 통해 ${topRequirement}와 관련된 역량을 쌓아왔고, 이를 실무에서 발휘하고 싶어 지원하게 되었습니다.`,
    "성장과정": `서강대학교 ${s.department}에 재학하며 ${topActivity}을(를) 통해 꾸준히 성장해왔습니다. 학점 ${s.gpa}/${s.gpaScale}을 유지하며 학업과 활동을 병행했고, 이 과정에서 책임감과 문제해결 능력을 키울 수 있었습니다.`,
    "강점(직무역량)": `저의 강점은 ${topActivity} 경험과${topCert ? ` ${topCert} 자격 취득` : ""}을 통해 다져온 실무 감각입니다. 특히 공고에서 요구하는 '${topRequirement}'와 관련해 직접 경험을 쌓아왔다는 점이 강점이라고 생각합니다.`,
    "입사 후 포부": `입사 후에는 ${job.mainTasks[0] ?? "맡은 업무"}에 빠르게 적응하여 팀에 기여하고, 장기적으로는 ${job.coreValues[0] ?? "회사가 추구하는 가치"}를 실현하는 데 힘을 보태고 싶습니다.`,
  };

  const reasoning = [
    `[근거] 학사정보(${s.department}, 학점 ${s.gpa}/${s.gpaScale})와 활동 경험(${topActivity})을`,
    `공고 요건(${topRequirement})과 연결해 작성했습니다.`,
    job.analyzedBy === "heuristic"
      ? " ⚠️ 공고 분석이 LLM 없이 키워드 기반으로 이뤄져 정확도가 낮을 수 있습니다."
      : "",
    options?.previousContent ? " (재생성 요청 반영: 간이 템플릿이라 지시사항은 일부만 반영됩니다.)" : "",
  ].join("");

  return {
    section,
    content: templates[section],
    reasoning,
    generatedBy: "heuristic",
    version: options?.previousContent ? 2 : 1,
  };
}
