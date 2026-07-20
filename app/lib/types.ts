export interface MockStudent {
  studentId: string;
  name: string;
  college: string;
  department: string;
  admissionYear: number;
  grade: string;
  status: "재학" | "휴학" | "졸업";
  expectedGraduation: string;
  gpa: number;
  gpaScale: number;
  englishTest: { name: string; score: string | number };
  certifications: string[];
  activities: string[];
  awards: string[];
}

export interface ResumeProfile {
  student: MockStudent;
  rawResumeText: string;
  sourceFileName: string;
}

export type JobSite = "saramin" | "jobkorea";

export interface JobAnalysis {
  site: JobSite;
  sourceUrl: string | null;
  company: string;
  title: string;
  mainTasks: string[];
  requiredQualifications: string[];
  preferredQualifications: string[];
  coreValues: string[];
  deadline: string | null;
  rawText: string;
  analyzedBy: "llm" | "heuristic";
}

export const COVER_LETTER_SECTIONS = [
  "지원동기",
  "성장과정",
  "강점(직무역량)",
  "입사 후 포부",
] as const;

export type CoverLetterSectionName = (typeof COVER_LETTER_SECTIONS)[number];

export interface CoverLetterSection {
  section: CoverLetterSectionName;
  content: string;
  reasoning: string;
  generatedBy: "llm" | "heuristic";
  version: number;
}
