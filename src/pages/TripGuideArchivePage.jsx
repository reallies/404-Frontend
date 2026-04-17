import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useLocation, Link, useSearchParams } from 'react-router-dom'
import { loadGuideArchive, removeGuideArchiveEntriesByIds } from '@/utils/guideArchiveStorage'
import { loadSavedItems } from '@/utils/savedTripItems'
import {
  hasGuideArchiveDesignDemos,
  seedGuideArchiveDesignDemos,
  toggleGuideArchiveDesignDemos,
} from '@/mocks/guideArchiveDesignDemos'
import { ensureDefaultGuideArchiveSample } from '@/mocks/guideArchiveDefaultSample'
import { TripFlowMobileBar } from '@/components/common/TripFlowTopBar'

function computeProgressPercent(entry, savedItems) {
  const items = entry.items || []
  if (items.length === 0) return 0
  const savedById = new Map(savedItems.map((s) => [String(s.id), s]))
  let checked = 0
  for (const it of items) {
    if (savedById.get(String(it.id))?.checked) checked += 1
  }
  return Math.round((checked / items.length) * 100)
}

/** 0: 미작성 · 1~99: 작성중 · 100: 완료 */
function getProgressStatusLabel(progress) {
  if (progress <= 0) return '미작성'
  if (progress >= 100) return '완료'
  return '작성중'
}

function formatDestinationLine(entry) {
  const dest = entry.destination?.trim()
  const country = entry.country?.trim()
  if (dest && country && !dest.includes(country)) {
    return `${dest} · ${country}`
  }
  return dest || entry.pageTitle || '여행 체크리스트'
}

function ProgressBar({ value }) {
  const done = value >= 100
  const draft = value <= 0
  const track = done ? 'bg-teal-900/10' : draft ? 'bg-slate-200/90' : 'bg-sky-900/10'
  const fill = done ? 'bg-teal-700' : draft ? 'bg-slate-300' : 'bg-sky-400'

  return (
    <div className={`h-2 w-full overflow-hidden rounded-full ${track}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-300 ${fill}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
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

const FILTER_TABS = [
  { id: 'all', label: '전체' },
  { id: 'draft', label: '미작성' },
  { id: 'writing', label: '작성중' },
  { id: 'completed', label: '완료' },
]

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

  const refreshFromStorage = useCallback(() => {
    setEntries(loadGuideArchive(tripId))
    setSavedItems(loadSavedItems(tripId))
  }, [tripId])

  useEffect(() => {
    ensureDefaultGuideArchiveSample(tripId)
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
      const progress = computeProgressPercent(entry, savedItems)
      return { entry, progress, statusLabel: getProgressStatusLabel(progress) }
    })
  }, [entries, savedItems])

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
            {entries.length > 0 && !deleteMode && (
              <button
                type="button"
                onClick={enterDeleteMode}
                className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 shadow-sm transition-colors hover:bg-red-50"
              >
                삭제
              </button>
            )}
            {entries.length > 0 && deleteMode && (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={handleSelectAllEntries}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
                >
                  {allEntriesSelected ? '전체 해제' : '전체선택'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={selectedEntryIds.length === 0}
                  className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-800 shadow-sm transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  선택한 목록 삭제
                </button>
                <button
                  type="button"
                  onClick={exitDeleteMode}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        </div>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          홈으로
        </Link>
      </div>

      {/* 탭 (모바일·웹 공통, 스타일만 반응형) */}
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <div
          className="flex flex-wrap gap-1 rounded-full border border-slate-200/80 bg-white/90 p-1 shadow-sm md:mt-2 md:inline-flex md:border-slate-200 md:bg-slate-50/80"
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

        {/* 모바일: 삭제 / 선택 도구 */}
        {entries.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 md:hidden">
            {!deleteMode ? (
              <button
                type="button"
                onClick={enterDeleteMode}
                className="self-end rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 shadow-sm"
              >
                삭제
              </button>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllEntries}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800"
                >
                  {allEntriesSelected ? '전체 해제' : '전체선택'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={selectedEntryIds.length === 0}
                  className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-800 disabled:opacity-40"
                >
                  선택한 목록 삭제
                </button>
                <button type="button" onClick={exitDeleteMode} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700">
                  취소
                </button>
              </div>
            )}
          </div>
        )}
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
              const title = formatDestinationLine(entry)
              const dateLine = entry.tripWindowLabel || '일정 미정'
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
              } ${isDemo ? 'cursor-default' : !deleteMode ? 'transition-shadow md:hover:border-sky-200 md:hover:shadow-md' : 'cursor-default'}`

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
                      <ProgressBar value={progress} />
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
                      <ProgressBar value={progress} />
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
                  <div className={shellClass}>{cardInner}</div>
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
