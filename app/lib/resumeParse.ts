export async function extractResumeText(
  file: File
): Promise<{ text: string; fileName: string }> {
  const fileName = file.name;
  const buffer = Buffer.from(await file.arrayBuffer());
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return { text: result.text, fileName };
    } finally {
      await parser.destroy();
    }
  }

  if (lower.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value, fileName };
  }

  if (lower.endsWith(".txt")) {
    return { text: buffer.toString("utf-8"), fileName };
  }

  throw new Error("지원하지 않는 파일 형식입니다. PDF, DOCX, TXT 파일만 업로드할 수 있어요.");
}
