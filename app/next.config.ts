import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist(=pdf-parse 내부 의존성)는 워커 파일을 런타임에 상대 경로로
  // 불러오는데, Turbopack이 이를 번들링하면 워커 파일 경로가 깨진다.
  // 번들링 대상에서 제외해 Node.js의 기본 require로 그대로 로드하게 한다.
  serverExternalPackages: ["pdfjs-dist", "pdf-parse"],
  // pdfjs-dist가 워커 스크립트(pdf.worker.mjs)를 동적으로 import하는데,
  // 이런 동적 import는 Vercel의 빌드 파일 트레이서가 정적으로 감지하지
  // 못해 서버리스 함수 번들에서 통째로 빠진다. 이 라우트에 한해 해당
  // 패키지 전체를 명시적으로 포함시킨다.
  outputFileTracingIncludes: {
    "/api/resume/parse": ["./node_modules/pdfjs-dist/**/*"],
  },
};

export default nextConfig;
