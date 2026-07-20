/**
 * 서강대학교 공식 로고 이미지가 아닌 텍스트 기반 배지(placeholder)다.
 * 실제 서비스로 배포할 때는 학교 승인을 받은 공식 로고 파일로 교체해야 한다.
 */
export function SogangBadge() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-700 text-sm font-bold text-white">
        서강
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          서강대학교
        </div>
        <div className="text-[10px] tracking-wide text-neutral-500">SOGANG UNIVERSITY</div>
      </div>
    </div>
  );
}
