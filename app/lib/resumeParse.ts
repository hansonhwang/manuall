import { ensurePdfjsNodePolyfills } from "@/lib/pdfjsNodePolyfills";

export async function extractResumeText(
  file: File
): Promise<{ text: string; fileName: string }> {
  const fileName = file.name;
  const buffer = Buffer.from(await file.arrayBuffer());
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf")) {
    // pdfjs-dist가 Node 환경에서 @napi-rs/canvas로 DOMMatrix를 폴리필하려 시도하는데,
    // 서버리스 배포(Vercel 등)에서는 네이티브 바이너리가 로드되지 않아 실패할 수 있다.
    // pdf-parse를 import하기 전에 우리 폴리필을 먼저 깔아 그 실패를 원천 차단한다.
    ensurePdfjsNodePolyfills();
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
