"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SogangBadge } from "@/app/components/SogangBadge";

const STEPS = [
  { href: "/resume", label: "1. 이력서 업로드" },
  { href: "/job", label: "2. 공고 분석" },
  { href: "/generate", label: "3. 자소서 생성" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          <SogangBadge />
          <span className="hidden text-sm text-neutral-400 sm:inline">자소서 도우미 (데모)</span>
        </Link>
        <nav className="flex gap-1 text-sm">
          {STEPS.map((step) => {
            const active = pathname === step.href;
            return (
              <Link
                key={step.href}
                href={step.href}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  active
                    ? "bg-red-700 text-white"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                }`}
              >
                {step.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
