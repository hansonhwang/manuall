import studentsData from "@/data/mock-students.json";
import type { MockStudent } from "@/lib/types";

const students = studentsData as MockStudent[];

export function listStudents(): MockStudent[] {
  return students;
}

export function findStudentById(studentId: string): MockStudent | null {
  return students.find((s) => s.studentId === studentId) ?? null;
}

export function findStudentByName(name: string): MockStudent[] {
  return students.filter((s) => s.name === name);
}

const STUDENT_ID_PATTERN = /\b(19|20)\d{6}\b/g;

/**
 * 이력서 원문에서 학번 후보를 뽑아 가상 DB(10명)에 있는 학생만 매칭한다.
 * 실제 학사시스템 연동 대신 데모용 고정 DB를 참조하는 방식.
 */
export function autoMatchStudent(rawText: string): MockStudent | null {
  const candidateIds = rawText.match(STUDENT_ID_PATTERN) ?? [];
  for (const id of candidateIds) {
    const match = findStudentById(id);
    if (match) return match;
  }

  const nameMatches = students.filter((s) => rawText.includes(s.name));
  if (nameMatches.length === 1) return nameMatches[0];

  return null;
}
