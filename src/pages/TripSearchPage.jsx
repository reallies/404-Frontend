import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CATEGORIES, MOCK_ITEMS, TRIP_SEARCH_CONTEXT } from '@/mocks/searchData'
import { saveItemForTrip, loadSavedItems } from '@/utils/savedTripItems'
import { buildTripWindowLabelFromRange } from '@/utils/tripDateFormat'
import { appendGuideArchiveEntry, getGuideArchiveEntry, patchGuideArchiveEntry } from '@/utils/guideArchiveStorage'
import { loadEntryChecklistChecks, saveEntryChecklistChecks } from '@/utils/guideArchiveEntryChecklistStorage'
import { loadActiveTripPlan } from '@/utils/tripPlanContextStorage'
import { buildGuideArchiveListTitle } from '@/utils/guideArchivePresentation'
import { TripFlowMobileBar } from '@/components/common/TripFlowTopBar'
import aiSparklesImg from '@/assets/ai-sparkles.png'

const trackEvent = (eventName, properties = {}) => {
  console.debug('[Event]', eventName, properties)
}

/** 가이드 보관함 entry.items에 넣는 형태로 변환 */
function mapMockItemToArchiveItem(i) {
  return {
    id: i.id,
    category: i.category,
    categoryLabel: i.categoryLabel,
    title: i.title,
    description: i.description,
    detail: i.detail,
  }
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
  const [searchParams] = useSearchParams()
  const archiveEntryIdRaw = searchParams.get('archiveEntry')
  const archiveEntryId =
    archiveEntryIdRaw && String(archiveEntryIdRaw).trim() ? String(archiveEntryIdRaw).trim() : null

  const archiveEntry = useMemo(
    () => (archiveEntryId ? getGuideArchiveEntry(tripId, archiveEntryId) : null),
    [tripId, archiveEntryId],
  )
  const mergeToArchive = Boolean(archiveEntryId && archiveEntry)
  const archiveTargetMissing = Boolean(archiveEntryId && !archiveEntry)

  /** 병합 모드: 보관함에서 연 “여행 필수품 추가” 화면 전용 카피 */
  const pageMainTitle = mergeToArchive ? '여행 필수품 추가' : TRIP_SEARCH_CONTEXT.title
  const sectionHeading = mergeToArchive ? '카테고리별 추가 선택' : '카테고리별 필수품'
  const existingArchiveItemIds = useMemo(
    () => new Set((mergeToArchive ? archiveEntry.items ?? [] : []).map((i) => String(i.id))),
    [mergeToArchive, archiveEntry],
  )

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
    trackEvent('search_start', {
      trip_id: tripId,
      timestamp: t,
      merge_to_archive: mergeToArchive,
      archive_entry_id: archiveEntryId ?? undefined,
    })
  }, [tripId, mergeToArchive, archiveEntryId])

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
    if (existingArchiveItemIds.has(id)) return
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

  /** 확인 모달에서만 실행: 체크리스트 저장 + 가이드 보관함 스냅샷 후 이동 (또는 기존 엔트리에 항목 병합) */
  const handleConfirmSaveAndGoArchive = () => {
    const itemsToSave = MOCK_ITEMS.filter((i) => selectedForSave.has(String(i.id)))
    if (itemsToSave.length === 0) {
      closeSaveConfirmModal()
      return
    }

    if (mergeToArchive) {
      const existing = archiveEntry.items ?? []
      const existingIds = new Set(existing.map((i) => String(i.id)))
      const additions = itemsToSave.filter((i) => !existingIds.has(String(i.id))).map(mapMockItemToArchiveItem)
      if (additions.length === 0) {
        closeSaveConfirmModal()
        return
      }
      const merged = [...existing, ...additions]
      patchGuideArchiveEntry(tripId, archiveEntryId, { items: merged })

      const prevChecks = loadEntryChecklistChecks(tripId, archiveEntryId)
      const mergedChecks = { ...prevChecks }
      for (const it of additions) {
        mergedChecks[String(it.id)] = false
      }
      saveEntryChecklistChecks(tripId, archiveEntryId, mergedChecks)

      additions.forEach((item) => {
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
          mode: 'guide_archive_merge',
          archive_entry_id: archiveEntryId,
          elapsed_ms: searchStartRef.current ? Date.now() - searchStartRef.current : null,
        })
      })

      setSavedIds((prev) => {
        const next = new Set(prev)
        additions.forEach((i) => next.add(String(i.id)))
        return next
      })

      trackEvent('save_confirm_navigate_guide_archive_merge', {
        trip_id: tripId,
        archive_entry_id: archiveEntryId,
        added_count: additions.length,
      })

      window.dispatchEvent(
        new CustomEvent('guide-archive-checklist-saved', {
          detail: { tripId: String(tripId), entryId: String(archiveEntryId), progress: undefined },
        }),
      )

      closeSaveConfirmModal()
      setSelectedForSave(new Set())
      navigate(`/trips/${tripId}/guide-archive/${archiveEntryId}`)
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

    const plan = loadActiveTripPlan()
    const dest = plan?.destination
    const ts = plan?.tripStartDate
    const te = plan?.tripEndDate
    const fromDestination = Boolean(dest && ts && te)

    const nextArchiveList = appendGuideArchiveEntry(tripId, {
      pageTitle: fromDestination
        ? `${dest.country} · ${dest.city} 여행 준비`
        : TRIP_SEARCH_CONTEXT.title,
      pageSubtitle: '',
      destination: fromDestination ? dest.city : TRIP_SEARCH_CONTEXT.destination,
      country: fromDestination ? dest.country : TRIP_SEARCH_CONTEXT.country,
      tripWindowLabel: fromDestination ? buildTripWindowLabelFromRange(ts, te) : TRIP_SEARCH_CONTEXT.tripWindowLabel,
      tripStartDate: fromDestination ? ts : '',
      tripEndDate: fromDestination ? te : '',
      countryCode: fromDestination ? dest.countryCode : '',
      iata: fromDestination ? dest.iata : '',
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
    const newArchiveEntry = nextArchiveList[0]
    if (newArchiveEntry?.id) {
      const checksInit = Object.fromEntries((newArchiveEntry.items ?? []).map((it) => [String(it.id), false]))
      saveEntryChecklistChecks(tripId, newArchiveEntry.id, checksInit)
    }

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
    if (mergeToArchive && archiveEntryId) {
      navigate(`/trips/${tripId}/guide-archive/${archiveEntryId}`)
      return
    }
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

  const pageBg = 'linear-gradient(180deg, #E0F7FA 0%, #F0FDFA 45%, #F8FAFC 100%)'

  return (
    <div className="min-h-screen" style={{ background: pageBg }}>
      <TripFlowMobileBar backTo="/" />

      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => (mergeToArchive ? navigate(-1) : navigate('/'))}
            className="mb-3 hidden items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-900 md:flex"
          >
            {mergeToArchive ? '← 이전으로' : '← 내 여행으로'}
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">{pageMainTitle}</h1>
          {mergeToArchive && archiveEntry ? (
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold text-gray-800">대상 체크리스트</span>
              <span className="text-gray-500"> — </span>
              {buildGuideArchiveListTitle(archiveEntry)}
            </p>
          ) : null}
          {archiveTargetMissing ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              연결된 체크리스트를 찾을 수 없어 일반 검색으로 표시합니다. 보관함에서 다시 들어와 주세요.
            </p>
          ) : null}
        </div>

        {/* 카테고리별 필수품 */}
        <section>
          <h2 className="mb-4 text-lg font-extrabold text-gray-900">{sectionHeading}</h2>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const isAi = cat.value === 'ai_recommend'
              const selected = selectedCategory === cat.value
              const tabClass = isAi
                ? selected
                  ? 'bg-amber-400 text-gray-900 shadow-md'
                  : 'border-2 border-gray-100 bg-white/95 text-gray-800 shadow-sm hover:bg-cyan-50/80'
                : selected
                  ? 'bg-amber-400 text-gray-900 shadow-md'
                  : 'border-2 border-gray-100 bg-white/95 text-gray-600 shadow-sm hover:bg-cyan-50/80'
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
          <p className="mb-5 text-sm font-semibold text-gray-700 md:text-base">
            {mergeToArchive ? (
              <>
                추가 후보 <span className="tabular-nums">{MOCK_ITEMS.length}</span>개
              </>
            ) : (
              <>
                총 검색 결과 : <span className="tabular-nums">{MOCK_ITEMS.length}</span>개
              </>
            )}
          </p>

          {selectedCategory === 'all' ? (
            <div className="space-y-10">
              {groupedItemsAll.map((group) => (
                <div key={group.categoryValue}>
                  <h3
                    className={`mb-3 flex items-center gap-2 border-b pb-2 text-base font-extrabold ${
                      group.categoryValue === 'ai_recommend'
                        ? 'border-violet-200 text-violet-950'
                        : 'border-gray-200 text-gray-900'
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
                        inArchiveAlready={existingArchiveItemIds.has(String(item.id))}
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
                    inArchiveAlready={existingArchiveItemIds.has(String(item.id))}
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
            <p className="text-xs text-slate-600 md:text-sm">
              추가할 항목 <span className="font-bold tabular-nums text-slate-800">{selectedForSave.size}</span>개
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openSaveConfirmModal}
                disabled={selectedForSave.size === 0}
                className="min-h-12 flex-1 rounded-2xl bg-amber-400 px-4 py-3.5 text-sm font-bold text-gray-900 shadow-sm transition-all hover:bg-amber-500 hover:shadow-md disabled:pointer-events-none disabled:opacity-40 sm:flex-none sm:min-w-[7.5rem] sm:px-8"
              >
                {mergeToArchive ? '추가' : '저장'}
              </button>
              <button
                type="button"
                onClick={openHomeConfirmModal}
                className="min-h-12 flex-1 rounded-2xl border-2 border-gray-100 bg-white/95 px-4 py-3.5 text-sm font-bold text-gray-800 shadow-sm transition-colors hover:bg-cyan-50/80 sm:flex-none sm:min-w-[7.5rem] sm:px-8"
              >
                {mergeToArchive ? '뒤로 가기' : '홈으로'}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* 저장 확인 → 가이드 보관함 이동 */}
      {saveConfirmModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-teal-950/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={closeSaveConfirmModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-checklist-modal-title"
            className="relative w-full max-w-md rounded-2xl border border-teal-100/90 bg-white p-6 shadow-2xl shadow-teal-900/15 ring-1 ring-teal-50"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="save-checklist-modal-title"
              className="text-center text-sm font-extrabold leading-relaxed text-gray-900 md:text-base md:leading-snug"
            >
              {mergeToArchive
                ? '선택한 항목을 이 체크리스트에 추가합니다. 확인 시 해당 체크리스트 화면으로 돌아갑니다.'
                : '정말 저장하시겠습니까? 확인 시 가이드 보관함으로 이동하며, 되돌릴 수 없습니다.'}
            </h2>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleConfirmSaveAndGoArchive}
                className="min-h-12 flex-1 rounded-2xl border-2 border-amber-300 bg-amber-50 py-3 text-sm font-bold text-amber-950 shadow-sm transition-colors hover:border-amber-400 hover:bg-amber-100"
              >
                확인
              </button>
              <button
                type="button"
                onClick={closeSaveConfirmModal}
                className="min-h-12 flex-1 rounded-2xl border-2 border-teal-600 bg-white py-3 text-sm font-bold text-teal-800 shadow-sm transition-colors hover:bg-teal-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 홈 이동 확인 모달 */}
      {leaveModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-teal-950/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={handleModalBack}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-modal-title"
            className="relative w-full max-w-sm rounded-2xl border border-teal-100/90 bg-white p-6 shadow-2xl shadow-teal-900/15 ring-1 ring-teal-50"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="leave-modal-title" className="text-center text-base font-extrabold leading-snug text-gray-900">
              저장하지 않으시겠습니까?
            </h2>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleLeaveWithoutSave}
                className="min-h-12 flex-1 rounded-2xl border-2 border-amber-300 bg-amber-50 py-3 text-sm font-bold text-amber-950 shadow-sm transition-colors hover:border-amber-400 hover:bg-amber-100"
              >
                저장안함
              </button>
              <button
                type="button"
                onClick={handleModalBack}
                className="min-h-12 flex-1 rounded-2xl border-2 border-teal-600 bg-white py-3 text-sm font-bold text-teal-800 shadow-sm transition-colors hover:bg-teal-50"
              >
                뒤로 가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SearchResultItem({ item, selected, onToggle, inArchiveAlready = false, className = '' }) {
  const subtitleText = item.description || item.detail || ''

  if (inArchiveAlready) {
    return (
      <div
        className={`w-full rounded-2xl border-2 border-gray-200 bg-cyan-50/40 p-4 text-left shadow-sm ${className}`.trim()}
        role="group"
        aria-label="이미 이 체크리스트에 담긴 항목"
      >
        <div className="flex gap-3">
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-amber-300 bg-amber-100"
            aria-hidden
          >
            <svg className="h-3 w-3 text-amber-800" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M2.5 6.2 5 8.7 9.5 3.3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-extrabold leading-snug text-gray-900">{item.title}</span>
              <span className="rounded-full bg-amber-200/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
                담김
              </span>
            </p>
            {subtitleText ? (
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{subtitleText}</p>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  const btnShell = selected
    ? 'w-full cursor-pointer rounded-2xl border-2 border-amber-400 bg-amber-200/95 p-4 text-left shadow-sm ring-1 ring-amber-300/70 transition-all duration-200'
    : 'w-full cursor-pointer rounded-2xl border-2 border-gray-100 bg-white/95 p-4 text-left shadow-sm transition-all duration-200 hover:bg-cyan-50/80'

  const checkShell = selected ? 'border-amber-600 bg-amber-600' : 'border-gray-300 bg-white'

  return (
    <button type="button" onClick={onToggle} aria-pressed={selected} className={`${btnShell} ${className}`.trim()}>
      <div className="flex gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${checkShell}`}
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
          <p className="text-[15px] font-extrabold leading-snug text-gray-900">{item.title}</p>
          {subtitleText ? (
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{subtitleText}</p>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function TripSearchPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  return <TripSearchInner key={`${id}-${searchParams.toString()}`} tripId={id} />
}

export default TripSearchPage
