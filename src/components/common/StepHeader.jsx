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
 */
export default function StepHeader({
  currentStep,
  totalSteps,
  title,
  subtitle,
  className = '',
  titleClassName,
  subtitleClassName,
}) {
  const progressPct = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className={className}>
      {/* STEP 라벨 */}
      <p className="mb-2">
        <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold tracking-wide text-sky-700">
          STEP {String(currentStep).padStart(2, '0')}
        </span>
      </p>

      {/* 제목 — 기본 text-4xl, titleClassName으로 페이지별 조정 가능 */}
      <h1
        className={`font-extrabold text-gray-900 leading-[1.2] mb-4 ${titleClassName ?? 'text-4xl'}`}
      >
        {title}
      </h1>

      {/* 스텝 카운터 + 프로그레스 바 */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-bold text-gray-400 whitespace-nowrap tabular-nums">
          {currentStep} / {totalSteps}
        </span>
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
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
