import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist(=pdf-parse 내부 의존성)는 워커 파일을 런타임에 상대 경로로
  // 불러오는데, Turbopack이 이를 번들링하면 워커 파일 경로가 깨진다.
  // 번들링 대상에서 제외해 Node.js의 기본 require로 그대로 로드하게 한다.
  serverExternalPackages: ["pdfjs-dist", "pdf-parse"],
};

export default nextConfig;
