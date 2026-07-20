"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setResumeProfile } from "@/lib/clientState";
import type { MockStudent } from "@/lib/types";

interface StudentSummary {
  studentId: string;
  name: string;
  department: string;
  grade: string;
}

export default function ResumePage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rawText, setRawText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [matchedStudent, setMatchedStudent] = useState<MockStudent | null>(null);
  const [manualStudentId, setManualStudentId] = useState<string>("");

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => setStudents(data.students ?? []));
  }, []);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setMatchedStudent(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/resume/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "업로드에 실패했습니다.");
      setRawText(data.rawText);
      setFileName(data.fileName);
      setMatchedStudent(data.matchedStudent);
      if (!data.matchedStudent) {
        setError(
          "이력서에서 가상 DB에 등록된 학번/이름을 자동으로 찾지 못했습니다. 아래에서 데모용 학생을 직접 선택해주세요."
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleManualSelect(studentId: string) {
    setManualStudentId(studentId);
    if (!studentId) {
      setMatchedStudent(null);
      return;
    }
    const student = students.find((s) => s.studentId === studentId);
    if (!student) return;
    // 목록 API는 요약 정보만 주므로, 상세 정보는 전체 학생 리스트를 다시 파싱하지 않고
    // 클라이언트에서 studentId만 넘기고 서버가 채우도록 재요청한다.
    const res = await fetch(`/api/students/${studentId}`);
    if (res.ok) {
      const data = await res.json();
      setMatchedStudent(data.student);
    }
  }

  function handleContinue() {
    if (!matchedStudent || rawText === null) return;
    setResumeProfile({ student: matchedStudent, rawResumeText: rawText, sourceFileName: fileName });
    router.push("/job");
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 sm:text-xl">
          이력서 업로드
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          PDF / DOCX / TXT 파일을 올려주세요. 학사 정보는 실제 학교 시스템이 아니라 데모용 가상 학생
          10명 DB에서만 조회됩니다.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:p-5">
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium dark:file:bg-neutral-800"
        />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full rounded-md bg-red-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40 sm:w-auto"
        >
          {loading ? "분석 중..." : "업로드 및 분석"}
        </button>
        {error && <p className="text-sm text-amber-600">{error}</p>}
      </div>

      {rawText !== null && (
        <div className="space-y-4">
          {!matchedStudent && (
            <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950">
              <p className="font-medium">데모용 학생 직접 선택</p>
              <select
                value={manualStudentId}
                onChange={(e) => handleManualSelect(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-base dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="">선택하세요</option>
                {students.map((s) => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.name} ({s.studentId}) · {s.department} · {s.grade}
                  </option>
                ))}
              </select>
            </div>
          )}

          {matchedStudent && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:p-5">
              <h2 className="mb-3 font-semibold">자동으로 채워진 학사 정보</h2>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm sm:grid-cols-3 sm:gap-x-4 sm:gap-y-2">
                <Field label="이름" value={matchedStudent.name} />
                <Field label="학번" value={matchedStudent.studentId} />
                <Field label="단과대학" value={matchedStudent.college} />
                <Field label="학과" value={matchedStudent.department} />
                <Field label="학년/상태" value={`${matchedStudent.grade} · ${matchedStudent.status}`} />
                <Field label="졸업(예정)" value={matchedStudent.expectedGraduation} />
                <Field label="학점" value={`${matchedStudent.gpa} / ${matchedStudent.gpaScale}`} />
                <Field
                  label="어학"
                  value={`${matchedStudent.englishTest.name} ${matchedStudent.englishTest.score}`}
                />
                <Field label="자격증" value={matchedStudent.certifications.join(", ") || "-"} />
                <Field label="활동" value={matchedStudent.activities.join(", ") || "-"} />
                <Field label="수상" value={matchedStudent.awards.join(", ") || "-"} />
              </dl>
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:p-5">
            <h2 className="mb-2 font-semibold">이력서 원문 (자유 기술 내용)</h2>
            <p className="mb-2 text-xs text-neutral-500">
              학사 정보 외 경력/프로젝트 등은 이 원문을 그대로 자소서 생성 단계에서 참고합니다.
            </p>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={8}
              className="w-full rounded-md border border-neutral-300 bg-neutral-50 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <button
            onClick={handleContinue}
            disabled={!matchedStudent}
            className="w-full rounded-md bg-red-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40 sm:w-auto"
          >
            다음 단계: 공고 분석 →
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-neutral-400">{label}</dt>
      <dd className="font-medium text-neutral-800 dark:text-neutral-200">{value}</dd>
    </div>
  );
}
