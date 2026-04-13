import { Link, useNavigate } from 'react-router-dom'

/**
 * Header
 * - 서비스 로고 + 네비게이션
 * - 로그인 상태에 따라 버튼 분기 (추후 auth 연동)
 */
function Header() {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors">
          ✈️ Travel Checklist
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            to="/trips"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            내 여행
          </Link>
          <button
            onClick={() => navigate('/login')}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
          >
            로그인
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
