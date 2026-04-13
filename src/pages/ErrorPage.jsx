import { useNavigate, useRouteError } from 'react-router-dom'

/**
 * ErrorPage - 에러 경계 페이지
 * errorElement로 등록 - 컴포넌트 렌더링 중 예상치 못한 에러 발생 시 렌더링
 */
function ErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-red-400 mb-4">!</p>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        예상치 못한 오류가 발생했어요
      </h1>
      <p className="text-sm text-gray-500 mb-2">
        잠시 후 다시 시도해주세요.
      </p>
      {error?.message && (
        <code className="mb-8 block rounded-md bg-gray-100 px-3 py-2 text-xs text-gray-600">
          {error.message}
        </code>
      )}
      <button
        onClick={() => navigate('/')}
        className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
      >
        홈으로 돌아가기
      </button>
    </div>
  )
}

export default ErrorPage
