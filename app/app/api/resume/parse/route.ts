import { NextResponse } from "next/server";
import { extractResumeText } from "@/lib/resumeParse";
import { autoMatchStudent } from "@/lib/mockStudents";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "파일 크기는 10MB 이하만 가능합니다." }, { status: 400 });
  }

  try {
    const { text, fileName } = await extractResumeText(file);
    const matchedStudent = autoMatchStudent(text);
    return NextResponse.json({ rawText: text, fileName, matchedStudent });
  } catch (err) {
    const message = err instanceof Error ? err.message : "이력서 파일을 처리하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
