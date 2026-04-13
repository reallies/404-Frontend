import { useNavigate } from 'react-router-dom'

/**
 * LoginPage - 로그인 / 회원가입 페이지
 *
 * 역할: 사용자 인증
 * 추후: Supabase Auth 연동 예정
 * 이벤트: 없음
 */
function LoginPage() {
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    // TODO: Supabase Auth 연동 후 실제 로그인 처리
    navigate('/trips')
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
          <p className="mt-2 text-sm text-gray-500">
            여행 준비를 이어서 하려면 로그인하세요.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="example@email.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="비밀번호를 입력하세요"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
          >
            로그인
          </button>
        </form>

        <div className="mt-4 text-center">
          <span className="text-sm text-gray-500">계정이 없으신가요? </span>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
