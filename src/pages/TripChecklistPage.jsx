import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

/**
 * TripChecklistPage - 내 체크리스트 페이지
 *
 * ─── Confirm Loop (DRD-2 / 05_store_loop_strategy_okr.md) ───
 * 흐름: Saved List Open → Edit → Prepare Action
 *
 * [K1] saved_list_open   → edit_start         : CP1 측정
 * [K2] 카테고리별 점검 진입률, Edit 세부 행동  : 카테고리 구조 효과 측정
 * [K3] edit_start        → prepare_action     : CP2 측정
 * [K4] re_store_trigger                       : Backflow 측정
 *
 * Edit 세부 이벤트: edit_add / edit_del / edit_text / edit_reorder
 * 이벤트 정의는 04_meta_okr.md 참고.
 *
 * ⚠️ "항목 더 찾기" 버튼 = re_store_trigger (Backflow)
 *    Confirm Loop 도중 Store Loop로 이동하는 것 = 역류로 집계
 */

// ─── 이벤트 수집 헬퍼 (추후 분석 도구 SDK로 교체) ───────────────────
const trackEvent = (eventName, properties = {}) => {
  // TODO: 분석 도구 연동 후 실제 이벤트 전송으로 교체
  console.debug('[Event]', eventName, properties)
}
// ────────────────────────────────────────────────────────────────────

function TripChecklistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('packing')
  const [items, setItems] = useState(INITIAL_ITEMS)
  const [newItemText, setNewItemText] = useState('')
  const [hasEdited, setHasEdited] = useState(false)

  // [K1] saved_list_open: 페이지 진입 시
  useEffect(() => {
    trackEvent('saved_list_open', { trip_id: id, timestamp: Date.now() })
  }, [id])

  // [K2] 카테고리 탭 전환: 어느 카테고리로 진입했는지 추적
  const handleCategoryChange = (category) => {
    setActiveCategory(category)
    trackEvent('category_tab_open', { trip_id: id, category })
  }

  // [K1] edit_start: 첫 수정 행동 발생 시 1회 수집
  const triggerEditStart = () => {
    if (!hasEdited) {
      trackEvent('edit_start', { trip_id: id })
      setHasEdited(true)
    }
  }

  // [K3] prepare_action: 항목 체크 시
  const handleCheck = (itemId) => {
    triggerEditStart()
    const target = items.find((item) => item.id === itemId)
    const nextChecked = !target?.checked

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    )

    if (nextChecked) {
      trackEvent('prepare_action', {
        trip_id: id,
        item_id: itemId,
        item_category: target?.category,
      })
    }
    // TODO: PATCH /api/trips/:id/checklist/:itemId API 연동
  }

  // [K2] edit_del: 항목 삭제 시
  const handleDelete = (itemId) => {
    triggerEditStart()
    const target = items.find((item) => item.id === itemId)
    setItems((prev) => prev.filter((item) => item.id !== itemId))
    trackEvent('edit_del', {
      trip_id: id,
      item_id: itemId,
      item_category: target?.category,
    })
    // TODO: DELETE /api/trips/:id/checklist/:itemId API 연동
  }

  // [K2] edit_add: 항목 추가 시
  const handleAddItem = (e) => {
    e.preventDefault()
    if (!newItemText.trim()) return
    triggerEditStart()

    const newItem = {
      id: Date.now(),
      category: activeCategory,
      title: newItemText.trim(),
      checked: false,
    }
    setItems((prev) => [...prev, newItem])
    setNewItemText('')

    trackEvent('edit_add', {
      trip_id: id,
      item_category: activeCategory,
      item_title: newItem.title,
    })
    // TODO: POST /api/trips/:id/checklist API 연동
  }

  // [K4] re_store_trigger: Backflow - Confirm Loop → Store Loop 이동
  const handleBackflow = () => {
    trackEvent('re_store_trigger', {
      trip_id: id,
      checked_count: items.filter((i) => i.checked).length,
      total_count: items.length,
    })
    navigate(`/trips/${id}/search`)
  }

  const categoryItems = items.filter((item) => item.category === activeCategory)
  const totalCount = items.length
  const checkedCount = items.filter((item) => item.checked).length

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
          <h1 className="text-2xl font-bold text-gray-900">내 체크리스트</h1>
          <p className="mt-1 text-sm text-gray-500">
            {checkedCount} / {totalCount} 항목 완료
          </p>
        </div>
        {/* re_store_trigger (Backflow) 버튼 */}
        <button
          onClick={handleBackflow}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-colors"
        >
          + 항목 더 찾기
        </button>
      </div>

      {/* 카테고리 탭 - [K2] 카테고리별 점검 진입률 측정 */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {CHECKLIST_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryChange(cat.value)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeCategory === cat.value
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {cat.label}
            <span className="ml-1.5 text-xs text-gray-400">
              ({items.filter((i) => i.category === cat.value).length})
            </span>
          </button>
        ))}
      </div>

      {/* 체크리스트 항목 - [K3] prepare_action / [K2] edit_del 트리거 지점 */}
      <div className="space-y-2 mb-6">
        {categoryItems.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            이 카테고리에 항목이 없습니다. 아래에서 추가해보세요.
          </div>
        ) : (
          categoryItems.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onCheck={handleCheck}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* 항목 직접 추가 - [K2] edit_add 트리거 지점 */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder={`${CHECKLIST_CATEGORIES.find((c) => c.value === activeCategory)?.label}에 항목 추가`}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        <button
          type="submit"
          disabled={!newItemText.trim()}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          추가
        </button>
      </form>
    </div>
  )
}

// ─── ChecklistItem ────────────────────────────────────────────────────
// prepare_action (체크), edit_del (삭제) 이벤트 트리거 지점
function ChecklistItem({ item, onCheck, onDelete }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 transition-colors group">
      <button
        onClick={() => onCheck(item.id)}
        className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
          item.checked
            ? 'bg-purple-600 border-purple-600 text-white'
            : 'border-gray-300 hover:border-purple-400'
        }`}
      >
        {item.checked && <span className="text-xs">✓</span>}
      </button>
      <span
        className={`flex-1 text-sm ${
          item.checked ? 'line-through text-gray-400' : 'text-gray-800'
        }`}
      >
        {item.title}
      </span>
      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-xs px-1"
      >
        삭제
      </button>
    </div>
  )
}

// ─── 상수 ─────────────────────────────────────────────────────────────
const CHECKLIST_CATEGORIES = [
  { value: 'packing', label: '준비물' },
  { value: 'booking', label: '예약' },
  { value: 'documents', label: '서류' },
  { value: 'etc', label: '기타' },
]

// TODO: API 연동 후 제거 - 임시 목 데이터
// GET /api/trips/:id/checklist 로 대체
const INITIAL_ITEMS = [
  { id: 1, category: 'packing', title: '상비약 챙기기', checked: false },
  { id: 2, category: 'packing', title: '여행용 어댑터', checked: false },
  { id: 3, category: 'booking', title: '항공권 예약 확인', checked: true },
  { id: 4, category: 'documents', title: '여권 유효기간 확인', checked: false },
]

export default TripChecklistPage
