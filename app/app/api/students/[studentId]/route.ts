import { NextResponse } from "next/server";
import { findStudentById } from "@/lib/mockStudents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const student = findStudentById(studentId);
  if (!student) {
    return NextResponse.json({ error: "가상 DB에 없는 학번입니다." }, { status: 404 });
  }
  return NextResponse.json({ student });
}
