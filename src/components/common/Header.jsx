import { useCallback, useEffect, useId, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import BrandLogo from '@/components/common/BrandLogo'
import { clearClientSessionForLogout, isMockWebSessionLoggedIn } from '@/utils/onboardingGate'

const NAV_ITEMS = [
  { label: '홈', path: '/', match: (p) => p === '/' },
  { label: '여행 준비', path: '/trips/new/step2', match: (p) => p.startsWith('/trips/new') },
  {
    label: '체크리스트',
    path: '/trips/1/guide-archive',
    match: (p) => p.includes('/guide-archive') || p.includes('/checklist'),
  },
]

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const menuId = useId()
  const logoutDialogTitleId = useId()

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  useEffect(() => {
    closeMobileMenu()
    setLogoutConfirmOpen(false)
  }, [location.pathname, closeMobileMenu])

  useEffect(() => {
    if (!mobileMenuOpen && !logoutConfirmOpen) return undefined
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return
      if (logoutConfirmOpen) setLogoutConfirmOpen(false)
      else closeMobileMenu()
    }
    document.addEventListener('keydown', onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [mobileMenuOpen, logoutConfirmOpen, closeMobileMenu])

  const handleConfirmLogout = useCallback(() => {
    setLogoutConfirmOpen(false)
    clearClientSessionForLogout()
    /** 웹(md+): 현재 페이지 유지, 헤더만 비로그인 UI로 전환. 모바일: 로그인 페이지로 이동 */
    const isDesktop =
      typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
    if (!isDesktop) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const openLogoutConfirm = useCallback(() => {
    closeMobileMenu()
    setLogoutConfirmOpen(true)
  }, [closeMobileMenu])

  /** 데스크톱 전용 분기 — 백엔드 연동 시 isMockWebSessionLoggedIn 대신 세션 훅으로 교체 */
  const isWebLoggedIn = isMockWebSessionLoggedIn()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            to="/"
            className="flex min-w-0 shrink-0 items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
          >
            <BrandLogo className="h-7 w-auto md:h-8" />
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-6">
          {/* 데스크톱(md+): 로그인 시 — 홈 · 여행 준비 · 체크리스트 */}
          <nav
            className={`hidden items-center gap-8 ${isWebLoggedIn ? 'md:flex' : 'md:hidden'}`}
            aria-label="주요 메뉴"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`pb-0.5 text-sm transition-colors ${
                  item.match(location.pathname)
                    ? 'border-b-2 border-cyan-500 font-semibold text-cyan-500'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 데스크톱(md+): 비로그인 시 — 로그인 버튼만 */}
          <div className={isWebLoggedIn ? 'hidden' : 'hidden md:flex'}>
            <Link
              to="/login"
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold shadow-sm transition-colors sm:px-3 sm:text-sm ${
                location.pathname === '/login' || location.pathname === '/signup'
                  ? 'border-cyan-200 bg-cyan-50 text-cyan-800'
                  : 'border-gray-200 bg-white text-gray-800 hover:border-cyan-200 hover:bg-cyan-50/60'
              }`}
            >
              로그인
            </Link>
          </div>

          {/* 데스크톱(md+): 로그인 시 — 프로필 아이콘 → 가장 오른쪽 로그아웃(모바일과 동일 확인 모달) */}
          <button
            type="button"
            onClick={() => navigate('/mypage')}
            className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 ${
              isWebLoggedIn ? 'md:flex' : 'md:hidden'
            }`}
            aria-label="마이페이지"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={openLogoutConfirm}
            className={`hidden shrink-0 rounded-lg px-2 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 ${
              isWebLoggedIn ? 'md:inline-flex' : 'md:hidden'
            }`}
          >
            로그아웃
          </button>

          {/* 모바일: 햄버거 → 프로필 / 로그아웃(확인 모달) */}
          <div className="relative md:hidden">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition-colors hover:border-cyan-200 hover:bg-cyan-50/50"
              aria-expanded={mobileMenuOpen}
              aria-controls={menuId}
              aria-haspopup="true"
              aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              onClick={() => setMobileMenuOpen((o) => !o)}
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>

            {mobileMenuOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-[60] bg-black/30"
                  aria-label="메뉴 닫기"
                  onClick={closeMobileMenu}
                />
                <div
                  id={menuId}
                  className="absolute right-0 top-full z-[70] mt-2 w-56 max-w-[85vw] overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-xl"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-gray-900 hover:bg-cyan-50/80"
                    onClick={() => {
                      closeMobileMenu()
                      navigate('/mypage')
                    }}
                  >
                    프로필
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={openLogoutConfirm}
                  >
                    로그아웃
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {logoutConfirmOpen ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="로그아웃 확인 닫기"
            onClick={() => setLogoutConfirmOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={logoutDialogTitleId}
            className="absolute left-1/2 top-1/2 w-[min(calc(100vw-2rem),20rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-100 bg-white px-5 py-5 shadow-xl"
          >
            <p id={logoutDialogTitleId} className="text-center text-base font-semibold text-gray-900">
              로그아웃하시겠습니까?
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                onClick={() => setLogoutConfirmOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                onClick={handleConfirmLogout}
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}

export default Header
