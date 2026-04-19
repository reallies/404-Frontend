import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useLocation, Link, useSearchParams } from 'react-router-dom'
import { loadGuideArchive, removeGuideArchiveEntriesByIds } from '@/utils/guideArchiveStorage'
import { loadSavedItems } from '@/utils/savedTripItems'
import {
  hasGuideArchiveDesignDemos,
  seedGuideArchiveDesignDemos,
  toggleGuideArchiveDesignDemos,
} from '@/mocks/guideArchiveDesignDemos'
import { TripFlowMobileBar } from '@/components/common/TripFlowTopBar'
import GuideArchiveProgressBar from '@/components/guide/GuideArchiveProgressBar'
import { buildGuideArchiveDateLine, buildGuideArchiveListTitle } from '@/utils/guideArchivePresentation'
import { loadEntryChecklistChecks } from '@/utils/guideArchiveEntryChecklistStorage'

/** 보관함 entry별 저장된 체크 우선, 없으면 탐색 저장분(레거시)으로 진행률 계산 */
function computeProgressPercent(entry, savedItems, tripId) {
  const items = entry.items || []
  if (items.length === 0) return 0
  const scoped = loadEntryChecklistChecks(tripId, entry.id)
  const savedById = new Map(savedItems.map((s) => [String(s.id), s]))
  const hasOwn = Object.prototype.hasOwnProperty.bind(scoped)
  let checked = 0
  for (const it of items) {
    const id = String(it.id)
    if (hasOwn(id)) {
      if (scoped[id]) checked += 1
    } else if (savedById.get(id)?.checked) {
      checked += 1
    }
  }
  return Math.round((checked / items.length) * 100)
}

/** 0: 미작성 · 1~99: 작성중 · 100: 완료 */
function getProgressStatusLabel(progress) {
  if (progress <= 0) return '미작성'
  if (progress >= 100) return '완료'
  return '작성중'
}

function CalendarIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 7V5m8 2V5m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** 모바일 필터 트리거 — 리스트/슬라이더 형태 필터 아이콘 */
function FilterIcon({ className = 'h-6 w-6' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
  )
}

const FILTER_TABS = [
  { id: 'all', label: '전체' },
  { id: 'draft', label: '미작성' },
  { id: 'writing', label: '작성중' },
  { id: 'completed', label: '완료' },
]

/** 모바일 필터 시트: 아래로 이 정도 이상 드래그 시 닫음 */
const GA_FILTER_SHEET_DISMISS_PX = 100
/** `animationend` 미발생(접근성·브라우저) 시에도 `closing` → `closed`로 복구 — API/애널리틱스와 무관한 UI 안전장치 */
const GA_FILTER_SHEET_CLOSE_FALLBACK_MS = 480

function isDemoDesignEntry(entry) {
  return String(entry.id).startsWith('demo-design-')
}

function TripGuideArchiveInner({ tripId }) {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [entries, setEntries] = useState(() => loadGuideArchive(tripId))
  const [savedItems, setSavedItems] = useState(() => loadSavedItems(tripId))
  const [filterTab, setFilterTab] = useState('all')
  const [deleteMode, setDeleteMode] = useState(false)
  const [selectedEntryIds, setSelectedEntryIds] = useState([])
  /** 모바일: 필터 시트 — closed | open | closing(닫힘 애니메이션) */
  const [filterSheetPhase, setFilterSheetPhase] = useState('closed')
  const [filterEnterAnimActive, setFilterEnterAnimActive] = useState(false)
  const [sheetPullY, setSheetPullY] = useState(0)
  const [sheetPullDragging, setSheetPullDragging] = useState(false)
  const filterPhaseRef = useRef('closed')
  const sheetPullAmountRef = useRef(0)
  const sheetPullDragRef = useRef({ active: false, startY: 0 })
  /** 상세에서 저장 시 진행률 재계산(체크 상태는 entry 스토리지에 있음) */
  const [checklistRevision, setChecklistRevision] = useState(0)

  const activeFilterLabel = FILTER_TABS.find((t) => t.id === filterTab)?.label ?? '전체'

  const openFilterSheet = useCallback(() => {
    setFilterEnterAnimActive(true)
    setFilterSheetPhase((p) => (p === 'closed' ? 'open' : p))
  }, [])

  const closeFilterSheet = useCallback(() => {
    setSheetPullY(0)
    sheetPullAmountRef.current = 0
    sheetPullDragRef.current.active = false
    setSheetPullDragging(false)
    setFilterSheetPhase((p) => (p === 'open' ? 'closing' : p))
  }, [])

  useEffect(() => {
    filterPhaseRef.current = filterSheetPhase
  }, [filterSheetPhase])

  /** 닫힘 CSS 애니메이션의 `animationend`가 오지 않아도 스크롤 잠금·상태가 풀리도록 백업 */
  useEffect(() => {
    if (filterSheetPhase !== 'closing') return
    const id = window.setTimeout(() => {
      setFilterSheetPhase((prev) => (prev === 'closing' ? 'closed' : prev))
    }, GA_FILTER_SHEET_CLOSE_FALLBACK_MS)
    return () => window.clearTimeout(id)
  }, [filterSheetPhase])

  useLayoutEffect(() => {
    if (filterSheetPhase !== 'open') return
    setSheetPullY(0)
    sheetPullAmountRef.current = 0
    setSheetPullDragging(false)
    sheetPullDragRef.current.active = false
  }, [filterSheetPhase])

  const refreshFromStorage = useCallback(() => {
    setEntries(loadGuideArchive(tripId))
    setSavedItems(loadSavedItems(tripId))
  }, [tripId])

  useEffect(() => {
    const onSaved = () => setChecklistRevision((n) => n + 1)
    window.addEventListener('guide-archive-checklist-saved', onSaved)
    return () => window.removeEventListener('guide-archive-checklist-saved', onSaved)
  }, [])

  useEffect(() => {
    refreshFromStorage()
  }, [tripId, location.key, refreshFromStorage])

  /** URL: ?demo=1 로 접속 시 예시 자동 삽입(이미 예시만 있으면 갱신하지 않음) */
  useEffect(() => {
    if (searchParams.get('demo') !== '1') return
    if (!hasGuideArchiveDesignDemos(tripId)) {
      seedGuideArchiveDesignDemos(tripId)
    }
    refreshFromStorage()
    const next = new URLSearchParams(searchParams)
    next.delete('demo')
    setSearchParams(next, { replace: true })
  }, [tripId, searchParams, setSearchParams, refreshFromStorage])

  const demosActive = entries.some((e) => String(e.id).startsWith('demo-design-'))

  const handleToggleDesignDemos = () => {
    toggleGuideArchiveDesignDemos(tripId)
    refreshFromStorage()
  }

  const entriesWithMeta = useMemo(() => {
    return entries.map((entry) => {
      const progress = computeProgressPercent(entry, savedItems, tripId)
      return { entry, progress, statusLabel: getProgressStatusLabel(progress) }
    })
  }, [entries, savedItems, tripId, checklistRevision])

  const filtered = useMemo(() => {
    if (filterTab === 'all') return entriesWithMeta
    if (filterTab === 'draft') return entriesWithMeta.filter((x) => x.progress === 0)
    if (filterTab === 'writing') return entriesWithMeta.filter((x) => x.progress > 0 && x.progress < 100)
    if (filterTab === 'completed') return entriesWithMeta.filter((x) => x.progress >= 100)
    return entriesWithMeta
  }, [entriesWithMeta, filterTab])

  const toggleEntrySelect = (entryId) => {
    const id = String(entryId)
    setSelectedEntryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const allEntriesSelected = useMemo(() => {
    if (entries.length === 0) return false
    const ids = entries.map((e) => String(e.id))
    return ids.every((id) => selectedEntryIds.includes(id))
  }, [entries, selectedEntryIds])

  const handleSelectAllEntries = () => {
    setSelectedEntryIds((prev) => {
      const allIds = entries.map((e) => String(e.id))
      const allOn = allIds.length > 0 && allIds.every((id) => prev.includes(id))
      return allOn ? [] : allIds
    })
  }

  const exitDeleteMode = () => {
    setDeleteMode(false)
    setSelectedEntryIds([])
  }

  const handleDeleteSelected = () => {
    if (selectedEntryIds.length === 0) return
    if (!window.confirm(`선택한 ${selectedEntryIds.length}개 항목을 삭제할까요? 되돌릴 수 없습니다.`)) return
    removeGuideArchiveEntriesByIds(tripId, selectedEntryIds)
    exitDeleteMode()
    refreshFromStorage()
  }

  const enterDeleteMode = () => {
    setDeleteMode(true)
    setSelectedEntryIds([])
  }

  useEffect(() => {
    if (entries.length === 0) {
      setDeleteMode(false)
      setSelectedEntryIds([])
    }
  }, [entries.length])

  useEffect(() => {
    if (filterSheetPhase === 'closed') return
    const onKey = (e) => {
      if (e.key === 'Escape') closeFilterSheet()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filterSheetPhase, closeFilterSheet])

  useEffect(() => {
    if (filterSheetPhase === 'closed') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [filterSheetPhase])

  useEffect(() => {
    const onResize = () => {
      if (typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 768px)').matches) {
        setFilterSheetPhase('closed')
        setSheetPullY(0)
        sheetPullAmountRef.current = 0
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const onFilterSheetPullStart = useCallback(
    (e) => {
      if (filterPhaseRef.current !== 'open') return
      sheetPullDragRef.current = { active: true, startY: e.touches[0].clientY }
      setSheetPullDragging(true)
    },
    [],
  )

  const onFilterSheetPullMove = useCallback((e) => {
    if (!sheetPullDragRef.current.active || filterPhaseRef.current !== 'open') return
    const dy = e.touches[0].clientY - sheetPullDragRef.current.startY
    if (dy > 0) {
      setSheetPullY(dy)
      sheetPullAmountRef.current = dy
      e.preventDefault()
    }
  }, [])

  const onFilterSheetPullEnd = useCallback(() => {
    if (!sheetPullDragRef.current.active) return
    sheetPullDragRef.current.active = false
    setSheetPullDragging(false)
    const d = sheetPullAmountRef.current
    if (d >= GA_FILTER_SHEET_DISMISS_PX) {
      closeFilterSheet()
    } else {
      setSheetPullY(0)
    }
    sheetPullAmountRef.current = 0
  }, [closeFilterSheet])

  const onFilterSheetPanelAnimEnd = useCallback((e) => {
    const name = e.animationName
    if (name === 'guide-archive-filter-sheet-down' && filterPhaseRef.current === 'closing') {
      setFilterSheetPhase('closed')
      return
    }
    if (name === 'guide-archive-filter-sheet-up' && filterPhaseRef.current === 'open') {
      setFilterEnterAnimActive(false)
    }
  }, [])

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #E0F7FA 0%, #F8FAFC 55%, #F1F5F9 100%)' }}
    >
      <TripFlowMobileBar backTo="/" />

      {/* ——— 모바일: 헤더 ——— */}
      <div className="px-4 pb-2 pt-4 md:hidden">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-900/90">MY COLLECTIONS</p>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight text-[#0a3d3d]">나의 체크리스트</h1>
        <button
          type="button"
          onClick={handleToggleDesignDemos}
          className={`mt-3 w-full rounded-xl border py-2.5 text-xs font-bold shadow-sm transition-colors ${
            demosActive
              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              : 'border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100'
          }`}
        >
          {demosActive ? '예시 닫기 (원래 목록)' : '예시 불러오기 (0% · 50% · 100%)'}
        </button>
      </div>

      {/* ——— 웹: 헤더 ——— */}
      <div className="mx-auto hidden max-w-5xl px-8 pb-2 pt-10 md:block">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">YOUR ARCHIVE</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl">나의 체크리스트</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              계획 중인 모험과 소중한 추억이 담긴 모든 체크리스트를 한곳에서 관리하세요.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleToggleDesignDemos}
              className={`rounded-xl border px-4 py-2.5 text-sm font-bold shadow-sm transition-colors ${
                demosActive
                  ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  : 'border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100'
              }`}
            >
              {demosActive ? '예시 닫기 (원래 목록)' : '예시 불러오기 (0% · 50% · 100%)'}
            </button>
          </div>
        </div>
      </div>

      {/* 탭 + 삭제 — md+: 인라인 탭 / 모바일: 필터 버튼 + 커튼 시트 (시트 열릴 때 z를 낮춰 백드롭·시트 아래로) */}
      <div className="relative mx-auto max-w-5xl px-4 md:px-8">
        <div
          className={`relative mt-3 flex w-full items-center gap-2 max-md:flex-nowrap md:flex-wrap md:mt-2 ${
            filterSheetPhase !== 'closed' ? 'z-0 max-md:pointer-events-none' : 'z-10'
          }`}
        >
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-100/90 bg-white/95 text-teal-800 shadow-sm ring-1 ring-teal-50/80 transition-colors hover:bg-teal-50/60 active:bg-teal-100/50 md:hidden"
            onClick={openFilterSheet}
            aria-expanded={filterSheetPhase === 'open'}
            aria-haspopup="dialog"
            aria-controls="guide-archive-filter-sheet"
            aria-label={`체크리스트 필터 (${activeFilterLabel})`}
          >
            <FilterIcon className="h-6 w-6" />
          </button>

          <div
            className="hidden flex-wrap gap-1 rounded-full border border-slate-200/80 bg-white/90 p-1 shadow-sm md:inline-flex md:border-slate-200 md:bg-slate-50/80"
            role="tablist"
            aria-label="체크리스트 필터"
          >
            {FILTER_TABS.map((tab) => {
              const active = filterTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilterTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors md:px-6 md:py-2.5 ${
                    active
                      ? 'bg-slate-200/90 text-slate-900 shadow-sm md:bg-sky-100 md:text-sky-950'
                      : 'text-slate-500 hover:text-slate-800 md:text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {entries.length > 0 && !deleteMode ? (
            <button
              type="button"
              onClick={enterDeleteMode}
              className="ml-auto shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 shadow-sm transition-colors hover:bg-red-50 md:rounded-xl md:px-4 md:py-2.5 md:text-sm"
            >
              삭제
            </button>
          ) : null}
          {entries.length > 0 && deleteMode ? (
            <div className="ml-auto flex min-w-0 max-w-full shrink-0 items-center justify-end gap-1.5 max-md:flex-1 max-md:flex-nowrap max-md:overflow-x-auto max-md:scrollbar-hide md:flex-wrap md:gap-2">
              <button
                type="button"
                onClick={handleSelectAllEntries}
                className="shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11px] font-bold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 max-md:whitespace-nowrap md:rounded-xl md:px-4 md:py-2.5 md:text-sm"
              >
                {allEntriesSelected ? '전체 해제' : '전체선택'}
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={selectedEntryIds.length === 0}
                className="shrink-0 rounded-lg border border-red-300 bg-red-50 px-2 py-2 text-[11px] font-bold text-red-800 shadow-sm transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 max-md:whitespace-nowrap md:rounded-xl md:px-4 md:py-2.5 md:text-sm"
              >
                선택한 목록 삭제
              </button>
              <button
                type="button"
                onClick={exitDeleteMode}
                className="shrink-0 rounded-lg border border-gray-200 bg-white px-2 py-2 text-[11px] font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 max-md:whitespace-nowrap md:rounded-xl md:px-4 md:py-2.5 md:text-sm"
              >
                취소
              </button>
            </div>
          ) : null}
        </div>

        {filterSheetPhase !== 'closed' ? (
          <>
            <button
              type="button"
              className={`fixed inset-0 z-[100] bg-teal-950/35 backdrop-blur-[2px] transition-opacity duration-200 md:hidden ${
                filterSheetPhase === 'closing' ? 'opacity-0' : 'opacity-100'
              }`}
              aria-label="필터 닫기"
              onClick={closeFilterSheet}
            />
            <div
              id="guide-archive-filter-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="guide-archive-filter-sheet-title"
              className="fixed inset-x-0 bottom-0 z-[110] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
              style={
                filterSheetPhase === 'open'
                  ? {
                      transform: sheetPullY > 0 ? `translateY(${sheetPullY}px)` : undefined,
                      transition: sheetPullDragging ? 'none' : 'transform 0.26s cubic-bezier(0.22, 1, 0.36, 1)',
                    }
                  : undefined
              }
            >
              <div
                className={`mx-auto max-w-lg overflow-hidden rounded-t-[1.75rem] border border-b-0 border-teal-200/70 bg-gradient-to-t from-teal-50/50 via-white to-white shadow-[0_-20px_48px_-12px_rgba(13,148,136,0.28)] ${
                  filterSheetPhase === 'open' && filterEnterAnimActive ? 'guide-archive-filter-sheet-up' : ''
                }${filterSheetPhase === 'closing' ? ' guide-archive-filter-sheet-down' : ''}`}
                onAnimationEnd={onFilterSheetPanelAnimEnd}
              >
                <div
                  className="touch-none select-none"
                  onTouchStart={onFilterSheetPullStart}
                  onTouchMove={onFilterSheetPullMove}
                  onTouchEnd={onFilterSheetPullEnd}
                  onTouchCancel={onFilterSheetPullEnd}
                >
                  <div className="flex justify-center pt-2" aria-hidden>
                    <span className="h-1 w-10 rounded-full bg-slate-300/80" />
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-teal-100/90 px-4 py-3">
                    <h2 id="guide-archive-filter-sheet-title" className="text-base font-extrabold tracking-tight text-[#0a3d3d]">
                      체크리스트 필터
                    </h2>
                    <button
                      type="button"
                      onClick={closeFilterSheet}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal-100 bg-white text-lg font-bold leading-none text-teal-800 shadow-sm transition-colors hover:bg-teal-50 active:scale-95"
                      aria-label="닫기"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <ul className="flex flex-col gap-1.5 p-3 pb-5" aria-label="진행 상태별 보기">
                  {FILTER_TABS.map((tab) => {
                    const active = filterTab === tab.id
                    return (
                      <li key={tab.id}>
                        <button
                          type="button"
                          aria-selected={active}
                          onClick={() => {
                            setFilterTab(tab.id)
                            closeFilterSheet()
                          }}
                          className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-bold transition-all active:scale-[0.99] ${
                            active
                              ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-900/15'
                              : 'border border-transparent bg-white/90 text-slate-800 hover:border-teal-100 hover:bg-teal-50/60'
                          }`}
                        >
                          <span>{tab.label}</span>
                          {active ? (
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white/95">
                              적용 중
                            </span>
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* 목록 */}
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:pb-16">
        {!entries.length ? (
          <div className="rounded-3xl border border-dashed border-teal-200/60 bg-white/60 px-6 py-16 text-center md:rounded-2xl md:border-slate-200">
            <p className="mb-4 text-sm text-slate-600">아직 저장된 체크리스트가 없습니다.</p>
            <Link
              to="/trips/new/step2"
              className="inline-block rounded-2xl bg-teal-700 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-teal-800"
            >
              여행 정보 입력하러 가기
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white/80 py-16 text-center text-sm text-slate-500 md:rounded-2xl">
            해당하는 체크리스트가 없습니다.
          </div>
        ) : (
          <ul className="flex flex-col gap-4 md:gap-3">
            {filtered.map(({ entry, progress, statusLabel }, index) => {
              const title = buildGuideArchiveListTitle(entry)
              const dateLine = buildGuideArchiveDateLine(entry)
              const isDemo = isDemoDesignEntry(entry)
              const isSelected = selectedEntryIds.includes(String(entry.id))
              const mobileTint = index % 2 === 0 ? 'bg-sky-100/90' : 'bg-emerald-50/95'
              const badgeClass =
                progress >= 100
                  ? 'bg-teal-700 text-white'
                  : progress <= 0
                    ? 'bg-slate-200 text-slate-800 ring-1 ring-slate-300/80'
                    : 'bg-sky-100 text-sky-800 ring-1 ring-sky-200/80'

              const shellClass = `block w-full overflow-hidden md:rounded-xl md:border md:border-slate-100 md:bg-white md:p-0 md:shadow-sm ${mobileTint} rounded-3xl md:bg-white ${
                deleteMode && isSelected ? 'ring-2 ring-teal-500 ring-offset-2' : ''
              } ${
                isDemo
                  ? deleteMode
                    ? 'cursor-pointer'
                    : 'cursor-default'
                  : deleteMode
                    ? 'cursor-pointer'
                    : 'transition-shadow md:hover:border-sky-200 md:hover:shadow-md'
              }`

              const cardInner = (
                <>
                  {/* 모바일 카드 */}
                  <div className="p-5 text-[#0a3d3d] md:hidden">
                    {isDemo ? (
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">UI 예시 · 클릭 불가</p>
                    ) : null}
                    <p className="text-lg font-bold leading-snug">{title}</p>
                    <div className="mt-3 flex items-start gap-2 text-sm font-medium text-teal-900/75">
                      <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
                      <span>{dateLine}</span>
                    </div>
                    <div className="mt-5 flex items-center justify-between text-sm font-semibold">
                      <span>{statusLabel}</span>
                      <span className="tabular-nums">{progress}%</span>
                    </div>
                    <div className="mt-2">
                      <GuideArchiveProgressBar value={progress} />
                    </div>
                  </div>

                  {/* 웹 카드 */}
                  <div className="hidden gap-6 px-6 py-5 md:flex md:items-center">
                    <div className="min-w-0 flex-1">
                      {isDemo ? (
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">UI 예시 · 클릭 불가</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-lg font-extrabold text-slate-900">{title}</p>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeClass}`}>{statusLabel}</span>
                      </div>
                      <p className="mt-1.5 text-sm text-slate-500">{dateLine}</p>
                    </div>

                    <div className="w-full max-w-md flex-1">
                      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>준비 진행도</span>
                        <span className="tabular-nums text-slate-800">{progress}%</span>
                      </div>
                      <GuideArchiveProgressBar value={progress} />
                    </div>

                    {!isDemo && !deleteMode ? (
                      <div className="flex shrink-0 text-slate-400 transition-colors group-hover:text-sky-600">
                        <ChevronRightIcon />
                      </div>
                    ) : (
                      <div className="w-5 shrink-0" aria-hidden />
                    )}
                  </div>
                </>
              )

              const cardBlock =
                isDemo && !deleteMode ? (
                  <div className={shellClass} role="note" aria-label="UI 예시 카드입니다. 상세 화면으로 이동하지 않습니다.">
                    {cardInner}
                  </div>
                ) : deleteMode ? (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`${title} ${isSelected ? '선택됨' : '선택 안 됨'}. 클릭하면 선택이 바뀝니다.`}
                    onClick={() => toggleEntrySelect(entry.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleEntrySelect(entry.id)
                      }
                    }}
                    className={shellClass}
                  >
                    {cardInner}
                  </div>
                ) : (
                  <Link to={`/trips/${tripId}/guide-archive/${entry.id}`} className={`group ${shellClass}`}>
                    {cardInner}
                </Link>
                )

              return (
                <li key={entry.id}>
                  {deleteMode ? (
                    <div className="flex gap-3">
                      <div className="flex shrink-0 items-center pt-1 md:items-center md:pt-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleEntrySelect(entry.id)}
                          className="h-5 w-5 rounded border-gray-300 accent-teal-600"
                          aria-label={`${title} 선택`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">{cardBlock}</div>
                    </div>
                  ) : (
                    cardBlock
                  )}
              </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function TripGuideArchivePage() {
  const { id } = useParams()
  const location = useLocation()
  return <TripGuideArchiveInner key={`${id}-${location.key}`} tripId={id} />
}
