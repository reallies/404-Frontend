/**
 * StepHeader — 여행 플래닝 공용 스텝 헤더 컴포넌트
 *
 * Props:
 *   currentStep  {number}  현재 스텝 번호  (예: 1)
 *   totalSteps   {number}  전체 스텝 수    (예: 4)
 *   title        {string|ReactNode}  제목 텍스트 (줄바꿈 포함 가능)
 *   subtitle     {string}  (optional) 제목 아래 소개 문구
 *   className    {string}  (optional) 외부 여백 등 추가 클래스
 */
export default function StepHeader({
  currentStep,
  totalSteps,
  title,
  subtitle,
  className = '',
}) {
  const progressPct = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className={className}>
      {/* STEP 라벨 */}
      <p className="text-sm font-bold text-cyan-600 tracking-wide mb-2">
        STEP {String(currentStep).padStart(2, '0')}
      </p>

      {/* 제목 — 데스크탑·모바일 동일 크기 */}
      <h1 className="text-4xl font-extrabold text-gray-900 leading-[1.2] mb-4">
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

      {/* 부제목 (optional) */}
      {subtitle && (
        <p className="text-gray-500 text-base leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}
