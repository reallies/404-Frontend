/** 라우터 pathname 정규화 (끝 슬래시 제거) */
export function normalizePathname(pathname) {
  if (!pathname) return '/'
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

/**
 * 모바일에서 TripFlowMobileBar(Step2 스타일)를 쓰고 전역 Header를 숨길 경로
 * — 동일한 상단바를 쓰는 화면과 이중 헤더를 맞추기 위함
 */
/**
 * 모바일에서 `RootLayout`의 `<main>`에 `pb-16`(바텀 탭 대비)을 줄지.
 * `/trips/new/*` 플로우는 페이지 안에서 이미 `pb-44` 등으로 여백을 두므로,
 * 중복 시 스크롤 맨 아래에 흰 띠가 생김 → false.
 */
export function shouldPadMainForMobileBottomNav(pathname) {
  const p = normalizePathname(pathname)
  if (p === '/trips/new' || p.startsWith('/trips/new/')) return false
  return true
}

export function shouldHideGlobalHeaderOnMobile(pathname) {
  const p = normalizePathname(pathname)
  if (p === '/' || p === '/login' || p === '/404' || p === '/mypage') return true
  if (/^\/trips\/new\/(step[2-5]|destination)$/.test(p)) return true
  if (/^\/trips\/[^/]+\/search$/.test(p)) return true
  if (/^\/trips\/[^/]+\/checklist$/.test(p)) return true
  if (/^\/trips\/[^/]+\/guide-archive$/.test(p)) return true
  if (/^\/trips\/[^/]+\/guide-archive\/[^/]+$/.test(p)) return true
  return false
}
