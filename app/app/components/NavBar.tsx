"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SogangBadge } from "@/app/components/SogangBadge";

const STEPS = [
  { href: "/resume", label: "1. 이력서 업로드", shortLabel: "① 이력서" },
  { href: "/job", label: "2. 공고 분석", shortLabel: "② 공고" },
  { href: "/generate", label: "3. 자소서 생성", shortLabel: "③ 생성" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-3">
        <Link href="/" className="flex items-center gap-3">
          <SogangBadge />
          <span className="hidden text-sm text-neutral-400 sm:inline">자소서 도우미 (데모)</span>
        </Link>
        <nav className="grid grid-cols-3 gap-1 text-xs sm:flex sm:text-sm">
          {STEPS.map((step) => {
            const active = pathname === step.href;
            return (
              <Link
                key={step.href}
                href={step.href}
                className={`rounded-md px-2 py-2 text-center transition-colors sm:px-3 sm:py-1.5 sm:text-left ${
                  active
                    ? "bg-red-700 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 sm:bg-transparent dark:sm:bg-transparent"
                }`}
              >
                <span className="sm:hidden">{step.shortLabel}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
