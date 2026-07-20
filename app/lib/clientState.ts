"use client";

import type { CoverLetterSection, JobAnalysis, ResumeProfile } from "@/lib/types";

const KEYS = {
  resumeProfile: "sgcv:resumeProfile",
  jobAnalysis: "sgcv:jobAnalysis",
  coverLetterSections: "sgcv:coverLetterSections",
} as const;

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getResumeProfile(): ResumeProfile | null {
  return read<ResumeProfile>(KEYS.resumeProfile);
}
export function setResumeProfile(profile: ResumeProfile) {
  write(KEYS.resumeProfile, profile);
}

export function getJobAnalysis(): JobAnalysis | null {
  return read<JobAnalysis>(KEYS.jobAnalysis);
}
export function setJobAnalysis(analysis: JobAnalysis) {
  write(KEYS.jobAnalysis, analysis);
}

export function getCoverLetterSections(): CoverLetterSection[] | null {
  return read<CoverLetterSection[]>(KEYS.coverLetterSections);
}
export function setCoverLetterSections(sections: CoverLetterSection[]) {
  write(KEYS.coverLetterSections, sections);
}
