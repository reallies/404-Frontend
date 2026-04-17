import { useNavigate } from 'react-router-dom'
import BackButton from '@/components/common/BackButton'
import BrandLogo from '@/components/common/BrandLogo'

/** 모바일 상단바 공통 토큰 — 전역 Header와 맞춘 흰 배경 */
export const TRIP_FLOW_MOBILE_BAR_CLASS =
  'md:hidden sticky top-0 z-40 w-full border-b border-gray-100 bg-white pt-[env(safe-area-inset-top,0px)]'

/** Header와 동일한 원형 프로필 아이콘 (모바일 Trip 플로우 상단바 우측) */
function TripFlowMobileProfileButton({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="마이페이지"
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 active:bg-gray-300/90 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-gray-500"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </button>
  )
}

export function TripFlowDesktopBar({ backTo, className = '' }) {
  return (
    <div className={`flex justify-end ${className}`}>
      <BackButton to={backTo} />
    </div>
  )
}

export function TripFlowMobileBar({
  /**
   * 데스크톱 `TripFlowDesktopBar`와 동일 페이지에서 쓰는 “이전 스텝” 경로 힌트용으로만 유지.
   * 모바일 좌측 화살표는 `to`를 넘기지 않아 브라우저 히스토리 한 단계 뒤로(`navigate(-1)`) 이동합니다.
   */
  backTo: _backTo,
  /** 홈 등 루트 화면: 뒤로 없이 좌측만 여백으로 맞춤(그리드 중앙 로고 유지) */
  showBack = true,
  className = '',
  logoClassName = 'h-6 w-auto max-w-[min(190px,62vw)]',
}) {
  const navigate = useNavigate()

  return (
    <header className={`${TRIP_FLOW_MOBILE_BAR_CLASS} ${className}`.trim()}>
      <div className="grid grid-cols-3 items-center gap-1 px-2 py-2.5">
        <div className="flex min-w-0 justify-start">
          {showBack ? (
            <BackButton iconOnly className="shrink-0 text-gray-800" />
          ) : (
            <span className="inline-block w-11 shrink-0" aria-hidden />
          )}
        </div>
        <div className="flex min-w-0 justify-center px-1">
          <BrandLogo className={`${logoClassName} drop-shadow-sm`} />
        </div>
        <div className="flex min-w-0 justify-end">
          <TripFlowMobileProfileButton onClick={() => navigate('/mypage')} />
        </div>
      </div>
    </header>
  )
}
