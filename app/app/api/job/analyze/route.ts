import { NextResponse } from "next/server";
import { fetchJobPostingText, JobFetchError, UnsupportedJobSiteError, detectJobSite } from "@/lib/jobSource";
import { analyzeJobPosting } from "@/lib/jobAnalysis";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const url: string | undefined = body?.url?.trim() || undefined;
  const pastedText: string | undefined = body?.rawText?.trim() || undefined;

  if (!url && !pastedText) {
    return NextResponse.json({ error: "공고 URL 또는 본문 텍스트 중 하나는 입력해야 합니다." }, { status: 400 });
  }

  try {
    if (pastedText) {
      const site = url ? detectJobSite(url) : null;
      const analysis = await analyzeJobPosting({
        text: pastedText,
        site: site ?? "saramin",
        sourceUrl: url ?? null,
      });
      return NextResponse.json({ analysis });
    }

    const { site, text } = await fetchJobPostingText(url!);
    const analysis = await analyzeJobPosting({ text, site, sourceUrl: url! });
    return NextResponse.json({ analysis });
  } catch (err) {
    if (err instanceof UnsupportedJobSiteError || err instanceof JobFetchError) {
      return NextResponse.json({ error: err.message, needsManualPaste: true }, { status: 422 });
    }
    const message = err instanceof Error ? err.message : "공고 분석에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
