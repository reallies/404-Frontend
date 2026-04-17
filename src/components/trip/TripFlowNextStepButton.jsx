function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
    </svg>
  )
}

const VARIANT_ENABLED = {
  amber: 'cursor-pointer bg-amber-400 text-gray-900 hover:bg-amber-500 hover:shadow-md',
  teal: 'cursor-pointer bg-teal-700 text-white hover:bg-teal-800 hover:shadow-md',
}

const DISABLED = 'cursor-not-allowed bg-gray-200 text-gray-400'

/**
 * 여행 플로우(목적지·항공 등)에서 쓰는 "다음 단계로 이동" CTA.
 * 크기·타이포·아이콘을 한곳에서 맞춥니다(가로는 항상 부모 너비에 맞춤 w-full).
 *
 * @param {'amber'|'teal'} [variant] — 페이지별 강조색(목적지=amber, 항공=teal)
 * @param {boolean} [fullWidth] — true면 w-full(모바일 하단 등), false면 w-auto px-10(데스크톱 우측 정렬 등)
 * @param {boolean} [showTrailingIcon] — false면 오른쪽 화살표 숨김(레이아웃 유지용)
 */
export function TripFlowNextStepButton({
  disabled,
  onClick,
  variant = 'amber',
  fullWidth = true,
  showTrailingIcon = true,
  children = '다음 단계로 이동',
  className = '',
  type = 'button',
  ...rest
}) {
  const width = fullWidth ? 'w-full' : 'w-auto px-10'
  const base = `inline-flex ${width} items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold shadow-sm transition-all`
  const state = disabled ? DISABLED : VARIANT_ENABLED[variant]
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${state} ${className}`.trim()}
      {...rest}
    >
      {children}
      {showTrailingIcon ? <ChevronRightIcon /> : null}
    </button>
  )
}
