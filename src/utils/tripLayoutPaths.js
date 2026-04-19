/** 라우터 pathname 정규화 (끝 슬래시 제거) */
export function normalizePathname(pathname) {
  if (!pathname) return '/'
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

/**
 * 모바일에서 전역 Header 표시 여부.
 * 예전에는 TripFlowMobileBar와 겹쳐 숨겼으나, 모바일도 전역 Header(햄버거)로 통일함.
 */
/**
 * 모바일에서 `RootLayout`의 `<main>`에 `pb-16`(바텀 탭 대비)을 줄지.
 * `/trips/new/*` 플로우는 페이지 안에서 이미 `pb-44` 등으로 여백을 두므로,
 * 중복 시 스크롤 맨 아래에 흰 띠가 생김 → false.
 */
export function shouldPadMainForMobileBottomNav(pathname) {
  const p = normalizePathname(pathname)
  if (p === '/trips/new' || p.startsWith('/trips/new/')) return false
  /** 가이드 상세: 하단 고정 버튼·그라데이션만 쓰고, main pb-16 이 흰 띠로 보이는 것 방지 */
  if (/^\/trips\/[^/]+\/guide-archive\/[^/]+$/.test(p)) return false
  return true
}

export function shouldHideGlobalHeaderOnMobile(_pathname) {
  return false
}
