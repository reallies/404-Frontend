import BackButton from '@/components/common/BackButton'
import BrandLogo from '@/components/common/BrandLogo'

/** 모바일 상단바 — 전역 Header(h-14 + safe-area) 높이만큼 아래에서 sticky */
export const TRIP_FLOW_MOBILE_BAR_CLASS =
  'md:hidden sticky z-40 w-full border-b border-gray-100 bg-white top-[calc(3.5rem+env(safe-area-inset-top,0px))]'

/** `backTo` 생략 시 브라우저 히스토리 한 단계 뒤로(`navigate(-1)`), 지정 시 해당 경로로 이동 */
export function TripFlowDesktopBar({
  backTo,
  className = '',
  showBackIcon = true,
  label,
  ariaLabel,
}) {
  return (
    <div className={`relative z-[35] flex justify-end ${className}`}>
      {backTo != null && backTo !== '' ? (
        <BackButton to={backTo} showIcon={showBackIcon} label={label} ariaLabel={ariaLabel} />
      ) : (
        <BackButton showIcon={showBackIcon} label={label} ariaLabel={ariaLabel} />
      )}
    </div>
  )
}

/**
 * 모바일: 이전 스텝으로 이동(`backTo`) + 중앙 로고.
 * `BackButton`에 반드시 `to`를 넘겨 스텝 순서와 브라우저 히스토리가 어긋나도 올바른 화면으로 이동합니다.
 */
export function TripFlowMobileBar({
  backTo,
  showBack = true,
  centerTitle,
  className = '',
  logoClassName = 'h-6 w-auto max-w-[min(190px,62vw)]',
}) {
  return (
    <header className={`${TRIP_FLOW_MOBILE_BAR_CLASS} ${className}`.trim()}>
      <div className="grid grid-cols-3 items-center gap-1 px-2 py-2.5">
        <div className="flex min-w-0 justify-start">
          {showBack ? (
            <BackButton to={backTo} iconOnly className="shrink-0 text-gray-800" />
          ) : (
            <span className="inline-block w-11 shrink-0" aria-hidden />
          )}
        </div>
        <div className="flex min-w-0 justify-center px-1">
          {centerTitle != null && centerTitle !== '' ? (
            <h1 className="max-w-[min(220px,58vw)] truncate text-center text-sm font-bold leading-tight text-slate-800">
              {centerTitle}
            </h1>
          ) : (
            <BrandLogo className={`${logoClassName} drop-shadow-sm`} />
          )}
        </div>
        <div className="flex min-w-0 justify-end" aria-hidden>
          <span className="inline-block w-11 shrink-0" />
        </div>
      </div>
    </header>
  )
}
