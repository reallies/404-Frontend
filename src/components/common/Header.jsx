import { Link, useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/trips',     match: (p) => p === '/trips' },
  { label: 'Destinations', path: '/trips/new', match: (p) => p === '/trips/new' },
  { label: 'Checklist',    path: '/trips/1/checklist', match: (p) => p.includes('/checklist') },
]

function Header() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <header className="z-50 w-full bg-white border-b border-gray-100">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">

        {/* 로고 */}
        <Link
          to="/"
          className="text-cyan-500 font-semibold text-sm tracking-tight hover:text-cyan-600 transition-colors"
        >
          The Editorial Architect
        </Link>

        {/* 데스크탑 네비게이션 */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`text-sm transition-colors pb-0.5 ${
                item.match(location.pathname)
                  ? 'text-cyan-500 font-semibold border-b-2 border-cyan-500'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 유저 아바타 */}
        <button
          onClick={() => navigate('/login')}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          aria-label="사용자 메뉴"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-gray-500"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </button>

      </div>
    </header>
  )
}

export default Header
