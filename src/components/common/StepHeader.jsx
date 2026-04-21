import StepProgressBarMascot from '@/components/common/StepProgressBarMascot'

/**
 * StepHeader — 여행 플래닝 공용 스텝 헤더 컴포넌트
 *
 * Props:
 *   currentStep  {number}  현재 스텝 번호  (예: 1)
 *   totalSteps   {number}  전체 스텝 수    (예: 4)
 *   title        {string|ReactNode}  제목 텍스트 (줄바꿈 포함 가능)
 *   subtitle     {string|ReactNode}  (optional) 제목 아래 소개 문구
 *   className      {string}  (optional) 외부 여백 등 추가 클래스
 *   titleClassName   {string}  (optional) 제목(h1) 타이포 — 예: 모바일만 `text-2xl`
 *   subtitleClassName {string} (optional) 부제 영역 타이포 — 기본 `text-base`
 *   topEndAction    {ReactNode} (optional) STEP 배지와 같은 줄 오른쪽 (예: 모바일 뒤로가기)
 */
export default function StepHeader({
  currentStep,
  totalSteps,
  title,
  subtitle,
  className = '',
  titleClassName,
  subtitleClassName,
  topEndAction,
}) {
  const progressPct = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className={className}>
      {/* STEP 라벨 + (optional) 같은 줄 오른쪽 액션 */}
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="mb-0 min-w-0">
          <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold tracking-wide text-sky-700">
            STEP {String(currentStep).padStart(2, '0')}
          </span>
        </p>
        {topEndAction}
      </div>

      {/* 제목 — 기본 text-4xl, titleClassName으로 페이지별 조정 가능 */}
      <h1
        className={`font-extrabold text-gray-900 leading-[1.2] mb-4 ${titleClassName ?? 'text-4xl'}`}
      >
        {title}
      </h1>

      {/* 스텝 카운터 + 프로그레스 바(마스코트는 채움 끝 = 현재 진행률) */}
      <div className="mb-4 flex items-end gap-3">
        <span className="shrink-0 pb-0.5 text-sm font-bold whitespace-nowrap text-gray-400 tabular-nums">
          {currentStep} / {totalSteps}
        </span>
        <StepProgressBarMascot percent={progressPct} />
      </div>

      {/* 부제목 (optional) — 문자열·복수 문단·목록 등 ReactNode 허용 */}
      {subtitle && (
        <div
          className={`text-gray-500 leading-relaxed space-y-2.5 [&_strong]:font-semibold [&_ul]:text-sm [&_ul]:text-gray-500 ${
            subtitleClassName ?? 'text-base'
          }`}
        >
          {subtitle}
        </div>
      )}
    </div>
  )
}
