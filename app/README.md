# 서강 자소서 도우미 (MVP 데모)

서강대생을 타깃으로, 이력서 업로드 → 공고(사람인/잡코리아) 분석 → 자기소개서 4항목 초안 생성(+작성 근거 코멘트) → 항목별 재생성까지 이어지는 웹 서비스 데모입니다. 기획 배경은 [`docs/PRD.md`](./docs/PRD.md) 참고.

## 빠른 시작

```bash
npm install
npm run dev
```

`http://localhost:3000` 에서 홈 → 이력서 업로드 → 공고 분석 → 자소서 생성 순서로 이동합니다.

## LLM 연동 (선택)

`GEMINI_API_KEY` 또는 `ANTHROPIC_API_KEY` 중 하나를 설정하면 실제 AI로 공고 분석 및 자소서 생성 품질이 크게 올라갑니다. 둘 다 없으면 모든 기능이 **키워드/템플릿 기반 간이 로직으로 자동 폴백**되어 동작합니다(정확도는 낮지만 전체 플로우는 그대로 테스트 가능).

`GEMINI_API_KEY`가 있으면 Gemini를, 없고 `ANTHROPIC_API_KEY`만 있으면 Claude를 사용합니다. Gemini는 [Google AI Studio](https://aistudio.google.com/apikey)에서 무료로 키를 발급받을 수 있어 결제 없이 바로 테스트하기 좋습니다.

```bash
cp .env.example .env.local
# .env.local 안에 GEMINI_API_KEY 또는 ANTHROPIC_API_KEY 입력
```

## 핵심 설계 결정 (요청사항 반영)

1. **학사 정보**: 실제 서강대 학사시스템과 연동하지 않습니다. 대신 `data/mock-students.json`에 가상 학생 10명을 등록해두고, 업로드한 이력서에서 학번(8자리)/이름을 찾아 이 10명 중 한 명과만 매칭합니다. 자동 매칭이 안 되면 화면에서 10명 중 직접 선택할 수 있습니다.
2. **공고 분석 대상**: 사람인(saramin.co.kr), 잡코리아(jobkorea.co.kr) 링크만 자동 수집을 시도합니다(`lib/jobSource.ts`). 그 외 사이트이거나 수집 실패 시 공고 본문을 직접 붙여넣는 방식으로 대체하도록 UI에서 항상 안내합니다.
3. **자소서 항목**: 공고에 자체 문항이 있어도 따라가지 않고, 항상 표준 4항목(지원동기 / 성장과정 / 강점(직무역량) / 입사 후 포부)을 생성합니다.
4. **서강대 브랜딩**: 별도 로그인/인증은 두지 않았고(마케팅 포지셔닝), 상단 네비게이션에 서강대 배지만 노출합니다. `app/components/SogangBadge.tsx`는 텍스트 기반 placeholder이며, 실제 배포 시 학교 승인을 받은 공식 로고 파일로 교체해야 합니다.
5. **MVP 순서**: 이력서 업로드/매칭 → 공고 분석 → 자소서 생성/재생성 순으로 구현했습니다.

## 폴더 구조

```
app/               Next.js App Router 페이지 & API 라우트
  resume/          1단계: 이력서 업로드
  job/             2단계: 공고 분석
  generate/        3단계: 자소서 생성/재생성
  api/             resume/parse, job/analyze, coverletter/generate|regenerate, students
lib/               파싱, 크롤링, LLM 연동, 폴백 로직
data/mock-students.json   가상 학생 10명 DB
docs/PRD.md        기획 문서
```

## 알려진 한계 (데모 범위)

- 사람인/잡코리아 페이지의 실제 HTML 구조는 자주 바뀌므로 `lib/jobSource.ts`의 CSS 셀렉터가 맞지 않을 수 있습니다. 이 경우 자동으로 "본문 텍스트 직접 붙여넣기"를 안내합니다.
- 상태는 서버 DB가 아닌 브라우저 `localStorage`에 저장됩니다(로그인/여러 기기 동기화 없음).
- `GEMINI_API_KEY`/`ANTHROPIC_API_KEY` 없이 실행하면 공고 분석/자소서 생성 품질이 낮은 간이 로직으로 동작합니다.
