import { NextResponse } from "next/server";
import { generateAllSections } from "@/lib/coverLetter";
import type { JobAnalysis, ResumeProfile } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const resumeProfile: ResumeProfile | undefined = body?.resumeProfile;
  const jobAnalysis: JobAnalysis | undefined = body?.jobAnalysis;

  if (!resumeProfile || !jobAnalysis) {
    return NextResponse.json({ error: "resumeProfile과 jobAnalysis가 모두 필요합니다." }, { status: 400 });
  }

  const sections = await generateAllSections(resumeProfile, jobAnalysis);
  return NextResponse.json({ sections });
}
