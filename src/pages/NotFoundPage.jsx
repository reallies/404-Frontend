import { useNavigate } from 'react-router-dom'

/**
 * NotFoundPage - 404 페이지
 * path: '*' - 정의되지 않은 모든 URL 접근 시 렌더링
 */
function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-purple-600 mb-4">404</p>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        페이지를 찾을 수 없어요
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        주소가 잘못됐거나 삭제된 페이지입니다.
      </p>
      <button
        onClick={() => navigate('/')}
        className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
      >
        홈으로 돌아가기
      </button>
    </div>
  )
}

export default NotFoundPage
