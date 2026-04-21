import BackButton from '@/components/common/BackButton'
import { TripFlowDesktopBar } from '@/components/common/TripFlowTopBar'

/** 모바일 StepHeader `topEndAction`과 동일한 틸 톤·텍스트만(화살표 없음) */
const MOBILE_PREV_CLASS = 'shrink-0 text-teal-700 hover:text-teal-900'

/**
 * `/trips/new/*` 플로우 공통 이전 버튼 — 데스크톱 상단 우측
 * - `to` 없음: `navigate(-1)`
 * - `to` 있음: 해당 경로 (예: step2 홈 — `to="/"`, `label="홈으로"`)
 */
export function TripNewFlowDesktopPrevBar({ className = '', to, label, ariaLabel }) {
  return (
    <TripFlowDesktopBar
      backTo={to}
      className={className}
      showBackIcon={false}
      label={label}
      ariaLabel={ariaLabel}
    />
  )
}

/**
 * 같은 플로우 — 모바일 STEP 배지 줄 오른쪽 (`StepHeader`의 `topEndAction`)
 * `to`·`label` 규칙은 데스크톱과 동일.
 */
export function TripNewFlowMobilePrevAction({ to, label, ariaLabel }) {
  return (
    <BackButton
      to={to}
      showIcon={false}
      className={MOBILE_PREV_CLASS}
      label={label}
      ariaLabel={ariaLabel}
    />
  )
}
