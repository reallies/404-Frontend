import { useCallback, useEffect, useId, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import BrandLogo from '@/components/common/BrandLogo'

/** 문의 메일 — 실서비스 시 도메인·주소로 교체 */
const CONTACT_MAILTO = 'mailto:help@travel-checklist.app?subject=%5B%EC%97%AC%ED%96%89%20%EC%B2%B4%ED%81%AC%EB%A6%AC%EC%8A%A4%ED%8A%B8%5D%20%EB%AC%B8%EC%9D%98'

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
  const menuId = useId()

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  useEffect(() => {
    closeMobileMenu()
  }, [location.pathname, closeMobileMenu])

  useEffect(() => {
    if (!mobileMenuOpen) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeMobileMenu()
    }
    document.addEventListener('keydown', onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [mobileMenuOpen, closeMobileMenu])

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
          <nav className="hidden items-center gap-8 md:flex">
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

          <div className="hidden items-center gap-1.5 sm:gap-2 md:flex">
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
            <a
              href={CONTACT_MAILTO}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-800 shadow-sm transition-colors hover:border-cyan-200 hover:bg-cyan-50/60 sm:px-3 sm:text-sm"
            >
              이메일
            </a>
          </div>

          <button
            type="button"
            onClick={() => navigate('/mypage')}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 md:flex"
            aria-label="마이페이지"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </button>

          {/* 모바일: 햄버거 → 로그인 / 이메일 / 마이페이지 */}
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
                  <Link
                    to="/login"
                    role="menuitem"
                    className="block px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-cyan-50/80"
                    onClick={closeMobileMenu}
                  >
                    로그인
                  </Link>
                  <a
                    href={CONTACT_MAILTO}
                    role="menuitem"
                    className="block px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-cyan-50/80"
                    onClick={closeMobileMenu}
                  >
                    이메일
                  </a>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-gray-900 hover:bg-cyan-50/80"
                    onClick={() => {
                      closeMobileMenu()
                      navigate('/mypage')
                    }}
                  >
                    마이페이지
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
