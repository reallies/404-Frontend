import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  STEP4_CONFIG,
  STEP4_ICON_PATHS,
  HERO_IMAGE,
  CITY_IMAGES,
  AI_TIP,
  MOBILE_TIP,
  MOCK_DEFAULT_ARRIVAL,
  VIETNAM_STAY_OPTIONS,
  isVietnamArrival,
  heroImageForSelection,
  fetchTripDatesForStep4,
  formatTripDateLabel,
} from '@/mocks/tripNewStep4Data'
import StepHeader from '@/components/common/StepHeader'
import BackButton from '@/components/common/BackButton'
import AiPlannerFab from '@/components/common/AiPlannerFab'
import AiConciergeTip from '@/components/common/AiConciergeTip'

function SvgIcon({ name, className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d={STEP4_ICON_PATHS[name]} />
    </svg>
  )
}

function FlightSummaryCard({ arrival, showMockBadge, tripWindow, tripDatesLoading, tripDatesError, tripSource }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-teal-100/80">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
          <SvgIcon name="airplane" className="w-5 h-5 text-teal-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-0.5">항공편 기준 입국</p>
          <p className="font-extrabold text-gray-900 text-lg leading-tight">
            {arrival.country} · {arrival.city}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            도착 공항 <span className="font-semibold text-gray-700">{arrival.iata}</span>
            {showMockBadge && (
              <span className="ml-2 text-amber-600 font-medium">(목데이터 · Step3 미경유)</span>
            )}
          </p>

          {tripDatesLoading && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              <div className="h-4 bg-gray-100 rounded-md animate-pulse w-32" />
              <div className="h-3 bg-gray-100 rounded-md animate-pulse w-full max-w-[240px]" />
            </div>
          )}

          {!tripDatesLoading && tripDatesError && (
            <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-red-600">{tripDatesError}</p>
          )}

          {!tripDatesLoading && !tripDatesError && tripWindow && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">총 여행</span>
                <span className="text-lg font-extrabold text-teal-700 tabular-nums">{tripWindow.totalDays}일</span>
                {tripSource === 'mock' && (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    목데이터 · API 연동 예정
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
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

function VietnamNeighborhoodPicker({ selectedIds, onToggle, customStops, onAddCustom, onRemoveCustom }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [manual, setManual] = useState('')

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

  const handleAddManual = useCallback(() => {
    const t = manual.trim()
    if (t.length < 2) return
    onAddCustom(t)
    setManual('')
    requestAnimationFrame(() => setManual(''))
  }, [manual, onAddCustom])

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-600 flex items-center gap-2">
        <SvgIcon name="mapPin" className="w-4 h-4 text-teal-600" />
        방문할 동네 · 도시 (복수 선택)
      </p>

      <div className="bg-white rounded-xl px-3 py-2.5 flex items-center gap-2 border border-gray-200 shadow-sm">
        <SvgIcon name="search" className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="추천 동네 검색 (도시·지역명)"
          className="bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none w-full min-w-0"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filteredOptions.map((opt) => {
          const on = selectedIds.includes(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt.id)}
              className={`text-left rounded-xl px-3 py-2 text-xs font-semibold transition-all border max-w-[220px] ${
                on
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'
              }`}
            >
              <span className="block text-[10px] opacity-80">{opt.city}</span>
              <span className="block">{opt.area}</span>
              <span className={`block text-[10px] mt-0.5 ${on ? 'text-white/90' : 'text-gray-400'}`}>{opt.hint}</span>
            </button>
          )
        })}
      </div>

      {searchQuery.trim() && filteredOptions.length === 0 && (
        <p className="text-xs text-gray-400">검색 결과가 없습니다. 아래에서 동네 이름을 직접 추가해 보세요.</p>
      )}

      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-600 mb-2">목록에 없으면 직접 추가</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-white rounded-xl px-3 py-2.5 flex items-center gap-2 border border-gray-200 shadow-sm min-w-0">
            <input
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
              className="bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none w-full min-w-0"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            onClick={handleAddManual}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm"
          >
            추가
          </button>
        </div>
      </div>

      {customStops.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-500 mb-2">직접 추가한 동네</p>
          <div className="flex flex-wrap gap-2">
            {customStops.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-900"
              >
                {c.label}
                <button
                  type="button"
                  onClick={() => onRemoveCustom(c.id)}
                  className="w-6 h-6 rounded-full hover:bg-teal-100 flex items-center justify-center text-teal-600"
                  aria-label={`${c.label} 제거`}
                >
                  <SvgIcon name="close" className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TripNewStep4Page() {
  const navigate = useNavigate()
  const location = useLocation()

  const fromStep3 = location.state?.destination ?? null
  const arrival = fromStep3 || MOCK_DEFAULT_ARRIVAL
  const showMockBadge = !fromStep3
  const isVn = isVietnamArrival(arrival)

  /** fetchTripDatesForStep4 결과 (목데이터 또는 추후 API) */
  const [tripWindow, setTripWindow] = useState(null)
  const [tripDatesLoading, setTripDatesLoading] = useState(true)
  const [tripDatesError, setTripDatesError] = useState(null)

  const arrivalKey = `${arrival?.iata ?? ''}-${arrival?.city ?? ''}-${arrival?.country ?? ''}`

  useEffect(() => {
    let cancelled = false
    setTripDatesLoading(true)
    setTripDatesError(null)
    setTripWindow(null)

    fetchTripDatesForStep4(arrival)
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
  }, [arrivalKey])

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

  const [selectedIds, setSelectedIds] = useState([])
  /** 프리셋 동네별 방문 기간 */
  const [visitByPresetId, setVisitByPresetId] = useState({})
  const [customStops, setCustomStops] = useState([])
  const [otherStopsNote, setOtherStopsNote] = useState('')

  const addCustomStop = useCallback((label) => {
    const normalized = label.trim()
    if (normalized.length < 2) return
    setCustomStops((prev) => {
      if (prev.some((c) => c.label.toLowerCase() === normalized.toLowerCase())) return prev
      return [
        ...prev,
        {
          id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          label: normalized,
          visitStart: '',
          visitEnd: '',
        },
      ]
    })
  }, [])

  const removeCustomStop = useCallback((id) => {
    setCustomStops((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const tripDatesReady = Boolean(tripWindow && !tripDatesError)

  const totalVnStops = selectedIds.length + customStops.length

  const toggleId = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        setVisitByPresetId((v) => {
          const n = { ...v }
          delete n[id]
          return n
        })
        return prev.filter((x) => x !== id)
      }
      setVisitByPresetId((v) => ({ ...v, [id]: { start: '', end: '' } }))
      return [...prev, id]
    })
  }

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
    return otherStopsNote.trim().length >= 2
  }, [isVn, tripDatesLoading, tripDatesError, tripWindow, vnSchedulesComplete, otherStopsNote])

  const heroSrc = useMemo(() => {
    if (isVn && selectedIds.length) return heroImageForSelection(selectedIds)
    return CITY_IMAGES[arrival.city] || HERO_IMAGE
  }, [isVn, selectedIds, arrival.city])

  const handleNext = () => {
    if (!canProceed) return
    navigate('/trips/1/loading', {
      state: {
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
          otherStopsNote: isVn ? '' : otherStopsNote.trim(),
        },
      },
    })
  }

  const handleSkip = () => navigate('/trips/1/loading')

  const headerSubtitle = (
    <>
      위 카드의 <strong className="text-teal-700">항공 기준 여행 기간</strong> 안에서, 방문할{' '}
      <strong className="text-teal-700">동네를 고른 뒤</strong> 각 동네마다{' '}
      <strong className="text-teal-700">머무는 날짜</strong>를 적어 주세요.
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
      <div className="hidden md:flex min-h-screen">
        <div className="flex flex-col w-[500px] flex-shrink-0 px-12 py-10">
          <div className="flex justify-end mb-6">
            <BackButton to="/trips/new/step3" />
          </div>

          <StepHeader
            currentStep={STEP4_CONFIG.currentStep}
            totalSteps={STEP4_CONFIG.totalSteps}
            title="일정과 동네를 정해주세요"
            subtitle={headerSubtitle}
            className="mb-6"
          />

          <div className="flex-1 space-y-5 overflow-y-auto pr-1">
            <FlightSummaryCard
              arrival={arrival}
              showMockBadge={showMockBadge}
              tripWindow={tripWindow}
              tripDatesLoading={tripDatesLoading}
              tripDatesError={tripDatesError}
              tripSource={tripWindow?.source}
            />

            <div className="bg-white/80 rounded-2xl p-4 shadow-sm space-y-4">
              {isVn ? (
                <VietnamNeighborhoodPicker
                  selectedIds={selectedIds}
                  onToggle={toggleId}
                  customStops={customStops}
                  onAddCustom={addCustomStop}
                  onRemoveCustom={removeCustomStop}
                />
              ) : (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
                    <SvgIcon name="globe" className="w-4 h-4 text-teal-600" />
                    방문 예정 도시·동네
                  </p>
                  <textarea
                    value={otherStopsNote}
                    onChange={(e) => setOtherStopsNote(e.target.value)}
                    rows={4}
                    placeholder="예: 파리 11구, 루브르 인근 2박 후 니스 이동..."
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-2">
                    베트남 외 국가는 세부 동네 목록이 준비 중이라 직접 입력해 주세요.
                  </p>
                </div>
              )}
            </div>

            {isVn && scheduleBlock && (
              <div className="bg-white/80 rounded-2xl p-4 shadow-sm space-y-4">{scheduleBlock}</div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              건너뛰기
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className={`flex items-center gap-2 font-bold text-base py-4 px-8 rounded-2xl shadow-sm transition-all ${
                canProceed
                  ? 'bg-teal-700 hover:bg-teal-800 text-white hover:shadow-md cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              다음 단계로 이동
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          <img src={heroSrc} alt="여행지" className="w-full h-full object-cover transition-all duration-700" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/70" />

          <div className="absolute bottom-8 left-8 right-8">
            <AiConciergeTip title={AI_TIP.title} description={AI_TIP.description} />
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-white/80">
          <span className="font-bold text-gray-900">Travel Plans</span>
          <BackButton to="/trips/new/step3" />
        </div>

        <div className="px-5 pt-4 pb-44">
          <StepHeader
            currentStep={STEP4_CONFIG.currentStep}
            totalSteps={STEP4_CONFIG.totalSteps}
            title={<>일정과 동네를<br />정해주세요</>}
            subtitle="항공 기준 여행 기간 확인 → 동네 선택 → 동네별 방문 날짜를 입력해 주세요."
            className="mb-5"
          />

          <div className="space-y-4 mb-5">
            <FlightSummaryCard
              arrival={arrival}
              showMockBadge={showMockBadge}
              tripWindow={tripWindow}
              tripDatesLoading={tripDatesLoading}
              tripDatesError={tripDatesError}
              tripSource={tripWindow?.source}
            />

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              {isVn ? (
                <VietnamNeighborhoodPicker
                  selectedIds={selectedIds}
                  onToggle={toggleId}
                  customStops={customStops}
                  onAddCustom={addCustomStop}
                  onRemoveCustom={removeCustomStop}
                />
              ) : (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">방문 예정 도시·동네</p>
                  <textarea
                    value={otherStopsNote}
                    onChange={(e) => setOtherStopsNote(e.target.value)}
                    rows={4}
                    placeholder="방문 지역을 적어주세요"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
                  />
                </div>
              )}
            </div>

            {isVn && scheduleBlock && (
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">{scheduleBlock}</div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 flex items-start gap-3 shadow-sm mb-5">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <SvgIcon name="sparkle" className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{MOBILE_TIP}</p>
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

        <div className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-6 pt-3 bg-gradient-to-t from-white/95 to-transparent">
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full flex items-center justify-center gap-2 font-bold text-base py-4 rounded-2xl shadow-sm transition-all ${
              canProceed
                ? 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            다음 단계로 이동
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="w-full mt-2 text-sm font-semibold text-gray-400 hover:text-gray-600 py-2 transition-colors"
          >
            건너뛰기
          </button>
        </div>
      </div>

      <AiPlannerFab />
    </div>
  )
}

export default TripNewStep4Page
