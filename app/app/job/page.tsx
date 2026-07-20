"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getResumeProfile, setJobAnalysis } from "@/lib/clientState";
import type { JobAnalysis } from "@/lib/types";

export default function JobPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsManualPaste, setNeedsManualPaste] = useState(false);
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);

  useEffect(() => {
    if (!getResumeProfile()) {
      router.replace("/resume");
      return;
    }
    // localStorage(외부 저장소)에서 읽은 값에 따라 마운트 후 1회만 렌더를 활성화하는
    // 게이트 플래그라 반복 렌더를 유발하지 않는다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, [router]);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setNeedsManualPaste(false);
    try {
      const res = await fetch("/api/job/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url || undefined, rawText: pastedText || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "공고 분석에 실패했습니다.");
        setNeedsManualPaste(Boolean(data.needsManualPaste));
        return;
      }
      setAnalysis(data.analysis);
    } catch {
      setError("공고 분석 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    if (!analysis) return;
    setJobAnalysis(analysis);
    router.push("/generate");
  }

  if (!ready) return null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 sm:text-xl">
          공고 분석
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          현재는 사람인(saramin.co.kr), 잡코리아(jobkorea.co.kr) 공고 링크만 지원합니다. 다른 사이트이거나
          자동 수집이 실패하면 공고 본문을 직접 붙여넣어 주세요.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:p-5">
        <div>
          <label className="mb-1 block text-sm font-medium">공고 URL (사람인 / 잡코리아)</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.saramin.co.kr/zf_user/jobs/relay/view?..."
            className="w-full rounded-md border border-neutral-300 px-3 py-2.5 text-base dark:border-neutral-700 dark:bg-neutral-950"
          />
        </div>
        <div className="text-center text-xs text-neutral-400">또는</div>
        <div>
          <label className="mb-1 block text-sm font-medium">공고 본문 직접 붙여넣기</label>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={6}
            placeholder="모집 부문, 주요업무, 자격요건, 우대사항 등을 포함한 공고 본문을 붙여넣어 주세요."
            className="w-full rounded-md border border-neutral-300 px-3 py-2.5 text-base dark:border-neutral-700 dark:bg-neutral-950"
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || (!url && !pastedText)}
          className="w-full rounded-md bg-red-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40 sm:w-auto"
        >
          {loading ? "분석 중..." : "공고 분석하기"}
        </button>
        {error && (
          <p className="text-sm text-amber-600">
            {error}
            {needsManualPaste && " (위 '공고 본문 직접 붙여넣기'란을 사용해주세요.)"}
          </p>
        )}
      </div>

      {analysis && (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">분석 결과</h2>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
                {analysis.analyzedBy === "llm" ? "AI 분석" : "간이(키워드) 분석"}
              </span>
            </div>
            {analysis.analyzedBy === "heuristic" && (
              <p className="mb-3 text-xs text-amber-600">
                ⚠️ GEMINI_API_KEY / ANTHROPIC_API_KEY가 설정되지 않아 키워드 기반 간이 분석 결과입니다.
                정확도가 낮을 수 있으니 필요하면 항목을 직접 수정하세요.
              </p>
            )}
            <dl className="space-y-3 text-sm">
              <Row label="회사" value={analysis.company} />
              <Row label="공고 제목" value={analysis.title} />
              <ListRow label="주요업무" items={analysis.mainTasks} />
              <ListRow label="자격요건" items={analysis.requiredQualifications} />
              <ListRow label="우대사항" items={analysis.preferredQualifications} />
              <ListRow label="인재상/핵심가치" items={analysis.coreValues} />
              <Row label="마감일" value={analysis.deadline ?? "정보 없음"} />
            </dl>
          </div>
          <button
            onClick={handleContinue}
            className="w-full rounded-md bg-red-700 px-4 py-2.5 text-sm font-medium text-white sm:w-auto"
          >
            다음 단계: 자소서 생성 →
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="sm:flex sm:gap-3">
      <dt className="text-xs text-neutral-400 sm:w-28 sm:shrink-0 sm:text-sm">{label}</dt>
      <dd className="text-neutral-800 dark:text-neutral-200">{value}</dd>
    </div>
  );
}

function ListRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="sm:flex sm:gap-3">
      <dt className="text-xs text-neutral-400 sm:w-28 sm:shrink-0 sm:text-sm">{label}</dt>
      <dd className="text-neutral-800 dark:text-neutral-200">
        {items.length ? (
          <ul className="list-inside list-disc space-y-0.5">
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          "정보 없음"
        )}
      </dd>
    </div>
  );
}
