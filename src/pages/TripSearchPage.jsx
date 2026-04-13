import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

/**
 * TripSearchPage - 준비 항목 탐색 페이지
 *
 * ─── Store Loop (DRD-1 / 05_store_loop_strategy_okr.md) ───
 * 흐름: Search → Detail Check → Save
 *
 * [K1] search_start      → detail_check_open  : SP1 측정
 * [K2] research_trigger                       : Store_R 측정 (재탐색 감지)
 * [K3] detail_check_open → save_complete      : SP2 측정
 * [K4] 각 이벤트 타임스탬프 차이              : Delay_t, PB_t 측정
 *
 * 이벤트 정의는 04_meta_okr.md 참고.
 *
 * ⚠️ 이 페이지(Store Loop)와 /checklist(Confirm Loop)는 반드시 분리 유지.
 *    같은 페이지로 합치면 re_store_trigger(Backflow) 측정 불가.
 */

// ─── 이벤트 수집 헬퍼 (추후 분석 도구 SDK로 교체) ───────────────────
const trackEvent = (eventName, properties = {}) => {
  // TODO: 분석 도구 연동 후 실제 이벤트 전송으로 교체
  // ex) mixpanel.track(eventName, properties)
  // ex) amplitude.track(eventName, properties)
  console.debug('[Event]', eventName, properties)
}
// ────────────────────────────────────────────────────────────────────

function TripSearchPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [savedIds, setSavedIds] = useState(new Set())
  const [searchStartTime, setSearchStartTime] = useState(null)

  // [K1] search_start 이벤트: 페이지 진입 시 탐색 시작으로 간주
  useEffect(() => {
    const startTime = Date.now()
    setSearchStartTime(startTime)
    trackEvent('search_start', { trip_id: id, timestamp: startTime })
  }, [id])

  // [K2] research_trigger 이벤트: 카테고리 변경 = 재탐색 발생
  const handleCategoryChange = (category) => {
    if (selectedCategory !== 'all' && category !== selectedCategory) {
      trackEvent('research_trigger', {
        trip_id: id,
        from_category: selectedCategory,
        to_category: category,
      })
    }
    setSelectedCategory(category)
  }

  // [K3] detail_check_open 이벤트: 항목 상세 확인 시
  const handleDetailCheck = (item) => {
    trackEvent('detail_check_open', {
      trip_id: id,
      item_id: item.id,
      item_category: item.category,
      elapsed_ms: searchStartTime ? Date.now() - searchStartTime : null,
    })
  }

  // [K3] save_complete 이벤트: 저장 완료 시
  const handleSave = (item) => {
    // 낙관적 업데이트: API 호출 전 즉시 UI 반영 → Delay_t 감소 효과
    setSavedIds((prev) => new Set([...prev, item.id]))

    trackEvent('save_complete', {
      trip_id: id,
      item_id: item.id,
      item_category: item.category,
      elapsed_ms: searchStartTime ? Date.now() - searchStartTime : null,
    })
    // TODO: POST /api/trips/:id/checklist API 연동
  }

  const filteredItems =
    selectedCategory === 'all'
      ? MOCK_ITEMS
      : MOCK_ITEMS.filter((item) => item.category === selectedCategory)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/trips')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            ← 내 여행으로
          </button>
          <h1 className="text-2xl font-bold text-gray-900">준비 항목 탐색</h1>
          <p className="mt-1 text-sm text-gray-500">필요한 항목을 찾아 바로 저장해보세요.</p>
        </div>
        <button
          onClick={() => navigate(`/trips/${id}/checklist`)}
          className="rounded-lg border border-purple-600 px-4 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-colors"
        >
          내 체크리스트 보기 →
        </button>
      </div>

      {/* 카테고리 필터 탭 - [K1] search_start / [K2] research_trigger 트리거 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryChange(cat.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === cat.value
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 탐색 결과 - 구조화된 항목 목록 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filteredItems.map((item) => (
          <SearchResultItem
            key={item.id}
            item={item}
            isSaved={savedIds.has(item.id)}
            onDetailCheck={handleDetailCheck}
            onSave={handleSave}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          해당 카테고리에 준비 항목이 없습니다.
        </div>
      )}
    </div>
  )
}

// ─── SearchResultItem ─────────────────────────────────────────────────
// [K1] detail_check_open, [K3] save_complete 이벤트 트리거 지점
function SearchResultItem({ item, isSaved, onDetailCheck, onSave }) {
  return (
    <div
      className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-purple-200 transition-colors cursor-pointer"
      onClick={() => onDetailCheck(item)}  // detail_check_open
    >
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-0.5">
            {item.categoryLabel}
          </span>
        </div>
        <p className="text-sm font-medium text-gray-900">{item.title}</p>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onSave(item)  // save_complete
        }}
        disabled={isSaved}
        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
          isSaved
            ? 'bg-gray-100 text-gray-400 cursor-default'
            : 'bg-purple-600 text-white hover:bg-purple-700'
        }`}
      >
        {isSaved ? '저장됨 ✓' : '저장'}
      </button>
    </div>
  )
}

// ─── 상수 ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'all', label: '전체' },
  { value: 'documents', label: '서류 · 비자' },
  { value: 'packing', label: '준비물' },
  { value: 'booking', label: '예약' },
  { value: 'health', label: '건강 · 보험' },
  { value: 'etc', label: '기타' },
]

// TODO: API 연동 후 제거 - 임시 목 데이터
// GET /api/trips/:id/search?destination=...&companions=... 로 대체
const MOCK_ITEMS = [
  { id: 1, category: 'documents', categoryLabel: '서류 · 비자', title: '여권 유효기간 확인', description: '입국 기준 6개월 이상 남아있어야 합니다.' },
  { id: 2, category: 'documents', categoryLabel: '서류 · 비자', title: '비자 신청', description: '여행지에 따라 사전 비자가 필요할 수 있습니다.' },
  { id: 3, category: 'packing', categoryLabel: '준비물', title: '여행용 어댑터 챙기기', description: '국가별 콘센트 규격을 확인하세요.' },
  { id: 4, category: 'packing', categoryLabel: '준비물', title: '상비약 챙기기', description: '두통약, 소화제, 지사제 등을 준비하세요.' },
  { id: 5, category: 'booking', categoryLabel: '예약', title: '항공권 예약 확인', description: '이름, 날짜, 좌석 등을 다시 확인하세요.' },
  { id: 6, category: 'booking', categoryLabel: '예약', title: '숙소 예약 확인', description: '체크인/체크아웃 시간을 확인하세요.' },
  { id: 7, category: 'health', categoryLabel: '건강 · 보험', title: '여행자 보험 가입', description: '출발 전에 반드시 가입하세요.' },
  { id: 8, category: 'etc', categoryLabel: '기타', title: '로밍 또는 유심 준비', description: '현지 유심이 더 저렴할 수 있습니다.' },
]

export default TripSearchPage
