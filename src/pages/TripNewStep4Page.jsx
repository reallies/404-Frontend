import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import {
  STEP4_CONFIG,
  STEP4_ICON_PATHS,
  HERO_IMAGE,
  CITY_IMAGES,
  AI_TIP,
  MOBILE_TIP,
  VIETNAM_STAY_OPTIONS,
  isVietnamArrival,
  heroImageForSelection,
  fetchTripDatesForStep4,
  formatTripDateLabel,
} from '@/mocks/tripNewStep4Data'
import { loadStep4NavigationState } from '@/utils/tripFlowDraftStorage'
import StepHeader from '@/components/common/StepHeader'

/**
 * 새 여행 Step4 — 라우트 `/trips/new/step4`에만 연결됩니다 (페이지 파일·컴포넌트 중복 없음).
 * `isVietnamArrival(arrival)`이 true일 때만 베트남 동네 피커·일정 블록이 보이고,
 * 그렇지 않아도 항공 카드 아래 추가 지역 입력창은 동일하게 표시됩니다.
 */
import { TripFlowDesktopBar, TripFlowMobileBar } from '@/components/common/TripFlowTopBar'
import AiConciergeTip, { AiConciergeTipHeading, AiConciergeTipIcon } from '@/components/common/AiConciergeTip'
import TripStepDesktopSplit from '@/components/trip/TripStepDesktopSplit'
import { FullBleedMintGlobeHero } from '@/components/trip/MintProgressiveHero'

const Step4GlobeHero = lazy(() => import('@/components/trip/Step4GlobeHero'))

/** Step3 또는 목적지 페이지에서 저장한 draft의 destination과 라우터 state 병합. 목 기본 입국지 없음. */
function resolveStep4NavigationState(location) {
  const draft = loadStep4NavigationState()
  const routerState = location.state ?? {}
  const merged = { ...draft, ...routerState }
  const fromRouterDest = routerState.destination ?? null
  const draftDest = draft?.destination ?? null
  const arrival = fromRouterDest || draftDest || null
  const hasArrival = Boolean(arrival)

  return { arrival, hasArrival, mergedNavState: merged }
}

function arrayMove(arr, fromIndex, toIndex) {
  if (fromIndex === toIndex) return arr
  const next = [...arr]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

function SvgIcon({ name, className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d={STEP4_ICON_PATHS[name]} />
    </svg>
  )
}

/** 항공·메인 도시 카드 바로 아래 — 추가 방문 지역 입력 (시안 색상, 모든 입국지 공통) */
function Step4AdditionalCitySearchBar({ value, onChange, placeholder, hint }) {
  return (
    <div className="w-full">
      <label className="block w-full">
        <span className="sr-only">추가 방문 도시·지역</span>
        <div
          className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm transition-colors duration-200 focus-within:border-white/50 focus-within:bg-[#D9F2FF]"
        >
          <SvgIcon name="search" className="h-5 w-5 flex-shrink-0 text-[#5DA7C1]" />
          <input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              placeholder ?? '도시 이름을 입력하세요 (예: 사파, 호이안...)'
            }
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-[#5DA7C1]"
            autoComplete="off"
          />
        </div>
      </label>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
    </div>
  )
}

/** 비베트남: 도시·지역 입력 + 확인(엔터와 동일) */
function Step4NonVnAddRegionInput({ value, onChange, onConfirm }) {
  const inputRef = useRef(null)

  const submit = () => {
    const t = value.trim()
    if (t.length < 1) return
    onConfirm(t)
    inputRef.current?.blur()
  }

  return (
    <div className="flex w-full items-center gap-2 sm:gap-3">
      <div
        className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition-colors duration-200 focus-within:border-white/50 focus-within:bg-[#D9F2FF] sm:gap-3 sm:px-5 sm:py-4"
      >
        <SvgIcon name="search" className="h-5 w-5 flex-shrink-0 text-[#5DA7C1]" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            if (e.nativeEvent.isComposing) return
            e.preventDefault()
            submit()
          }}
          placeholder="추가로 방문할 도시·지역을 입력하세요"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-[#5DA7C1]"
          autoComplete="off"
        />
      </div>
      <button
        type="button"
        onClick={submit}
        className="flex-shrink-0 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-700"
      >
        확인
      </button>
    </div>
  )
}

/** 비베트남: 확정된 방문지 목록(무한 추가·순서 변경·삭제) */
function Step4NonVnSelectedPlacesList({ items, onRemove, onReorder, countryLine }) {
  const n = items.length

  return (
    <section className="rounded-2xl bg-sky-50/60 px-1 py-1 sm:px-2">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className="text-[15px] font-bold text-slate-900">선택된 도시</p>
        <p className="text-sm font-semibold text-sky-600">{n}개 도시 추가됨</p>
      </div>

      {n === 0 ? (
        <p className="px-1 text-center text-sm text-slate-500">선택된 곳이 없습니다</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-stretch gap-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const from = Number(e.dataTransfer.getData('text/plain'))
                if (Number.isNaN(from)) return
                onReorder(from, index)
              }}
            >
              <div className="hidden h-[76px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl bg-sky-300/90 text-xl font-extrabold text-white shadow-sm md:flex">
                {index + 1}
              </div>
              <div className="flex min-h-[64px] min-w-0 flex-1 items-center gap-3 rounded-[1.25rem] border border-slate-100 bg-white px-4 py-3 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)]">
                <div className="min-w-0 flex-1 pr-1">
                  <p className="line-clamp-2 text-base font-bold text-slate-900">{item.label}</p>
                  <p className="mt-0.5 truncate text-sm text-slate-500">{countryLine}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 transition-colors hover:bg-sky-200"
                    aria-label="목록에서 제거"
                  >
                    <SvgIcon name="close" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setData('text/plain', String(index))
                    }}
                    className="flex h-10 w-10 flex-shrink-0 cursor-grab items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 active:cursor-grabbing"
                    aria-label="순서 변경"
                  >
                    <SvgIcon name="grip" className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function FlightSummaryCard({ arrival, tripWindow, tripDatesLoading, tripDatesError }) {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-gray-100 bg-white p-5 shadow-[0_12px_40px_-12px_rgba(15,118,110,0.15)]">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal-50/80"
        aria-hidden
      />
      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-50 shadow-inner">
          <SvgIcon name="airplane" className="h-6 w-6 text-teal-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-teal-600">항공편 기준 입국</p>
          <p className="mt-1 text-xl font-extrabold leading-snug text-gray-900">
            {arrival.country} · {arrival.city}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            도착 공항 <span className="font-semibold text-gray-800">{arrival.iata}</span>
          </p>

          {tripDatesLoading && (
            <div className="mt-5 space-y-2 border-t border-gray-100 pt-5">
              <div className="h-5 w-36 animate-pulse rounded-md bg-gray-100" />
              <div className="h-4 max-w-[280px] animate-pulse rounded-md bg-gray-100" />
            </div>
          )}

          {!tripDatesLoading && tripDatesError && (
            <p className="mt-5 border-t border-gray-100 pt-5 text-sm text-red-600">{tripDatesError}</p>
          )}

          {!tripDatesLoading && !tripDatesError && tripWindow && (
            <div className="mt-5 border-t border-gray-100 pt-5">
              <p className="text-[15px] text-gray-900">
                총 여행{' '}
                <span className="text-xl font-extrabold text-teal-600 tabular-nums">{tripWindow.totalDays}일</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {formatTripDateLabel(tripWindow.tripStart)} ~ {formatTripDateLabel(tripWindow.tripEnd)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** 방문 시작·종료가 여행 전체 기간 안에 있고 시작≤종료인지 */
function visitRangeOk(visitStart, visitEnd, tripStart, tripEnd) {
  if (!visitStart || !visitEnd || !tripStart || !tripEnd) return false
  if (new Date(visitEnd) < new Date(visitStart)) return false
  if (visitStart < tripStart || visitEnd > tripEnd) return false
  return true
}

/** API/목데이터로 여행 기간이 바뀌었을 때, 이미 입력된 방문일이 범위 밖이면 자동 보정 */
function clampVisitDatesToTripWindow(visit, tripStart, tripEnd) {
  if (!tripStart || !tripEnd) return visit
  let start = visit.start
  let end = visit.end
  if (start) {
    if (start < tripStart) start = tripStart
    if (start > tripEnd) start = ''
  }
  if (end) {
    if (end > tripEnd) end = tripEnd
    if (end < tripStart) end = ''
  }
  if (start && end && end < start) end = start
  return { ...visit, start, end }
}

function NeighborhoodVisitSchedule({
  tripStart,
  tripEnd,
  selectedIds,
  visitByPresetId,
  onPresetVisitChange,
  customStops,
  onCustomVisitChange,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
        <SvgIcon name="calendar" className="w-4 h-4 text-teal-600" />
        동네별 방문 일정
      </div>
      <p className="text-[11px] text-gray-400 leading-relaxed">
        선택한 각 동네에 <strong className="text-gray-600">실제로 머무는 날짜</strong>를 적어 주세요. (위 카드의 항공·예약 기준 여행 기간 안에서만 선택 가능)
      </p>

      <div className="space-y-3">
        {selectedIds.map((id) => {
          const opt = VIETNAM_STAY_OPTIONS.find((o) => o.id === id)
          if (!opt) return null
          const v = visitByPresetId[id] || { start: '', end: '' }
          return (
            <div key={id} className="rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm">
              <p className="text-xs font-bold text-gray-800 mb-2">
                {opt.city} · {opt.area}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] font-bold text-gray-400">방문 시작일</span>
                  <input
                    type="date"
                    min={tripStart}
                    max={tripEnd}
                    value={v.start}
                    onChange={(e) => onPresetVisitChange(id, { start: e.target.value })}
                    className="mt-1 w-full rounded-lg px-2 py-2 text-xs text-gray-800 border border-gray-200 outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold text-gray-400">방문 종료일</span>
                  <input
                    type="date"
                    min={v.start || tripStart}
                    max={tripEnd}
                    value={v.end}
                    onChange={(e) => onPresetVisitChange(id, { end: e.target.value })}
                    className="mt-1 w-full rounded-lg px-2 py-2 text-xs text-gray-800 border border-gray-200 outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </label>
              </div>
            </div>
          )
        })}

        {customStops.map((c) => (
          <div key={c.id} className="rounded-xl border border-teal-100 bg-teal-50/40 px-3 py-3 shadow-sm">
            <p className="text-xs font-bold text-gray-800 mb-2">직접 추가 · {c.label}</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] font-bold text-gray-400">방문 시작일</span>
                <input
                  type="date"
                  min={tripStart}
                  max={tripEnd}
                  value={c.visitStart}
                  onChange={(e) => onCustomVisitChange(c.id, { visitStart: e.target.value })}
                  className="mt-1 w-full rounded-lg px-2 py-2 text-xs text-gray-800 border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold text-gray-400">방문 종료일</span>
                <input
                  type="date"
                  min={c.visitStart || tripStart}
                  max={tripEnd}
                  value={c.visitEnd}
                  onChange={(e) => onCustomVisitChange(c.id, { visitEnd: e.target.value })}
                  className="mt-1 w-full rounded-lg px-2 py-2 text-xs text-gray-800 border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VietnamNeighborhoodPicker({
  selectedIds,
  onToggle,
  customStops,
  onAddCustom,
  onRemoveCustom,
  visitStopOrder,
  onReorderStopOrder,
  searchQuery,
  onSearchQueryChange,
}) {
  const [manual, setManual] = useState('')
  const manualInputRef = useRef(null)

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return VIETNAM_STAY_OPTIONS
    return VIETNAM_STAY_OPTIONS.filter(
      (opt) =>
        opt.city.toLowerCase().includes(q) ||
        opt.area.toLowerCase().includes(q) ||
        opt.hint.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const orderedRows = useMemo(() => {
    return visitStopOrder
      .map((key) => {
        if (key.startsWith('p-')) {
          const id = key.slice(2)
          const opt = VIETNAM_STAY_OPTIONS.find((o) => o.id === id)
          if (!opt || !selectedIds.includes(id)) return null
          return { kind: 'preset', key, id, opt }
        }
        if (key.startsWith('c-')) {
          const id = key.slice(2)
          const c = customStops.find((x) => x.id === id)
          if (!c) return null
          return { kind: 'custom', key, id, custom: c }
        }
        return null
      })
      .filter(Boolean)
  }, [visitStopOrder, selectedIds, customStops])

  const handleAddManual = useCallback(() => {
    const t = manual.trim()
    if (t.length < 2) return
    onAddCustom(t)
    setManual('')
    manualInputRef.current?.blur()
  }, [manual, onAddCustom])

  const totalCount = orderedRows.length

  return (
    <div className="space-y-5">
      {/* 입력창 바로 아래: 선택된 도시 */}
      <section className="rounded-2xl bg-sky-50/60 px-1 py-1 sm:px-2">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <p className="text-[15px] font-bold text-slate-900">선택된 도시</p>
          <p className="text-sm font-semibold text-sky-600">{totalCount}개 도시 추가됨</p>
        </div>

        {totalCount === 0 ? (
          <p className="px-1 text-sm text-slate-400">위에서 검색하거나 아래 추천·직접 추가로 도시를 골라 주세요.</p>
        ) : (
          <ul className="space-y-3">
            {orderedRows.map((row, index) => {
              const title = row.kind === 'preset' ? row.opt.city : row.custom.label
              const sub =
                row.kind === 'preset'
                  ? `베트남, ${row.opt.hint}`
                  : '직접 입력, 추가 지역'

              return (
                <li
                  key={row.key}
                  className="flex items-stretch gap-3"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const from = Number(e.dataTransfer.getData('text/plain'))
                    if (Number.isNaN(from)) return
                    onReorderStopOrder(from, index)
                  }}
                >
                  <div className="hidden h-[76px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl bg-sky-300/90 text-xl font-extrabold text-white shadow-sm md:flex">
                    {index + 1}
                  </div>
                  <div className="flex min-h-[64px] min-w-0 flex-1 items-center gap-3 rounded-[1.25rem] border border-slate-100 bg-white px-4 py-3 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)]">
                    <div className="min-w-0 flex-1 pr-1">
                      <p className="truncate text-base font-bold text-slate-900">{title}</p>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{sub}</p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => (row.kind === 'preset' ? onToggle(row.id) : onRemoveCustom(row.id))}
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 transition-colors hover:bg-sky-200"
                        aria-label="제거"
                      >
                        <SvgIcon name="close" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData('text/plain', String(index))
                        }}
                        className="flex h-10 w-10 flex-shrink-0 cursor-grab items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 active:cursor-grabbing"
                        aria-label="순서 변경"
                      >
                        <SvgIcon name="grip" className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {searchQuery.trim() && filteredOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filteredOptions.map((opt) => {
            const on = selectedIds.includes(opt.id)
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onToggle(opt.id)}
                className={`max-w-[220px] rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all ${
                  on
                    ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
                    : 'border-sky-200 bg-white/95 text-slate-700 hover:border-teal-300'
                }`}
              >
                <span className="block text-[10px] opacity-80">{opt.city}</span>
                <span className="block">{opt.area}</span>
                <span className={`mt-0.5 block text-[10px] ${on ? 'text-white/90' : 'text-slate-400'}`}>{opt.hint}</span>
              </button>
            )
          })}
        </div>
      )}

      {searchQuery.trim() && filteredOptions.length === 0 && (
        <p className="text-xs text-slate-400">검색 결과가 없습니다. 아래에서 직접 추가해 보세요.</p>
      )}

      <div className="border-t border-sky-100 pt-4">
        <p className="mb-2 text-xs font-semibold text-slate-600">목록에 없으면 직접 추가</p>
        <div className="flex gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 transition-colors duration-200 focus-within:border-white/50 focus-within:bg-[#D9F2FF]">
            <input
              ref={manualInputRef}
              type="text"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                if (e.nativeEvent.isComposing) return
                e.preventDefault()
                handleAddManual()
              }}
              placeholder="예: 무이네, 달랏, 사파..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-sky-700/45 outline-none"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            onClick={handleAddManual}
            className="flex-shrink-0 rounded-2xl px-4 py-2.5 text-sm font-bold bg-teal-600 text-white shadow-sm transition-colors hover:bg-teal-700"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  )
}

function TripNewStep4PageContent({ arrival, mergedNavState }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isVn = isVietnamArrival(arrival)

  /** fetchTripDatesForStep4 결과 (목데이터 또는 추후 API) */
  const [tripWindow, setTripWindow] = useState(null)
  const [tripDatesLoading, setTripDatesLoading] = useState(true)
  const [tripDatesError, setTripDatesError] = useState(null)

  const [selectedIds, setSelectedIds] = useState([])
  /** 프리셋 동네별 방문 기간 */
  const [visitByPresetId, setVisitByPresetId] = useState({})
  const [customStops, setCustomStops] = useState([])
  /** p-{presetId} · c-{customId} — 카드 목록 순서 */
  const [visitStopOrder, setVisitStopOrder] = useState([])
  /** 베트남: 동네 피커 검색어와 동기화 */
  const [additionalCitySearchQuery, setAdditionalCitySearchQuery] = useState('')
  /** 비베트남: 입력 초안 / 확인 시 목록에만 추가 → Step5 otherStopsNote로 합쳐 전달 */
  const [nonVnDraft, setNonVnDraft] = useState('')
  const [nonVnPlaces, setNonVnPlaces] = useState([])

  const confirmNonVnPlace = useCallback((text) => {
    const t = text.trim()
    if (t.length < 1) return
    setNonVnPlaces((prev) => [
      ...prev,
      { id: `nv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, label: t },
    ])
    setNonVnDraft('')
  }, [])

  const removeNonVnPlace = useCallback((id) => {
    setNonVnPlaces((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const onReorderNonVnPlaces = useCallback((fromIndex, toIndex) => {
    setNonVnPlaces((prev) => arrayMove(prev, fromIndex, toIndex))
  }, [])

  const arrivalKey = `${arrival?.iata ?? ''}-${arrival?.city ?? ''}-${arrival?.country ?? ''}`

  /** 라우터 state와 sessionStorage draft 병합 후 목적지 페이지에서 고른 여행 기간 */
  const tripDateOverride = useMemo(() => {
    const merged = { ...loadStep4NavigationState(), ...location.state }
    if (merged.fromDestinationPage && merged.tripStartDate && merged.tripEndDate) {
      return {
        tripStart: merged.tripStartDate,
        tripEnd: merged.tripEndDate,
        source: 'destination-picker',
      }
    }
    return null
  }, [location.state?.fromDestinationPage, location.state?.tripStartDate, location.state?.tripEndDate])

  useEffect(() => {
    let cancelled = false
    setTripDatesLoading(true)
    setTripDatesError(null)
    setTripWindow(null)

    fetchTripDatesForStep4(arrival, tripDateOverride)
      .then((data) => {
        if (cancelled) return
        setTripWindow({
          tripStart: data.tripStart,
          tripEnd: data.tripEnd,
          totalDays: data.totalDays,
          source: data.source,
        })
      })
      .catch((e) => {
        if (cancelled) return
        setTripDatesError(e?.message || '여행 기간을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setTripDatesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [arrivalKey, tripDateOverride?.tripStart, tripDateOverride?.tripEnd])

  /** 선택/삭제와 visitStopOrder 동기화 (잘못 남은 키 제거) */
  useEffect(() => {
    setVisitStopOrder((prev) =>
      prev.filter((k) => {
        if (k.startsWith('p-')) return selectedIds.includes(k.slice(2))
        if (k.startsWith('c-')) return customStops.some((c) => c.id === k.slice(2))
        return false
      })
    )
  }, [selectedIds, customStops])

  /** 여행 기간(tripWindow)이 API/목에서 바뀌면, 기존 방문일이 범위를 벗어나지 않도록 보정 */
  useEffect(() => {
    if (!tripWindow?.tripStart || !tripWindow?.tripEnd) return
    const { tripStart, tripEnd } = tripWindow
    setVisitByPresetId((prev) => {
      const next = { ...prev }
      for (const id of Object.keys(next)) {
        next[id] = clampVisitDatesToTripWindow(next[id], tripStart, tripEnd)
      }
      return next
    })
    setCustomStops((prev) =>
      prev.map((c) => {
        const clamped = clampVisitDatesToTripWindow(
          { start: c.visitStart, end: c.visitEnd },
          tripStart,
          tripEnd
        )
        return { ...c, visitStart: clamped.start, visitEnd: clamped.end }
      })
    )
  }, [tripWindow?.tripStart, tripWindow?.tripEnd])

  const addCustomStop = useCallback((label) => {
    const normalized = label.trim()
    if (normalized.length < 2) return
    setCustomStops((prev) => {
      if (prev.some((c) => c.label.toLowerCase() === normalized.toLowerCase())) return prev
      const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      setVisitStopOrder((o) => [...o, `c-${id}`])
      return [
        ...prev,
        {
          id,
          label: normalized,
          visitStart: '',
          visitEnd: '',
        },
      ]
    })
  }, [])

  const removeCustomStop = useCallback((id) => {
    setCustomStops((prev) => prev.filter((c) => c.id !== id))
    setVisitStopOrder((o) => o.filter((k) => k !== `c-${id}`))
  }, [])

  const tripDatesReady = Boolean(tripWindow && !tripDatesError)

  const totalVnStops = selectedIds.length + customStops.length

  const toggleId = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        setVisitStopOrder((o) => o.filter((k) => k !== `p-${id}`))
        setVisitByPresetId((v) => {
          const n = { ...v }
          delete n[id]
          return n
        })
        return prev.filter((x) => x !== id)
      }
      setVisitStopOrder((o) => [...o, `p-${id}`])
      setVisitByPresetId((v) => ({ ...v, [id]: { start: '', end: '' } }))
      return [...prev, id]
    })
  }

  const onReorderStopOrder = useCallback((fromIndex, toIndex) => {
    setVisitStopOrder((order) => arrayMove(order, fromIndex, toIndex))
  }, [])

  const onPresetVisitChange = useCallback((id, partial) => {
    setVisitByPresetId((prev) => ({
      ...prev,
      [id]: { start: '', end: '', ...prev[id], ...partial },
    }))
  }, [])

  const onCustomVisitChange = useCallback((id, partial) => {
    setCustomStops((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)))
  }, [])

  const vnSchedulesComplete = useMemo(() => {
    if (!tripWindow || totalVnStops < 1) return false
    const { tripStart, tripEnd } = tripWindow
    for (const id of selectedIds) {
      const v = visitByPresetId[id]
      if (!v || !visitRangeOk(v.start, v.end, tripStart, tripEnd)) return false
    }
    for (const c of customStops) {
      if (!visitRangeOk(c.visitStart, c.visitEnd, tripStart, tripEnd)) return false
    }
    return true
  }, [tripWindow, totalVnStops, selectedIds, visitByPresetId, customStops])

  const canProceed = useMemo(() => {
    if (isVn) {
      if (tripDatesLoading || tripDatesError || !tripWindow) return false
      return vnSchedulesComplete
    }
    if (tripDatesLoading || tripDatesError || !tripWindow) return false
    /** 「선택된 도시」에 최소 1곳 이상(확인으로 추가된 항목) */
    return nonVnPlaces.length >= 1
  }, [isVn, tripDatesLoading, tripDatesError, tripWindow, vnSchedulesComplete, nonVnPlaces.length])

  const heroSrc = useMemo(() => {
    if (isVn && selectedIds.length) return heroImageForSelection(selectedIds)
    return CITY_IMAGES[arrival.city] || HERO_IMAGE
  }, [isVn, selectedIds, arrival.city])

  const handleNext = () => {
    if (!canProceed) return
    navigate('/trips/new/step5', {
      state: {
        ...mergedNavState,
        step4: {
          arrival,
          tripStart: tripWindow?.tripStart,
          tripEnd: tripWindow?.tripEnd,
          totalDays: tripWindow?.totalDays,
          tripDatesSource: tripWindow?.source,
          vietnamPresetSchedule: isVn
            ? selectedIds.map((id) => ({
                optionId: id,
                visitStart: visitByPresetId[id]?.start,
                visitEnd: visitByPresetId[id]?.end,
              }))
            : [],
          vietnamCustomSchedule: isVn
            ? customStops.map((c) => ({
                id: c.id,
                label: c.label,
                visitStart: c.visitStart,
                visitEnd: c.visitEnd,
              }))
            : [],
          otherStopsNote: isVn ? '' : nonVnPlaces.map((p) => p.label).join('\n'),
        },
      },
    })
  }

  const step4HeaderSubtitle = (
    <>
      메인 도시 외에 여행 중 추가로 방문할 지역이 있다면 일정 순서대로 입력해 주세요! Mate가 그에 맞는 체크리스트를
      제안해드릴게요!
    </>
  )

  const scheduleBlock =
    isVn && tripDatesLoading && totalVnStops > 0 ? (
      <p className="text-xs text-gray-500">여행 기간을 불러오는 중입니다…</p>
    ) : isVn && tripDatesError && totalVnStops > 0 ? (
      <p className="text-xs text-red-600">{tripDatesError}</p>
    ) : isVn && tripDatesReady && totalVnStops > 0 ? (
      <NeighborhoodVisitSchedule
        tripStart={tripWindow.tripStart}
        tripEnd={tripWindow.tripEnd}
        selectedIds={selectedIds}
        visitByPresetId={visitByPresetId}
        onPresetVisitChange={onPresetVisitChange}
        customStops={customStops}
        onCustomVisitChange={onCustomVisitChange}
      />
    ) : null

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #E0F7FA 0%, #F0FDFA 100%)' }}
    >
      <TripStepDesktopSplit
        fullBleed={
          <FullBleedMintGlobeHero
            globe={
              <Suspense
                fallback={
                  <div
                    className="absolute inset-0 animate-pulse opacity-50"
                    style={{
                      background:
                        'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(0, 200, 190, 0.15) 0%, transparent 55%)',
                    }}
                  />
                }
              >
                <Step4GlobeHero />
              </Suspense>
            }
          />
        }
        left={
          <>
            <TripFlowDesktopBar backTo="/trips/new/step3" className="mb-6" />

            <StepHeader
              currentStep={STEP4_CONFIG.currentStep}
              totalSteps={STEP4_CONFIG.totalSteps}
              title="추가로 방문하는 지역이 있나요?"
              subtitle={step4HeaderSubtitle}
              className="mb-6"
              subtitleClassName="text-sm"
            />

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
              <FlightSummaryCard
                arrival={arrival}
                tripWindow={tripWindow}
                tripDatesLoading={tripDatesLoading}
                tripDatesError={tripDatesError}
              />

              {isVn ? (
                <Step4AdditionalCitySearchBar
                  value={additionalCitySearchQuery}
                  onChange={setAdditionalCitySearchQuery}
                  placeholder="도시 이름을 입력하세요 (예: 사파, 호이안...)"
                />
              ) : (
                <>
                  <Step4NonVnAddRegionInput
                    value={nonVnDraft}
                    onChange={setNonVnDraft}
                    onConfirm={confirmNonVnPlace}
                  />
                  <Step4NonVnSelectedPlacesList
                    items={nonVnPlaces}
                    onRemove={removeNonVnPlace}
                    onReorder={onReorderNonVnPlaces}
                    countryLine={`${arrival?.country ?? ''} · 추가 방문`}
                  />
                </>
              )}

              {isVn && (
                <div className="space-y-4 rounded-2xl bg-white/90 p-5 shadow-md backdrop-blur-sm">
                  <VietnamNeighborhoodPicker
                    selectedIds={selectedIds}
                    onToggle={toggleId}
                    customStops={customStops}
                    onAddCustom={addCustomStop}
                    onRemoveCustom={removeCustomStop}
                    visitStopOrder={visitStopOrder}
                    onReorderStopOrder={onReorderStopOrder}
                    searchQuery={additionalCitySearchQuery}
                    onSearchQueryChange={setAdditionalCitySearchQuery}
                  />
                </div>
              )}

              {isVn && scheduleBlock && (
                <div className="space-y-4 rounded-2xl bg-white/90 p-5 shadow-md backdrop-blur-sm">{scheduleBlock}</div>
              )}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold shadow-md transition-all ${
                  canProceed
                    ? 'cursor-pointer bg-amber-400 text-white hover:bg-amber-500 hover:shadow-lg'
                    : 'cursor-not-allowed bg-gray-200 text-gray-400'
                }`}
              >
                다음 단계로 →
              </button>
            </div>
          </>
        }
        right={
          <div className="pointer-events-auto absolute bottom-8 left-8 right-8 z-30">
            <AiConciergeTip description={AI_TIP.description} />
          </div>
        }
      />

      <div className="md:hidden">
        <TripFlowMobileBar backTo="/trips/new/step3" />

        <div className="px-5 pt-4 pb-44">
          <StepHeader
            currentStep={STEP4_CONFIG.currentStep}
            totalSteps={STEP4_CONFIG.totalSteps}
            title={<>추가로 방문하는<br />지역이 있나요?</>}
            subtitle={step4HeaderSubtitle}
            className="mb-5"
            titleClassName="text-2xl"
            subtitleClassName="text-sm"
          />

          <div className="space-y-4 mb-5">
            <FlightSummaryCard
              arrival={arrival}
              tripWindow={tripWindow}
              tripDatesLoading={tripDatesLoading}
              tripDatesError={tripDatesError}
            />

            {isVn ? (
              <Step4AdditionalCitySearchBar
                value={additionalCitySearchQuery}
                onChange={setAdditionalCitySearchQuery}
                placeholder="도시 이름을 입력하세요 (예: 사파, 호이안...)"
              />
            ) : (
              <>
                <Step4NonVnAddRegionInput
                  value={nonVnDraft}
                  onChange={setNonVnDraft}
                  onConfirm={confirmNonVnPlace}
                />
                <Step4NonVnSelectedPlacesList
                  items={nonVnPlaces}
                  onRemove={removeNonVnPlace}
                  onReorder={onReorderNonVnPlaces}
                  countryLine={`${arrival?.country ?? ''} · 추가 방문`}
                />
              </>
            )}

            {isVn && (
              <div className="rounded-2xl bg-white/95 p-4 shadow-md backdrop-blur-sm">
                <VietnamNeighborhoodPicker
                  selectedIds={selectedIds}
                  onToggle={toggleId}
                  customStops={customStops}
                  onAddCustom={addCustomStop}
                  onRemoveCustom={removeCustomStop}
                  visitStopOrder={visitStopOrder}
                  onReorderStopOrder={onReorderStopOrder}
                  searchQuery={additionalCitySearchQuery}
                  onSearchQueryChange={setAdditionalCitySearchQuery}
                />
              </div>
            )}

            {isVn && scheduleBlock && (
              <div className="space-y-4 rounded-2xl bg-white/95 p-4 shadow-md backdrop-blur-sm">{scheduleBlock}</div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 flex items-start gap-3 shadow-sm mb-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 p-0.5">
              <AiConciergeTipIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1.5">
                <AiConciergeTipHeading variant="onLight" />
              </p>
              <p className="text-sm leading-relaxed text-gray-600">{MOBILE_TIP}</p>
            </div>
          </div>

          {isVn && totalVnStops > 0 && (
            <div className="relative rounded-2xl overflow-hidden h-44 mb-4">
              <img src={heroSrc} alt="" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-5">
                <p className="text-[10px] font-bold text-white/70 tracking-widest uppercase mb-0.5">PREVIEW</p>
                <p className="text-sm font-extrabold text-white">
                  {vnSchedulesComplete ? '동네별 일정 입력 완료' : '동네별 방문 날짜를 입력해 주세요'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 바텀 네비에 가리지 않도록 Step3와 동일: 탭 높이만큼 위에 고정 */}
        <div className="fixed bottom-16 left-0 right-0 z-40 px-5 pb-3 pt-3 bg-gradient-to-t from-white via-white/95 to-transparent [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full flex items-center justify-center gap-2 font-bold text-base py-4 rounded-2xl shadow-md transition-all ${
              canProceed
                ? 'bg-amber-400 hover:bg-amber-500 text-white cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            다음 단계로 →
          </button>
        </div>
      </div>
    </div>
  )
}

function TripNewStep4Page() {
  const location = useLocation()
  const { arrival, hasArrival, mergedNavState } = resolveStep4NavigationState(location)
  if (!hasArrival || !arrival) {
    return <Navigate to="/trips/new/step3" replace />
  }
  return <TripNewStep4PageContent arrival={arrival} mergedNavState={mergedNavState} />
}

export default TripNewStep4Page
