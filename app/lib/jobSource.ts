import * as cheerio from "cheerio";
import type { JobSite } from "@/lib/types";

const ALLOWED_HOSTS: Record<string, JobSite> = {
  "www.saramin.co.kr": "saramin",
  "saramin.co.kr": "saramin",
  "www.jobkorea.co.kr": "jobkorea",
  "jobkorea.co.kr": "jobkorea",
};

export function detectJobSite(rawUrl: string): JobSite | null {
  try {
    const url = new URL(rawUrl);
    return ALLOWED_HOSTS[url.hostname] ?? null;
  } catch {
    return null;
  }
}

export class UnsupportedJobSiteError extends Error {}
export class JobFetchError extends Error {}

/**
 * 사람인/잡코리아 공고 페이지를 서버에서 가져와 본문 텍스트만 추출한다.
 * 두 사이트만 1차 지원 대상이며, 그 외 URL이나 수집 실패 시에는
 * 사용자가 공고 본문을 직접 붙여넣는 방식으로 대체해야 한다(PRD 3절 fallback 정책).
 */
export async function fetchJobPostingText(rawUrl: string): Promise<{
  site: JobSite;
  text: string;
}> {
  const site = detectJobSite(rawUrl);
  if (!site) {
    throw new UnsupportedJobSiteError(
      "현재는 사람인(saramin.co.kr), 잡코리아(jobkorea.co.kr) 링크만 지원합니다. 다른 사이트라면 공고 본문을 직접 붙여넣어 주세요."
    );
  }

  let response: Response;
  try {
    response = await fetch(rawUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SogangResumeBot/0.1; +https://example.invalid/bot)",
      },
      redirect: "follow",
    });
  } catch {
    throw new JobFetchError(
      "공고 페이지를 불러오지 못했습니다. 네트워크 문제이거나 사이트가 접근을 막았을 수 있어요. 공고 본문을 직접 붙여넣어 주세요."
    );
  }

  if (!response.ok) {
    throw new JobFetchError(
      `공고 페이지를 불러오지 못했습니다 (status ${response.status}). 공고 본문을 직접 붙여넣어 주세요.`
    );
  }

  const html = await response.text();
  const text = extractMainText(html, site);

  if (!text || text.trim().length < 30) {
    throw new JobFetchError(
      "공고 본문을 페이지에서 찾지 못했습니다. 로그인 후에만 보이는 공고이거나 페이지 구조가 바뀌었을 수 있어요. 공고 본문을 직접 붙여넣어 주세요."
    );
  }

  return { site, text };
}

function extractMainText(html: string, site: JobSite): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, iframe, svg").remove();

  const selectors =
    site === "saramin"
      ? [".user_content", ".job_summary", "#content .wrap_jv_cont", ".viw_jd"]
      : [".job-content", ".recruit-info", ".detailArea", "#content"];

  for (const selector of selectors) {
    const el = $(selector);
    if (el.length && el.text().trim().length > 30) {
      return normalizeWhitespace(el.text());
    }
  }

  return normalizeWhitespace($("body").text());
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
