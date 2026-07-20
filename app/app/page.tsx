import Link from "next/link";

const STEPS = [
  {
    href: "/resume",
    title: "1. 이력서 업로드",
    desc: "이력서 파일을 올리면 학사 정보를 자동으로 채워드려요. (데모용 가상 학생 10명 DB 기반)",
  },
  {
    href: "/job",
    title: "2. 공고 분석",
    desc: "사람인·잡코리아 공고 링크를 입력하면 모집요강을 분석해드려요.",
  },
  {
    href: "/generate",
    title: "3. 자소서 생성",
    desc: "지원동기·성장과정·강점·포부 4항목 초안과 작성 근거 코멘트를 확인하고, 항목별로 다시 생성할 수 있어요.",
  },
];

export default function Home() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="space-y-3">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">
          서강 자소서 도우미
        </h1>
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400 sm:text-base">
          서강대생을 타깃으로 한 자기소개서 작성 도우미 데모입니다. 이력서를 업로드하고, 지원할 공고를
          등록하면 공고에 맞춘 자소서 초안과 그 근거를 함께 보여드립니다.
        </p>
        <p className="text-xs text-neutral-400">
          ※ 데모 버전: 실제 서강대 학사시스템과 연동하지 않고, 가상의 학생 10명 데이터로만 동작합니다.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {STEPS.map((step) => (
          <Link
            key={step.href}
            href={step.href}
            className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 transition-shadow active:shadow-inner hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 sm:p-5"
          >
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{step.title}</h2>
            <p className="text-sm text-neutral-500">{step.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
