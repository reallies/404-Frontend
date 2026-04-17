import { Outlet, Link, useLocation } from 'react-router-dom'
import Header from '@/components/common/Header'
import AiPlannerFab from '@/components/common/AiPlannerFab'
import { shouldHideGlobalHeaderOnMobile, shouldPadMainForMobileBottomNav } from '@/utils/tripLayoutPaths'

/** 홈·준비 항목 탐색(/trips/:id/search)에서만 메이퀸 FAB 표시. /trips/new/*(destination 포함)에서는 비표시 */
function shouldShowAiPlannerFab(pathname) {
  if (pathname === '/') return true
  return /^\/trips\/[^/]+\/search$/.test(pathname)
}

const BOTTOM_NAV_ITEMS = [
  {
    label: '홈',
    path: '/',
    match: (p) => p === '/',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    label: '여행 준비',
    path: '/trips/new/step2',
    match: (p) => p.startsWith('/trips/new') || p.includes('/search'),
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    ),
  },
  {
    label: '체크리스트',
    path: '/trips/1/guide-archive',
    match: (p) => p.includes('/guide-archive') || p.includes('/checklist'),
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
  },
  {
    label: '마이페이지',
    path: '/mypage',
    match: (p) => p === '/mypage',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    ),
  },
]

function RootLayout() {
  const location = useLocation()
  const { pathname } = location
  const hideHeaderOnMobile = shouldHideGlobalHeaderOnMobile(pathname)
  const padMainMobile = shouldPadMainForMobileBottomNav(pathname)
  const showAiPlannerFab = shouldShowAiPlannerFab(pathname)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className={hideHeaderOnMobile ? 'hidden md:block' : ''}>
        <Header />
      </div>

      {/* flex-col + min-h-0: 자식 페이지가 flex-1로 뷰 높이까지 배경·레이아웃 채우기 가능 */}
      <main
        className={`flex min-h-0 flex-1 flex-col md:pb-0 ${padMainMobile ? 'pb-16' : ''}`}
      >
        <Outlet />
      </main>

      {/* 모바일 바텀 네비게이션 (md 이상에서 숨김) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = item.match(location.pathname)
          return (
            <Link
              key={item.label}
              to={item.path}
              title={item.label}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-2.5 text-[10px] font-medium leading-tight transition-colors sm:text-xs ${
                isActive ? 'text-cyan-500' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {item.icon}
              <span className="max-w-full truncate text-center">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {showAiPlannerFab ? <AiPlannerFab /> : null}
    </div>
  )
}

export default RootLayout
