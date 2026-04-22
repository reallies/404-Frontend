import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { CATEGORIES, MOCK_ITEMS, TRIP_SEARCH_CONTEXT } from '@/mocks/searchData'
import {
  generateChecklist,
  generateChecklistFromContext,
  selectChecklistItem,
} from '@/api/checklists'
import { adaptGeneratedChecklist, getTabCategories } from '@/utils/checklistAdapter'
import { saveItemForTrip, loadSavedItems } from '@/utils/savedTripItems'
import { buildTripWindowLabelFromRange } from '@/utils/tripDateFormat'
import { appendGuideArchiveEntry, getGuideArchiveEntry, patchGuideArchiveEntry } from '@/utils/guideArchiveStorage'
import { loadEntryChecklistChecks, saveEntryChecklistChecks } from '@/utils/guideArchiveEntryChecklistStorage'
import { loadActiveTripPlan } from '@/utils/tripPlanContextStorage'
import { buildGuideArchiveListTitle } from '@/utils/guideArchivePresentation'
import aiSparklesImg from '@/assets/ai-sparkles.png'

/**
 * 새 여행 플로우(step5 → /trips/1/loading → /trips/1/search) 에서 쓰는 자리표시자 tripId.
 * 이 경우에는 DB 에 Trip 레코드가 아직 없으므로 `/checklists/generate/:tripId` 는 항상 404 가 된다.
 * 프론트에서 먼저 감지해 `generate-from-context` 로 바로 가면 백엔드 `Trip 1 not found` WARN 이 사라진다.
 *
 * 실제 DB 에 저장된 trip 에서 들어올 때는 이 placeholder 가 아닌 진짜 id 가 URL 에 박힌다.
 */
const PLACEHOLDER_TRIP_ID = '1'

const trackEvent = (eventName, properties = {}) => {
  console.debug('[Event]', eventName, properties)
}

/** YYYY-MM-DD → 두 날짜 사이 일수 (최소 1) */
function diffDaysInclusive(startStr, endStr) {
  const s = new Date(startStr)
  const e = new Date(endStr)
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1
  const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return Math.max(1, days)
}

/**
 * 로컬 스토리지에 저장된 여행 플랜을
 * `/checklists/generate-from-context` 바디 형태로 변환.
 * 최소한 destination + durationDays 가 계산 가능해야 null 이 아닌 값을 돌려준다.
 */
function buildContextInputFromPlan(plan) {
  if (!plan?.destination || !plan.tripStartDate || !plan.tripEndDate) return null
  const dest = plan.destination
  const destinationLabel = [dest.country, dest.city].filter(Boolean).join(' (') + (dest.city ? ')' : '')
  const companions = []
  if (plan.companion) companions.push(plan.companion)
  if (plan.hasPet) companions.push('반려동물')
  return {
    destination: destinationLabel || dest.country || dest.city || '국내외 여행지',
    durationDays: diffDaysInclusive(plan.tripStartDate, plan.tripEndDate),
    tripStart: plan.tripStartDate,
    companions,
    purposes: Array.isArray(plan.travelStyles) ? plan.travelStyles : [],
  }
}

/** 가이드 보관함 entry.items에 넣는 형태로 변환 */
function mapMockItemToArchiveItem(i) {
  return {
    id: i.id,
    // 서버 ChecklistItem.id (BigInt stringified). 보관함 수정/삭제 시
    // 서버 is_selected 플래그를 되돌리려면 이 값이 반드시 필요하다.
    serverId: i.serverId ?? null,
    baggageType: i.baggageType,
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
  // StrictMode(dev) 이중 mount 때 동일 요청이 두 번 나가지 않도록 가드.
  // AuthCallbackPage 와 같은 패턴: ranRef 로 중복 실행 방지 + cancelledRef 로 구 effect 결과 무시.
  const loadRanRef = useRef(false)
  const loadCancelledRef = useRef(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [savedIds, setSavedIds] = useState(() => new Set(loadSavedItems(tripId).map((x) => String(x.id))))
  /** 체크리스트에 넣을 항목 선택 (id 문자열) */
  const [selectedForSave, setSelectedForSave] = useState(() => new Set())
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [saveConfirmModalOpen, setSaveConfirmModalOpen] = useState(false)

  /**
   * 백엔드(/checklists/generate/:tripId) 에서 받아온
   * [카테고리별 필수품 템플릿 + LLM AI 맞춤 추천] 을 프론트 모델로 가공한 결과.
   * 로딩 실패 시에는 목데이터로 graceful fallback 한다.
   */
  const [loadState, setLoadState] = useState({ status: 'loading', fromApi: false })
  const [apiItems, setApiItems] = useState([])
  const [apiSections, setApiSections] = useState([])
  const [apiSummary, setApiSummary] = useState(null)

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

  useEffect(() => {
    loadCancelledRef.current = false
    if (loadRanRef.current) return
    loadRanRef.current = true

    setLoadState({ status: 'loading', fromApi: false })

    const applyAdapted = (data, via) => {
      if (loadCancelledRef.current) return
      const adapted = adaptGeneratedChecklist(data)
      setApiItems(adapted.items)
      setApiSections(adapted.sections)
      setApiSummary(adapted.summary)
      setLoadState({ status: 'ready', fromApi: true, via })
      trackEvent('search_items_loaded', {
        trip_id: tripId,
        via,
        total: adapted.items.length,
        from_template: adapted.summary?.fromTemplate ?? 0,
        from_llm: adapted.summary?.fromLlm ?? 0,
        llm_tokens: adapted.summary?.llmTokensUsed ?? 0,
        model: adapted.summary?.model ?? null,
      })
    }

    const applyFallback = (errorMessage) => {
      if (loadCancelledRef.current) return
      setApiItems([])
      setApiSections([])
      setApiSummary(null)
      setLoadState({
        status: 'fallback',
        fromApi: false,
        errorMessage: errorMessage || '알 수 없는 오류',
      })
    }

    ;(async () => {
      const plan = loadActiveTripPlan()
      const contextInput = buildContextInputFromPlan(plan)
      const isPlaceholderTrip = String(tripId) === PLACEHOLDER_TRIP_ID

      // [fast path] 새 여행 플로우(placeholder tripId) + 로컬 플랜이 갖춰진 경우
      // 곧바로 context 엔드포인트를 쓴다. 존재하지 않는 Trip 1 조회를 생략해 백엔드 WARN 로그도 없어진다.
      if (isPlaceholderTrip && contextInput) {
        try {
          const data = await generateChecklistFromContext(contextInput)
          applyAdapted(data, 'context')
          return
        } catch (err) {
          if (loadCancelledRef.current) return
          console.warn(
            '[TripSearchPage] generateFromContext (fast path) 실패, 목데이터로 폴백:',
            err?.message ?? err,
          )
          applyFallback(err?.response?.data?.message || err?.message)
          return
        }
      }

      // [정상 경로] 실제 DB trip 이 있을 때: tripId 엔드포인트 시도 → 실패 시 context 로 재시도.
      try {
        const data = await generateChecklist(tripId)
        applyAdapted(data, 'trip')
        return
      } catch (err1) {
        const status = err1?.response?.status
        if (loadCancelledRef.current) return
        if (status === 404 || status === 400) {
          if (contextInput) {
            try {
              const data2 = await generateChecklistFromContext(contextInput)
              applyAdapted(data2, 'context')
              return
            } catch (err2) {
              if (loadCancelledRef.current) return
              console.warn(
                '[TripSearchPage] generateFromContext 실패, 목데이터로 폴백:',
                err2?.message ?? err2,
              )
            }
          } else {
            console.warn(
              '[TripSearchPage] trip 없음 + 로컬 플랜도 없어 context 재시도 불가 — 목데이터 폴백',
            )
          }
        } else {
          console.warn('[TripSearchPage] generateChecklist 실패, 목데이터로 폴백:', err1?.message ?? err1)
        }
        applyFallback(err1?.response?.data?.message || err1?.message)
      }
    })()

    return () => {
      loadCancelledRef.current = true
    }
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

  /** 현재 렌더링 기준이 되는 데이터 소스: API 성공 시 실데이터, 아니면 목데이터 */
  const sourceItems = loadState.fromApi ? apiItems : MOCK_ITEMS
  const tabCategories = loadState.fromApi ? getTabCategories() : CATEGORIES

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

  /**
   * 백엔드 ChecklistItem 에 is_selected=true 를 마크한다 (fire-and-forget).
   *   - localStorage 저장 결과가 진실(source of truth) 이고, 이 호출은 교차기기/분석용으로만 사용.
   *   - API 실패해도 사용자 플로우는 계속되며 콘솔에만 경고를 남긴다.
   *   - serverId 가 없는 항목(목데이터 fallback, context 기반 생성 등) 은 호출을 건너뛴다.
   */
  const markItemsSelectedOnServer = (items) => {
    const ids = items
      .map((i) => i.serverId)
      .filter((id) => id && String(id).trim())
    if (ids.length === 0) return
    ids.forEach((serverId) => {
      selectChecklistItem(serverId).catch((err) => {
        console.warn(
          `[TripSearchPage] selectChecklistItem(${serverId}) 실패 — localStorage 저장은 완료:`,
          err?.response?.data?.message || err?.message || err,
        )
      })
    })
  }

  /** 확인 모달에서만 실행: 체크리스트 저장 + 가이드 보관함 스냅샷 후 이동 (또는 기존 엔트리에 항목 병합) */
  const handleConfirmSaveAndGoArchive = () => {
    const itemsToSave = sourceItems.filter((i) => selectedForSave.has(String(i.id)))
    if (itemsToSave.length === 0) {
      closeSaveConfirmModal()
      return
    }

    if (mergeToArchive) {
      const existing = archiveEntry.items ?? []
      const existingIds = new Set(existing.map((i) => String(i.id)))
      const selectedSources = itemsToSave.filter((i) => !existingIds.has(String(i.id)))
      const additions = selectedSources.map(mapMockItemToArchiveItem)
      if (additions.length === 0) {
        closeSaveConfirmModal()
        return
      }
      // 서버 측 is_selected 플래그도 병행 갱신 (fire-and-forget, localStorage 가 진실값).
      markItemsSelectedOnServer(selectedSources)
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

    // 서버 측 is_selected 플래그도 병행 갱신 (fire-and-forget, localStorage 가 진실값).
    markItemsSelectedOnServer(itemsToSave)

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
        // 서버 ChecklistItem.id 를 함께 저장해야 보관함에서 삭제 시 deselect 호출이 가능하다.
        serverId: i.serverId ?? null,
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

  /**
   * 전체 탭 그룹핑.
   * - API 성공 시: 백엔드 sections(세부 카테고리) 그대로 사용, AI 추천은 adapter 에서 이미 최상단.
   * - 폴백(목데이터): 기존처럼 상위 탭 단위로 묶어서 표시.
   */
  const groupedItemsAll = useMemo(() => {
    if (loadState.fromApi) {
      return apiSections.map((sec) => ({
        categoryValue: sec.categoryCode,
        categoryLabel: sec.categoryLabel,
        items: sec.items,
      }))
    }
    const order = CATEGORIES.filter((c) => c.value !== 'all').map((c) => c.value)
    const sectionOrder = ['ai_recommend', ...order.filter((v) => v !== 'ai_recommend')]
    return sectionOrder
      .map((value) => {
        const cat = CATEGORIES.find((c) => c.value === value)
        if (!cat) return null
        const items = MOCK_ITEMS.filter((i) => i.category === value).sort((a, b) =>
          a.title.localeCompare(b.title, 'ko'),
        )
        return { categoryValue: value, categoryLabel: cat.label, items }
      })
      .filter((g) => g && g.items.length > 0)
  }, [loadState.fromApi, apiSections])

  /** 단일 카테고리 탭: 상위 탭(preparedness 카테고리) 기준으로 필터. */
  const sortedItemsSingleCategory = useMemo(() => {
    if (selectedCategory === 'all') return []
    if (loadState.fromApi) {
      return apiItems.filter((item) => item.category === selectedCategory)
    }
    return MOCK_ITEMS.filter((item) => item.category === selectedCategory).sort((a, b) =>
      a.title.localeCompare(b.title, 'ko'),
    )
  }, [selectedCategory, loadState.fromApi, apiItems])

  const totalItemCount = sourceItems.length
  const aiRecommendCount = sourceItems.filter((i) => i.category === 'ai_recommend').length

  const pageBg = 'linear-gradient(180deg, #E0F7FA 0%, #F0FDFA 45%, #F8FAFC 100%)'

  return (
    <div className="min-h-screen" style={{ background: pageBg }}>
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <div className="mb-8">
          {mergeToArchive ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-3 flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-900 md:hidden"
            >
              ← 이전으로
            </button>
          ) : (
            <Link
              to="/"
              className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-900 md:hidden"
            >
              ← 내 여행으로
            </Link>
          )}
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
          {loadState.status === 'fallback' ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              맞춤 추천 데이터를 불러오지 못했습니다. 임시로 예시 데이터를 표시합니다. (서버 연결·로그인 상태를 확인해 주세요)
            </p>
          ) : null}
          {loadState.status === 'ready' && apiSummary ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600 md:text-sm">
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 font-semibold text-violet-800">
                <AiSparkleMaskIcon selected={false} className="h-3.5 w-3.5" />
                AI 맞춤 추천 <span className="tabular-nums">{aiRecommendCount}</span>개
              </span>
              <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-800">
                카테고리 필수품 <span className="ml-1 tabular-nums">{Math.max(0, totalItemCount - aiRecommendCount)}</span>개
              </span>
              {apiSummary.model ? (
                <span className="text-[11px] text-slate-400 md:text-xs">모델 {apiSummary.model}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* 카테고리별 필수품 */}
        <section>
          <h2 className="mb-4 text-lg font-extrabold text-gray-900">{sectionHeading}</h2>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-thin">
            {tabCategories.map((cat) => {
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
                추가 후보 <span className="tabular-nums">{totalItemCount}</span>개
              </>
            ) : (
              <>
                총 검색 결과 : <span className="tabular-nums">{totalItemCount}</span>개
              </>
            )}
          </p>

          {loadState.status === 'loading' ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-20 animate-pulse rounded-2xl border-2 border-gray-100 bg-white/80 shadow-sm"
                  aria-hidden
                />
              ))}
              <p className="mt-2 text-center text-sm text-gray-500">
                AI 맞춤 추천과 카테고리별 필수품을 준비 중입니다…
              </p>
            </div>
          ) : selectedCategory === 'all' ? (
            <div className="space-y-10">
              {groupedItemsAll.map((group) => {
                const isAi = group.categoryValue === 'ai_recommend'
                return (
                  <div key={group.categoryValue}>
                    <h3
                      className={`mb-3 flex items-center gap-2 border-b pb-2 text-base font-extrabold ${
                        isAi ? 'border-violet-200 text-violet-950' : 'border-gray-200 text-gray-900'
                      }`}
                    >
                      {isAi ? <AiSparkleMaskIcon selected={false} className="h-4 w-4" /> : null}
                      {group.categoryLabel}
                      <span className="ml-1 text-xs font-semibold text-gray-400 tabular-nums">
                        ({group.items.length})
                      </span>
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
                )
              })}
              {groupedItemsAll.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400">표시할 항목이 없습니다.</div>
              ) : null}
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
              {mergeToArchive ? (
                '선택한 항목을 이 체크리스트에 추가합니다. 확인 시 해당 체크리스트 화면으로 돌아갑니다.'
              ) : (
                <>
                  저장하시겠습니까?
                  <br />
                  확인 버튼을 클릭하면 체크리스트로 전환됩니다
                </>
              )}
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
