import { NextResponse } from "next/server";
import { listStudents } from "@/lib/mockStudents";

export async function GET() {
  const students = listStudents().map((s) => ({
    studentId: s.studentId,
    name: s.name,
    department: s.department,
    grade: s.grade,
  }));
  return NextResponse.json({ students });
}
