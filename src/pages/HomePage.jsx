import { useNavigate } from 'react-router-dom'

/**
 * HomePage - 홈 / 랜딩 페이지
 *
 * 역할: 서비스 소개 + 여행 준비 시작 진입점
 * 루프: Total Loop 진입 전 단계
 * 이벤트: 없음 (로그인 후 /trips에서 travel_fixed 발생)
 */
function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        여행 준비, 이제 끊기지 않게
      </h1>
      <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
        검색하고, 저장하고, 확인까지. <br />
        여행 준비의 모든 과정을 하나의 체크리스트로 완성하세요.
      </p>

      <button
        onClick={() => navigate('/trips')}
        className="rounded-lg bg-purple-600 px-8 py-4 text-base font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm"
      >
        여행 준비 시작하기
      </button>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-2xl mb-3">{feature.icon}</div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{feature.title}</h3>
            <p className="text-sm text-gray-500">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const FEATURES = [
  {
    icon: '🔍',
    title: '조건 기반 탐색',
    description: '여행지, 일정에 맞는 준비 항목을 한 번에 찾아보세요.',
  },
  {
    icon: '📋',
    title: '즉시 저장',
    description: '찾은 항목을 바로 내 체크리스트에 저장할 수 있어요.',
  },
  {
    icon: '✅',
    title: '카테고리별 점검',
    description: '준비물, 예약, 출국 전 확인사항을 카테고리별로 관리하세요.',
  },
]

export default HomePage
