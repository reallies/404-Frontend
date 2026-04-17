import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { CATEGORIES, MOCK_ITEMS, TRIP_SEARCH_CONTEXT } from '@/mocks/searchData'
import { saveItemForTrip, loadSavedItems } from '@/utils/savedTripItems'
import { appendGuideArchiveEntry } from '@/utils/guideArchiveStorage'
import { TripFlowMobileBar } from '@/components/common/TripFlowTopBar'
import aiSparklesImg from '@/assets/ai-sparkles.png'

const trackEvent = (eventName, properties = {}) => {
  console.debug('[Event]', eventName, properties)
}

/** PNG를 마스크로 써서 버튼·섹션 제목에 맞는 단색으로 표시 */
function AiSparkleMaskIcon({ selected, className = 'h-3.5 w-3.5' }) {
  const mask = {
    maskImage: `url(${aiSparklesImg})`,
    WebkitMaskImage: `url(${aiSparklesImg})`,
    maskSize: 'contain',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
  }
  return (
    <span
      className={`inline-block shrink-0 ${className} ${selected ? 'bg-white' : 'bg-violet-700'}`}
      style={mask}
      aria-hidden
    />
  )
}

function TripSearchInner({ tripId }) {
  const navigate = useNavigate()
  const searchStartRef = useRef(0)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [savedIds, setSavedIds] = useState(() => new Set(loadSavedItems(tripId).map((x) => String(x.id))))
  /** 체크리스트에 넣을 항목 선택 (id 문자열) */
  const [selectedForSave, setSelectedForSave] = useState(() => new Set())
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [saveConfirmModalOpen, setSaveConfirmModalOpen] = useState(false)

  useEffect(() => {
    const t = Date.now()
    searchStartRef.current = t
    trackEvent('search_start', { trip_id: tripId, timestamp: t })
  }, [tripId])

  const handleCategoryChange = (category) => {
    if (selectedCategory !== 'all' && category !== selectedCategory) {
      trackEvent('research_trigger', {
        trip_id: tripId,
        from_category: selectedCategory,
        to_category: category,
      })
    }
    setSelectedCategory(category)
  }

  const toggleItemSelect = (item) => {
    const id = String(item.id)
    setSelectedForSave((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    trackEvent('search_item_toggle_select', {
      trip_id: tripId,
      item_id: item.id,
      item_category: item.category,
      selected_after: !selectedForSave.has(id),
    })
  }

  const openSaveConfirmModal = () => {
    if (selectedForSave.size === 0) return
    setSaveConfirmModalOpen(true)
  }

  const closeSaveConfirmModal = () => setSaveConfirmModalOpen(false)

  /** 확인 모달에서만 실행: 체크리스트 저장 + 가이드 보관함 스냅샷 후 이동 */
  const handleConfirmSaveAndGoArchive = () => {
    const itemsToSave = MOCK_ITEMS.filter((i) => selectedForSave.has(String(i.id)))
    if (itemsToSave.length === 0) {
      closeSaveConfirmModal()
      return
    }

    itemsToSave.forEach((item) => {
      if (savedIds.has(String(item.id))) return
      saveItemForTrip(tripId, {
        id: item.id,
        category: item.category,
        title: item.title,
        subtitle: item.detail || item.description || '',
      })
      trackEvent('save_complete', {
        trip_id: tripId,
        item_id: item.id,
        item_category: item.category,
        elapsed_ms: searchStartRef.current ? Date.now() - searchStartRef.current : null,
      })
    })

    setSavedIds((prev) => {
      const next = new Set(prev)
      itemsToSave.forEach((i) => next.add(String(i.id)))
      return next
    })

    appendGuideArchiveEntry(tripId, {
      pageTitle: TRIP_SEARCH_CONTEXT.title,
      pageSubtitle: '',
      destination: TRIP_SEARCH_CONTEXT.destination,
      country: TRIP_SEARCH_CONTEXT.country,
      tripWindowLabel: TRIP_SEARCH_CONTEXT.tripWindowLabel,
      weatherSummary: TRIP_SEARCH_CONTEXT.weatherSummary,
      temperatureRange: TRIP_SEARCH_CONTEXT.temperatureRange,
      rainChance: TRIP_SEARCH_CONTEXT.rainChance,
      environmentTags: TRIP_SEARCH_CONTEXT.environmentTags.map((t) => ({ ...t })),
      phaseHints: TRIP_SEARCH_CONTEXT.phaseHints.map((p) => ({ ...p })),
      items: itemsToSave.map((i) => ({
        id: i.id,
        category: i.category,
        categoryLabel: i.categoryLabel,
        title: i.title,
        description: i.description,
        detail: i.detail,
      })),
      dailySummaries: [],
      dailyGuidesFull: [],
    })

    trackEvent('save_confirm_navigate_guide_archive', {
      trip_id: tripId,
      item_count: itemsToSave.length,
    })

    closeSaveConfirmModal()
    navigate(`/trips/${tripId}/guide-archive`)
  }

  const openHomeConfirmModal = () => setLeaveModalOpen(true)

  const handleLeaveWithoutSave = () => {
    setLeaveModalOpen(false)
    navigate('/')
  }

  const handleModalBack = () => setLeaveModalOpen(false)

  /** 전체 탭: AI 맞춤 추천을 맨 위, 나머지 카테고리는 ㄱㄴㄷ 순 */
  const groupedItemsAll = useMemo(() => {
    const cats = CATEGORIES.filter((c) => c.value !== 'all')
    const aiCat = cats.find((c) => c.value === 'ai_recommend')
    const rest = cats.filter((c) => c.value !== 'ai_recommend')
    const sortedRest = [...rest].sort((a, b) => a.label.localeCompare(b.label, 'ko'))
    const orderedCats = aiCat ? [aiCat, ...sortedRest] : sortedRest
    return orderedCats
      .map((cat) => ({
        categoryValue: cat.value,
        categoryLabel: cat.label,
        items: MOCK_ITEMS.filter((i) => i.category === cat.value).sort((a, b) =>
          a.title.localeCompare(b.title, 'ko'),
        ),
      }))
      .filter((g) => g.items.length > 0)
  }, [])

  /** 단일 카테고리 탭: 제목 ㄱㄴㄷ 순 */
  const sortedItemsSingleCategory = useMemo(() => {
    if (selectedCategory === 'all') return []
    return MOCK_ITEMS.filter((item) => item.category === selectedCategory).sort((a, b) =>
      a.title.localeCompare(b.title, 'ko'),
    )
  }, [selectedCategory])

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #E0F7FA 0%, #F8FAFC 55%, #F1F5F9 100%)' }}
    >
      <TripFlowMobileBar backTo="/" />

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-3 hidden items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-900 md:flex"
          >
            ← 내 여행으로
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
            {TRIP_SEARCH_CONTEXT.title}
          </h1>
        </div>

        {/* 카테고리별 필수품 */}
        <section>
          <h2 className="mb-4 text-lg font-extrabold text-gray-900">카테고리별 필수품</h2>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const isAi = cat.value === 'ai_recommend'
              const selected = selectedCategory === cat.value
              const tabClass = isAi
                ? selected
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'border border-violet-200 bg-violet-50 text-violet-900 hover:border-violet-400 hover:bg-violet-100'
                : selected
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-teal-300'
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${tabClass}`}
                >
                  {isAi ? <AiSparkleMaskIcon selected={selected} /> : null}
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* 총 검색 결과 건수 — 카테고리 탭과 무관하게 전체 목록 기준 */}
          <p className="mb-2 text-sm font-semibold text-gray-700 md:text-base">
            총 검색 결과 : <span className="tabular-nums">{MOCK_ITEMS.length}</span>개
          </p>
          <p className="mb-5 text-sm text-gray-600">
            체크리스트에 넣을 항목을 눌러 선택한 뒤, 하단 <strong className="text-gray-800">저장</strong>을 누르세요.
          </p>

          {selectedCategory === 'all' ? (
            <div className="space-y-10">
              {groupedItemsAll.map((group) => (
                <div key={group.categoryValue}>
                  <h3
                    className={`mb-3 flex items-center gap-2 border-b pb-2 text-base font-extrabold ${
                      group.categoryValue === 'ai_recommend'
                        ? 'border-violet-200 text-violet-950'
                        : 'border-teal-100 text-gray-900'
                    }`}
                  >
                    {group.categoryValue === 'ai_recommend' ? (
                      <AiSparkleMaskIcon selected={false} className="h-4 w-4" />
                    ) : null}
                    {group.categoryLabel}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {group.items.map((item) => (
                      <SearchResultItem
                        key={item.id}
                        item={item}
                        selected={selectedForSave.has(String(item.id))}
                        onToggle={() => toggleItemSelect(item)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {sortedItemsSingleCategory.map((item) => (
                  <SearchResultItem
                    key={item.id}
                    item={item}
                    selected={selectedForSave.has(String(item.id))}
                    onToggle={() => toggleItemSelect(item)}
                  />
                ))}
              </div>
              {sortedItemsSingleCategory.length === 0 && (
                <div className="py-16 text-center text-sm text-gray-400">해당 카테고리에 항목이 없습니다.</div>
              )}
            </>
          )}

          {/* 저장 · 홈으로 */}
          <div className="mt-8 flex flex-col gap-3 border-t border-gray-200/80 pt-6">
            <p className="text-xs text-gray-500 md:text-sm">
              선택됨 <span className="font-bold tabular-nums text-teal-800">{selectedForSave.size}</span>개
            </p>
            <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openSaveConfirmModal}
              disabled={selectedForSave.size === 0}
              className="min-h-12 flex-1 rounded-2xl bg-teal-700 px-4 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-teal-800 disabled:pointer-events-none disabled:opacity-40 sm:flex-none sm:min-w-[7.5rem] sm:px-8"
            >
              저장
            </button>
            <button
              type="button"
              onClick={openHomeConfirmModal}
              className="min-h-12 flex-1 rounded-2xl border-2 border-gray-300 bg-white px-4 py-3.5 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50 sm:flex-none sm:min-w-[7.5rem] sm:px-8"
            >
              홈으로
            </button>
            </div>
          </div>
        </section>
      </div>

      {/* 저장 확인 → 가이드 보관함 이동 */}
      {saveConfirmModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45"
          role="presentation"
          onClick={closeSaveConfirmModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-checklist-modal-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              id="save-checklist-modal-title"
              className="text-center text-sm font-semibold text-gray-900 leading-relaxed mb-8"
            >
              정말 저장하시겠습니까? 저장 후 체크리스트로 이동 버튼을 클릭하면 되돌릴 수 없습니다.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={closeSaveConfirmModal}
                className="min-h-12 flex-1 rounded-xl border-2 border-teal-600 bg-white py-3 text-sm font-bold text-teal-800 transition-colors hover:bg-teal-50"
              >
                뒤로 가기
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveAndGoArchive}
                className="min-h-12 flex-1 rounded-xl bg-teal-700 py-3 text-sm font-bold text-white transition-colors hover:bg-teal-800"
              >
                저장 후 체크리스트로 이동
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 홈 이동 확인 모달 */}
      {leaveModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45"
          role="presentation"
          onClick={handleModalBack}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-modal-title"
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="leave-modal-title" className="text-center text-base font-bold text-gray-900 leading-snug mb-8">
              저장하지 않으시겠습니까?
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleModalBack}
                className="flex-1 rounded-xl border-2 border-teal-600 bg-white py-3 text-sm font-bold text-teal-800 hover:bg-teal-50 transition-colors"
              >
                뒤로 가기
              </button>
              <button
                type="button"
                onClick={handleLeaveWithoutSave}
                className="flex-1 rounded-xl bg-gray-200 hover:bg-gray-300 py-3 text-sm font-bold text-gray-800 transition-colors"
              >
                저장안함
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SearchResultItem({ item, selected, onToggle, className = '' }) {
  const subtitleText = item.description || item.detail || ''

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`w-full cursor-pointer rounded-xl border bg-white p-4 text-left transition-colors hover:bg-gray-50/80 ${
        selected ? 'border-teal-500 ring-1 ring-teal-200' : 'border-gray-200'
      } ${className}`.trim()}
    >
      <div className="flex gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
            selected ? 'border-teal-600 bg-teal-600' : 'border-gray-300 bg-white'
          }`}
          aria-hidden
        >
          {selected ? (
            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M2.5 6.2 5 8.7 9.5 3.3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold leading-snug text-gray-900">{item.title}</p>
          {subtitleText ? (
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{subtitleText}</p>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function TripSearchPage() {
  const { id } = useParams()
  const location = useLocation()
  return <TripSearchInner key={`${id}-${location.key}`} tripId={id} />
}

export default TripSearchPage
