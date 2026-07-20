"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getJobAnalysis,
  getResumeProfile,
  getCoverLetterSections,
  setCoverLetterSections,
} from "@/lib/clientState";
import type { CoverLetterSection, JobAnalysis, ResumeProfile } from "@/lib/types";

export default function GeneratePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [resumeProfile, setResumeProfileState] = useState<ResumeProfile | null>(null);
  const [jobAnalysis, setJobAnalysisState] = useState<JobAnalysis | null>(null);
  const [sections, setSections] = useState<CoverLetterSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<Record<string, string>>({});

  useEffect(() => {
    const resume = getResumeProfile();
    const job = getJobAnalysis();
    if (!resume || !job) {
      router.replace(!resume ? "/resume" : "/job");
      return;
    }
    // localStorage(외부 저장소)에서 읽은 값으로 마운트 시 1회만 상태를 채우는
    // 초기화 로직이라 반복 렌더를 유발하지 않는다.
    /* eslint-disable react-hooks/set-state-in-effect */
    setResumeProfileState(resume);
    setJobAnalysisState(job);

    const cached = getCoverLetterSections();
    if (cached && cached.length) {
      setSections(cached);
    } else {
      generateAll(resume, job);
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [router]);

  async function generateAll(resume: ResumeProfile, job: JobAnalysis) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/coverletter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeProfile: resume, jobAnalysis: job }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "자소서 생성에 실패했습니다.");
      setSections(data.sections);
      setCoverLetterSections(data.sections);
    } catch (e) {
      setError(e instanceof Error ? e.message : "자소서 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate(section: CoverLetterSection) {
    if (!resumeProfile || !jobAnalysis) return;
    setRegeneratingSection(section.section);
    setError(null);
    try {
      const res = await fetch("/api/coverletter/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeProfile,
          jobAnalysis,
          section: section.section,
          previousContent: section.content,
          instruction: instructions[section.section] || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "재생성에 실패했습니다.");
      const next = sections.map((s) => (s.section === section.section ? data.section : s));
      setSections(next);
      setCoverLetterSections(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "재생성에 실패했습니다.");
    } finally {
      setRegeneratingSection(null);
    }
  }

  function handleContentEdit(sectionName: string, content: string) {
    const next = sections.map((s) => (s.section === sectionName ? { ...s, content } : s));
    setSections(next);
    setCoverLetterSections(next);
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 클립보드 권한이 없는 환경에서는 조용히 무시
    }
  }

  if (!ready) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">자소서 생성</h1>
          <p className="mt-1 text-sm text-neutral-500">
            항목별 초안과 오른쪽 코멘트(작성 근거)를 확인하고, 마음에 들지 않으면 항목별로 다시 생성하세요.
          </p>
        </div>
        {resumeProfile && jobAnalysis && (
          <button
            onClick={() => generateAll(resumeProfile, jobAnalysis)}
            disabled={loading}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-neutral-700"
          >
            {loading ? "생성 중..." : "전체 다시 생성"}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-amber-600">{error}</p>}

      {loading && sections.length === 0 && (
        <p className="text-sm text-neutral-500">초안을 생성하고 있습니다...</p>
      )}

      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.section}
            className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 md:grid-cols-3"
          >
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{section.section}</h2>
                <span className="text-xs text-neutral-400">
                  {section.generatedBy === "llm" ? "AI 생성" : "간이 템플릿"} · v{section.version}
                </span>
              </div>
              <textarea
                value={section.content}
                onChange={(e) => handleContentEdit(section.section, e.target.value)}
                rows={8}
                className="w-full rounded-md border border-neutral-300 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
              />
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="재생성 시 반영할 지시사항 (예: 더 구체적인 사례로, 200자 줄여서 등)"
                  value={instructions[section.section] ?? ""}
                  onChange={(e) =>
                    setInstructions((prev) => ({ ...prev, [section.section]: e.target.value }))
                  }
                  className="min-w-[220px] flex-1 rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-950"
                />
                <button
                  onClick={() => handleRegenerate(section)}
                  disabled={regeneratingSection === section.section}
                  className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                >
                  {regeneratingSection === section.section ? "재생성 중..." : "이 항목 재생성"}
                </button>
                <button
                  onClick={() => copyToClipboard(section.content)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700"
                >
                  복사
                </button>
              </div>
            </div>

            <aside className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <p className="mb-1 font-semibold">💬 왜 이렇게 썼나요?</p>
              <p>{section.reasoning}</p>
            </aside>
          </div>
        ))}
      </div>
    </div>
  );
}
