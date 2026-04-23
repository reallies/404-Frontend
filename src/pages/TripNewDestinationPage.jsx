import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  STEP_DESTINATION_CONFIG,
  COUNTRY_ARRIVAL_OPTIONS,
  MOBILE_QUICK_DESTINATION_CHIPS,
  filterArrivalsByQuery,
  getArrivalsForCountry,
  sanitizeCountryInput,
  sanitizeArrivalInput,
} from '@/mocks/tripNewDestinationData'
import { listCountries, listCities } from '@/api/master'
import StepHeader from '@/components/common/StepHeader'
import { TripFlowNextStepButton } from '@/components/trip/TripFlowNextStepButton'
import {
  TripNewFlowDesktopPrevBar,
  TripNewFlowMobilePrevAction,
} from '@/components/trip/TripNewFlowPrevControls'
import DestinationMobileRangeCalendar from '@/components/trip/DestinationMobileRangeCalendar'
import DestinationCountryAutocomplete from '@/components/trip/DestinationCountryAutocomplete'
import SelectedCountryChip from '@/components/trip/SelectedCountryChip'
import { TripDestinationSvgIcon } from '@/components/trip/TripDestinationIcons'
import { formatKoreanDateRangeLine, formatTripNightsDaysLabel } from '@/utils/tripDateFormat'
import { saveStep4NavigationState } from '@/utils/tripFlowDraftStorage'
import { saveActiveTripPlan } from '@/utils/tripPlanContextStorage'
import { clearActiveTripId } from '@/utils/activeTripIdStorage'

/** `<input type="date" min>` 용 — 브라우저 로컬 달력과 맞추기 위해 UTC가 아닌 로컬 날짜 사용 */
function getLocalDateYYYYMMDD() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** API 응답(countries + cities)을 COUNTRY_ARRIVAL_OPTIONS 형태로 변환 */
function buildCountryArrivalOptions(countries, cities) {
  const citiesByCountryId = {}
  for (const city of cities) {
    const key = String(city.countryId)
    if (!citiesByCountryId[key]) citiesByCountryId[key] = []
    citiesByCountryId[key].push(city)
  }
  return countries.map((country) => {
    const mockEntry = COUNTRY_ARRIVAL_OPTIONS.find((m) => m.countryCode === country.code)
    const countryCities = (citiesByCountryId[String(country.id)] ?? []).filter((c) => c.iataCode)
    const primaryCity = countryCities[0]
    return {
      name: country.nameKo,
      aliases: mockEntry?.aliases ?? [],
      iata: primaryCity?.iataCode ?? mockEntry?.iata ?? '',
      city: primaryCity?.nameKo ?? mockEntry?.city ?? '',
      country: country.nameKo,
      countryCode: country.code,
      arrivals: countryCities.map((c) => ({
        city: c.nameKo,
        iata: c.iataCode,
        aliases: mockEntry?.arrivals?.find((a) => a.iata === c.iataCode)?.aliases ?? [],
      })),
    }
  })
}

/** 엔터·정확 일치용: 목록에서 국가명 또는 별칭과 일치하는 항목 */
function findExactCountryMatch(trimmedQuery, list) {
  const q = trimmedQuery
  if (!q) return null
  const lower = q.toLowerCase()
  return (
    list.find((c) => c.name === q) ||
    list.find((c) => c.aliases?.some((a) => a.toLowerCase() === lower)) ||
    null
  )
}

function countryRowWithoutArrivals(row) {
  if (!row) return row
  const { arrivals: _a, ...rest } = row
  return rest
}

const SUBTITLE_DESKTOP = (
  <p className="text-gray-600">
    어디로, 언제 떠날지 알려주시면 저희가 당신만을 위한 체크리스트를 만들어드릴게요!
  </p>
)

/** 이미지 히어로 없이 — CHECKMATE 플로우 틸·민트·시안 톤 (step2·step4와 계열 통일) */
const TRIP_FLOW_PAGE_BG_STYLE = {
  background: `
    radial-gradient(ellipse 120% 80% at 50% -15%, rgba(45, 212, 191, 0.18), transparent 55%),
    radial-gradient(ellipse 90% 70% at 0% 30%, rgba(204, 251, 241, 0.55), transparent 50%),
    radial-gradient(ellipse 85% 60% at 100% 70%, rgba(167, 243, 208, 0.28), transparent 52%),
    linear-gradient(165deg, #ecfdf5 0%, #f0fdfa 22%, #ecfeff 48%, #f8fafc 100%)
  `,
}

function DestinationDateForm({
  comboRef,
  countryQuery,
  onCountryInputChange,
  onCountryKeyDown,
  onCountryFocus,
  countryInputReadOnly,
  onChangeCountryRequest,
  suggestions,
  showDropdown,
  onPickCountry,
  pickerPhase,
  arrivalQuery,
  onArrivalQueryChange,
  onArrivalKeyDown,
  arrivalSuggestions,
  onPickArrival,
  selectedCountry,
  onRemoveCountryTag,
  startDate,
  endDate,
  today,
  onRangeChange,
  scheduleMode,
  onScheduleModeChange,
  flexibilityDays,
  onFlexibilityDaysChange,
  allCountries,
}) {
  const hasQuery = countryQuery.trim().length > 0
  const panelOpen = showDropdown && (pickerPhase === 'arrival' || hasQuery)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-100/90 bg-sky-50/90 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-sky-600 shadow-sm">
            <TripDestinationSvgIcon name="mapPin" className="h-5 w-5" />
          </div>
          <span className="text-base font-bold text-gray-900">어디로 떠나시나요?</span>
        </div>

        <DestinationCountryAutocomplete
          comboRef={comboRef}
          countryQuery={countryQuery}
          onCountryInputChange={onCountryInputChange}
          onCountryKeyDown={onCountryKeyDown}
          onCountryFocus={onCountryFocus}
          countryInputReadOnly={countryInputReadOnly}
          onChangeCountryRequest={onChangeCountryRequest}
          suggestions={suggestions}
          isPanelOpen={panelOpen}
          onPickCountry={onPickCountry}
          pickerPhase={pickerPhase}
          arrivalQuery={arrivalQuery}
          onArrivalQueryChange={onArrivalQueryChange}
          onArrivalKeyDown={onArrivalKeyDown}
          arrivalSuggestions={arrivalSuggestions}
          onPickArrival={onPickArrival}
          panelId="country-autocomplete-panel"
          placeholder="국가명 입력 후 엔터 또는 목록에서 선택"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {MOBILE_QUICK_DESTINATION_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                const c = allCountries.find((x) => x.name === chip.countryName)
                if (c) onPickCountry(c)
              }}
              className="rounded-full border border-sky-200/90 bg-white px-3 py-1.5 text-sm font-semibold text-sky-800 shadow-sm transition hover:border-sky-300/90 hover:bg-sky-50/80"
            >
              #{chip.label}
            </button>
          ))}
        </div>

        {selectedCountry && (
          <SelectedCountryChip country={selectedCountry} onRemove={onRemoveCountryTag} variant="desktop" />
        )}
      </div>

      <div
        className={`rounded-2xl border border-teal-100/90 bg-gradient-to-br from-teal-50/70 via-white to-cyan-50/40 p-5 shadow-sm transition-opacity ${
          selectedCountry ? '' : 'opacity-60'
        }`}
        aria-disabled={!selectedCountry}
      >
        <div className="mb-4 flex items-center gap-2">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${
              selectedCountry ? 'bg-white/90 text-teal-600' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <TripDestinationSvgIcon name="calendar" className="h-5 w-5" />
          </div>
          <span className={`text-base font-bold ${selectedCountry ? 'text-gray-900' : 'text-gray-500'}`}>
            언제 떠나시나요?
          </span>
        </div>
        {!selectedCountry && (
          <p className="mb-3 rounded-xl bg-white/80 px-3 py-2 text-xs text-gray-500 ring-1 ring-teal-100/80">
            위에서 <strong className="text-teal-700">여행 국가</strong>를 먼저 선택하면 일정을 입력할 수 있어요.
          </p>
        )}
        <DestinationMobileRangeCalendar
          startDate={startDate}
          endDate={endDate}
          todayYmd={today}
          minDateYmd={today}
          disabled={!selectedCountry}
          onChangeRange={onRangeChange}
          scheduleMode={scheduleMode}
          onScheduleModeChange={onScheduleModeChange}
          flexibilityDays={flexibilityDays}
          onFlexibilityDaysChange={onFlexibilityDaysChange}
        />
      </div>
    </div>
  )
}

export default function TripNewDestinationPage() {
  const navigate = useNavigate()
  const [today, setToday] = useState(getLocalDateYYYYMMDD)
  const comboRef = useRef(null)

  /** 오늘(로컬) 기준으로 갱신 — 탭 복귀·분 단위 체크로 자정 넘김 반영 */
  useEffect(() => {
    clearActiveTripId()
  }, [])

  useEffect(() => {
    const syncToday = () => setToday(getLocalDateYYYYMMDD())
    syncToday()

    const intervalId = setInterval(syncToday, 30_000)

    let midnightTimerId = null
    const scheduleNextMidnight = () => {
      const now = new Date()
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
      const ms = Math.max(500, next.getTime() - now.getTime())
      midnightTimerId = window.setTimeout(() => {
        syncToday()
        scheduleNextMidnight()
      }, ms)
    }
    scheduleNextMidnight()

    const onFocus = () => syncToday()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncToday()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(intervalId)
      if (midnightTimerId != null) window.clearTimeout(midnightTimerId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const [countryQuery, setCountryQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [pickerPhase, setPickerPhase] = useState('country')
  const [draftCountry, setDraftCountry] = useState(null)
  const [arrivalQuery, setArrivalQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateScheduleMode, setDateScheduleMode] = useState('fixed')
  const [dateFlexibilityDays, setDateFlexibilityDays] = useState(0)
  const [countryOptions, setCountryOptions] = useState(COUNTRY_ARRIVAL_OPTIONS)

  useEffect(() => {
    let cancelled = false
    Promise.all([listCountries(), listCities({ onlyServed: true })])
      .then(([countries, cities]) => {
        if (cancelled) return
        setCountryOptions(buildCountryArrivalOptions(countries, cities))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  /** 자정 등으로 today가 바뀌면 과거로 밀린 값은 비움 */
  useEffect(() => {
    setStartDate((prev) => (prev && prev < today ? '' : prev))
    setEndDate((prev) => (prev && prev < today ? '' : prev))
  }, [today])

  const suggestions = useMemo(() => {
    const q = countryQuery.trim()
    if (!q) return []
    return countryOptions.filter((c) => {
      if (c.name.includes(q)) return true
      if (c.aliases?.some((a) => a.includes(q))) return true
      return false
    }).slice(0, 14)
  }, [countryQuery, countryOptions])

  const arrivalSuggestions = useMemo(() => {
    if (pickerPhase !== 'arrival' || !draftCountry) return []
    const all = getArrivalsForCountry(draftCountry)
    return filterArrivalsByQuery(all, sanitizeArrivalInput(arrivalQuery))
  }, [pickerPhase, draftCountry, arrivalQuery])

  useEffect(() => {
    function handlePointerDown(e) {
      if (!comboRef.current?.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  /** 국가 선택이 해제되면 날짜도 비워 일관성 유지 */
  useEffect(() => {
    if (!selectedCountry) {
      setStartDate('')
      setEndDate('')
      setDateScheduleMode('fixed')
      setDateFlexibilityDays(0)
    }
  }, [selectedCountry])

  const confirmCountry = (c) => {
    setSelectedCountry(c)
    setCountryQuery('')
    setDropdownOpen(false)
    setPickerPhase('country')
    setDraftCountry(null)
    setArrivalQuery('')
  }

  const beginArrivalPicker = (c) => {
    setDraftCountry(c)
    setPickerPhase('arrival')
    setCountryQuery(c.name)
    setArrivalQuery('')
    setDropdownOpen(true)
  }

  const handlePickCountryFromList = (c) => {
    const arrivals = getArrivalsForCountry(c)
    if (arrivals.length === 1) {
      const merged = { ...countryRowWithoutArrivals(c), city: arrivals[0].city, iata: arrivals[0].iata }
      confirmCountry(merged)
      return
    }
    beginArrivalPicker(c)
  }

  const handlePickArrival = (a) => {
    if (!draftCountry) return
    const merged = { ...countryRowWithoutArrivals(draftCountry), city: a.city, iata: a.iata }
    confirmCountry(merged)
  }

  const handleChangeCountryRequest = () => {
    setPickerPhase('country')
    setDraftCountry(null)
    setCountryQuery('')
    setArrivalQuery('')
    setDropdownOpen(true)
  }

  const handleCountryInputChange = (raw) => {
    if (pickerPhase === 'arrival') return
    const v = sanitizeCountryInput(raw)
    setCountryQuery(v)
    setDropdownOpen(true)
    setSelectedCountry((prev) => {
      if (!prev) return null
      if (v.trim() === '') return prev
      if (v === prev.name) return prev
      return null
    })
  }

  const handleCountryFocus = () => {
    setDropdownOpen(true)
  }

  const handleCountryKeyDown = (e) => {
    if (pickerPhase === 'arrival') return
    if (e.key !== 'Enter') return
    if (e.nativeEvent.isComposing) return
    e.preventDefault()

    const trimmed = countryQuery.trim()
    if (!trimmed) return

    const exact = findExactCountryMatch(trimmed, countryOptions)
    if (exact) {
      handlePickCountryFromList(exact)
      return
    }

    const q = countryQuery.trim()
    const list = countryOptions.filter((c) => {
      if (c.name.includes(q)) return true
      if (c.aliases?.some((a) => a.includes(q))) return true
      return false
    })
    if (list.length === 1) {
      handlePickCountryFromList(list[0])
      return
    }
    if (list.length > 1) {
      handlePickCountryFromList(list[0])
    }
  }

  const handleArrivalQueryChange = (raw) => {
    setArrivalQuery(sanitizeArrivalInput(raw))
  }

  const handleArrivalKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      handleChangeCountryRequest()
      return
    }
    if (e.key !== 'Enter') return
    if (e.nativeEvent.isComposing) return
    e.preventDefault()
    if (arrivalSuggestions.length === 1) {
      handlePickArrival(arrivalSuggestions[0])
      return
    }
    const t = arrivalQuery.trim()
    if (t && arrivalSuggestions.length > 0) {
      handlePickArrival(arrivalSuggestions[0])
    }
  }

  const removeCountryTag = () => {
    setSelectedCountry(null)
    setCountryQuery('')
    setPickerPhase('country')
    setDraftCountry(null)
    setArrivalQuery('')
  }

  const handleMobileRangeChange = ({ start, end }) => {
    setStartDate(start)
    setEndDate(end)
  }

  const dateSectionOk =
    startDate !== '' && endDate !== '' && endDate >= startDate

  const isValid = Boolean(selectedCountry) && dateSectionOk

  const goNext = () => {
    if (!isValid || !selectedCountry) return
    const navState = {
      destination: {
        iata: selectedCountry.iata,
        city: selectedCountry.city,
        country: selectedCountry.country,
        countryCode: selectedCountry.countryCode,
      },
      fromDestinationPage: true,
      tripStartDate: startDate,
      tripEndDate: endDate,
      tripScheduleMode: dateScheduleMode,
      tripDateFlexibilityDays: dateFlexibilityDays,
    }
    saveStep4NavigationState(navState)
    saveActiveTripPlan({
      destination: {
        iata: selectedCountry.iata,
        city: selectedCountry.city,
        country: selectedCountry.country,
        countryCode: selectedCountry.countryCode,
      },
      tripStartDate: startDate,
      tripEndDate: endDate,
      tripScheduleMode: dateScheduleMode,
      tripDateFlexibilityDays: dateFlexibilityDays,
    })
    navigate('/trips/new/step4', { state: navState })
  }

  const formProps = {
    comboRef,
    countryQuery,
    onCountryInputChange: handleCountryInputChange,
    onCountryKeyDown: handleCountryKeyDown,
    onCountryFocus: handleCountryFocus,
    countryInputReadOnly: pickerPhase === 'arrival',
    onChangeCountryRequest: handleChangeCountryRequest,
    suggestions,
    showDropdown: dropdownOpen,
    onPickCountry: handlePickCountryFromList,
    pickerPhase,
    arrivalQuery,
    onArrivalQueryChange: handleArrivalQueryChange,
    onArrivalKeyDown: handleArrivalKeyDown,
    arrivalSuggestions,
    onPickArrival: handlePickArrival,
    selectedCountry,
    onRemoveCountryTag: removeCountryTag,
    startDate,
    endDate,
    today,
    onRangeChange: handleMobileRangeChange,
    scheduleMode: dateScheduleMode,
    onScheduleModeChange: setDateScheduleMode,
    flexibilityDays: dateFlexibilityDays,
    onFlexibilityDaysChange: setDateFlexibilityDays,
    allCountries: countryOptions,
  }

  return (
    <div className="min-h-screen" style={TRIP_FLOW_PAGE_BG_STYLE}>
      {/* 데스크톱: 풀블리드 이미지 없음 — 본문만 뷰포트 중앙 정렬 */}
      <div className="hidden min-h-screen flex-col md:flex">
        {/* Header.jsx 와 동일: max-w-7xl + px-3 md:px-6 lg:px-8 → 로고·이전으로 왼선 일치 */}
        <div className="shrink-0 mx-auto w-full max-w-7xl px-3 pt-8 md:px-6 md:pt-8 lg:px-8 lg:pt-10">
          <TripNewFlowDesktopPrevBar align="start" />
        </div>
        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 items-center justify-center px-3 py-8 md:px-6 md:py-8 lg:px-8 lg:py-10">
          <div className="scrollbar-hide w-full max-w-xl overflow-y-auto">
            <StepHeader
              currentStep={STEP_DESTINATION_CONFIG.currentStep}
              totalSteps={STEP_DESTINATION_CONFIG.totalSteps}
              title={
                <>
                  방문 도시와 날짜를
                  <br />
                  알려주세요
                </>
              }
              subtitle={SUBTITLE_DESKTOP}
              className="mb-8"
            />
            <DestinationDateForm {...formProps} />
            <div className="mt-6">
              <TripFlowNextStepButton variant="amber" disabled={!isValid} onClick={goNext} />
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <div className="px-5 pt-4 pb-56">
          <StepHeader
            currentStep={STEP_DESTINATION_CONFIG.currentStep}
            totalSteps={STEP_DESTINATION_CONFIG.totalSteps}
            title={
              <>
                방문 도시와 날짜를
                <br />
                알려주세요
              </>
            }
            className="mb-4"
            titleClassName="text-2xl"
            topEndAction={<TripNewFlowMobilePrevAction />}
          />

          <div className="mb-8 rounded-2xl border border-sky-100/90 bg-sky-50/95 p-4 shadow-sm">
            <DestinationCountryAutocomplete
              comboRef={comboRef}
              countryQuery={countryQuery}
              onCountryInputChange={handleCountryInputChange}
              onCountryKeyDown={handleCountryKeyDown}
              onCountryFocus={handleCountryFocus}
              countryInputReadOnly={pickerPhase === 'arrival'}
              onChangeCountryRequest={handleChangeCountryRequest}
              suggestions={suggestions}
              isPanelOpen={dropdownOpen && (pickerPhase === 'arrival' || countryQuery.trim().length > 0)}
              onPickCountry={handlePickCountryFromList}
              pickerPhase={pickerPhase}
              arrivalQuery={arrivalQuery}
              onArrivalQueryChange={handleArrivalQueryChange}
              onArrivalKeyDown={handleArrivalKeyDown}
              arrivalSuggestions={arrivalSuggestions}
              onPickArrival={handlePickArrival}
              panelId="country-autocomplete-panel-mobile"
              placeholder="어디로 떠나시나요?"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {MOBILE_QUICK_DESTINATION_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    const c = countryOptions.find((x) => x.name === chip.countryName)
                    if (c) handlePickCountryFromList(c)
                  }}
                  className="rounded-full border border-sky-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800 shadow-sm transition active:scale-[0.98]"
                >
                  #{chip.label}
                </button>
              ))}
            </div>

            {selectedCountry && (
              <SelectedCountryChip country={selectedCountry} onRemove={removeCountryTag} variant="mobile" />
            )}
          </div>

          <div className="mb-3 flex items-center gap-2">
            <h2 className={`text-lg font-bold ${selectedCountry ? 'text-gray-900' : 'text-gray-400'}`}>
              언제 떠나시나요?
            </h2>
          </div>

          <div className="rounded-2xl border border-teal-100/90 bg-gradient-to-br from-teal-50/60 to-cyan-50/30 p-3 shadow-sm">
            {!selectedCountry && (
              <p className="mb-2 rounded-xl bg-white/90 px-3 py-2 text-xs leading-relaxed text-gray-600 ring-1 ring-teal-100/80">
                위에서 <strong className="text-teal-700">여행지</strong>를 먼저 선택하면 일정을 고를 수 있어요.
              </p>
            )}
            <DestinationMobileRangeCalendar
              startDate={startDate}
              endDate={endDate}
              todayYmd={today}
              minDateYmd={today}
              disabled={!selectedCountry}
              onChangeRange={handleMobileRangeChange}
              scheduleMode={dateScheduleMode}
              onScheduleModeChange={setDateScheduleMode}
              flexibilityDays={dateFlexibilityDays}
              onFlexibilityDaysChange={setDateFlexibilityDays}
            />
          </div>
        </div>

        {/* 날짜 선택 완료 시: 예시 이미지처럼 노란 CTA 바로 위에 떠 있는 요약 캡슐 */}
        <div className="fixed bottom-16 left-0 right-0 z-40 flex flex-col items-stretch px-4 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          {selectedCountry && startDate && endDate && (
            <div
              className="mb-2 flex justify-center px-1"
              role="status"
              aria-live="polite"
            >
              <div
                className="flex max-w-full items-center gap-2.5 rounded-full border border-gray-100 bg-white px-4 py-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.12)]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-[18px] w-[18px] shrink-0 text-amber-500"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
                </svg>
                <p className="truncate text-center text-[13px] font-semibold leading-snug text-gray-900">
                  {formatKoreanDateRangeLine(startDate, endDate)} ({formatTripNightsDaysLabel(startDate, endDate)})
                </p>
              </div>
            </div>
          )}
          <div className="px-1 pt-1">
            <TripFlowNextStepButton variant="amber" disabled={!isValid} onClick={goNext} />
          </div>
        </div>
      </div>
    </div>
  )
}
