import { NextResponse } from "next/server";
import { generateSection } from "@/lib/coverLetter";
import { COVER_LETTER_SECTIONS, type CoverLetterSectionName, type JobAnalysis, type ResumeProfile } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const resumeProfile: ResumeProfile | undefined = body?.resumeProfile;
  const jobAnalysis: JobAnalysis | undefined = body?.jobAnalysis;
  const section: CoverLetterSectionName | undefined = body?.section;
  const previousContent: string | undefined = body?.previousContent;
  const instruction: string | undefined = body?.instruction;

  if (!resumeProfile || !jobAnalysis || !section) {
    return NextResponse.json(
      { error: "resumeProfile, jobAnalysis, section이 모두 필요합니다." },
      { status: 400 }
    );
  }

  if (!COVER_LETTER_SECTIONS.includes(section)) {
    return NextResponse.json({ error: "알 수 없는 항목입니다." }, { status: 400 });
  }

  const result = await generateSection(section, resumeProfile, jobAnalysis, {
    previousContent,
    instruction,
  });
  return NextResponse.json({ section: result });
}
