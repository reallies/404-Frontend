import { useNavigate } from 'react-router-dom'

/**
 * TripListPage - 내 여행 목록 페이지
 *
 * 역할: 생성한 여행 카드 목록 표시 + 새 여행 추가 진입
 * 루프: Travel Fixed 관리 (Reuse 관점에서 이전 여행 재진입 가능)
 * 이벤트: travel_fixed (새 여행 생성 시 /trips/new에서 발생)
 *
 * 추후: API 연동 시 여행 목록 fetch 처리
 */
function TripListPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">내 여행</h1>
        <button
          onClick={() => navigate('/trips/new')}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
        >
          + 새 여행 추가
        </button>
      </div>

      {/* TODO: API 연동 후 실제 여행 목록 렌더링 */}
      <EmptyTripState onStart={() => navigate('/trips/new')} />
    </div>
  )
}

function EmptyTripState({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
      <div className="text-4xl mb-4">✈️</div>
      <h2 className="text-base font-semibold text-gray-900 mb-2">
        아직 등록된 여행이 없어요
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        첫 번째 여행을 추가하고 준비를 시작해보세요.
      </p>
      <button
        onClick={onStart}
        className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
      >
        여행 준비 시작하기
      </button>
    </div>
  )
}

export default TripListPage
