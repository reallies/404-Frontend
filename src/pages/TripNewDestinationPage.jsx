import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  STEP_DESTINATION_CONFIG,
  DESTINATION_ICON_PATHS,
  COUNTRY_ARRIVAL_OPTIONS,
  MOBILE_QUICK_DESTINATION_CHIPS,
  filterCountriesByQuery,
  sanitizeCountryInput,
  HERO_IMAGE,
  AI_TIP,
} from '@/mocks/tripNewDestinationData'
import StepHeader from '@/components/common/StepHeader'
import AiConciergeTip from '@/components/common/AiConciergeTip'
import TripStepDesktopSplit from '@/components/trip/TripStepDesktopSplit'
import { TripFlowNextStepButton } from '@/components/trip/TripFlowNextStepButton'
import { FullBleedMintImageHero } from '@/components/trip/MintProgressiveHero'
import { TripFlowDesktopBar, TripFlowMobileBar } from '@/components/common/TripFlowTopBar'
import DestinationMobileRangeCalendar, {
  formatTripNightsDaysLabel,
} from '@/components/trip/DestinationMobileRangeCalendar'
import { saveStep4NavigationState } from '@/utils/tripFlowDraftStorage'

/** `<input type="date" min>` 용 — 브라우저 로컬 달력과 맞추기 위해 UTC가 아닌 로컬 날짜 사용 */
function getLocalDateYYYYMMDD() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function SvgIcon({ name, className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d={DESTINATION_ICON_PATHS[name]} />
    </svg>
  )
}

/** 엔터·정확 일치용: 목록에서 국가명 또는 별칭과 일치하는 항목 */
function findExactCountryMatch(trimmedQuery) {
  const q = trimmedQuery
  if (!q) return null
  const lower = q.toLowerCase()
  return (
    COUNTRY_ARRIVAL_OPTIONS.find((c) => c.name === q) ||
    COUNTRY_ARRIVAL_OPTIONS.find((c) => c.aliases?.some((a) => a.toLowerCase() === lower)) ||
    null
  )
}

const SUBTITLE_DESKTOP = (
  <p className="text-gray-600">
    어디로, 언제 떠날지 알려주시면 저희가 당신만을 위한 체크리스트를 만들어드릴게요!
  </p>
)

function formatKoreanDateRangeLine(startStr, endStr) {
  if (!startStr || !endStr) return ''
  const [y1, m1, d1] = startStr.split('-').map(Number)
  const [y2, m2, d2] = endStr.split('-').map(Number)
  if (y1 === y2) return `${m1}월 ${d1}일 - ${m2}월 ${d2}일`
  return `${y1}년 ${m1}월 ${d1}일 - ${y2}년 ${m2}월 ${d2}일`
}

function DestinationDateForm({
  comboRef,
  countryQuery,
  onCountryInputChange,
  onCountryKeyDown,
  onCountryFocus,
  suggestions,
  showDropdown,
  onPickCountry,
  selectedCountry,
  onRemoveCountryTag,
  startDate,
  endDate,
  today,
  endMinDate,
  onStartChange,
  onEndChange,
}) {
  const hasQuery = countryQuery.trim().length > 0
  const panelOpen = showDropdown && hasQuery

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-100/90 bg-sky-50/90 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-sky-600 shadow-sm">
            <SvgIcon name="mapPin" className="h-5 w-5" />
          </div>
          <span className="text-base font-bold text-gray-900">어디로 떠나시나요?</span>
        </div>

        <div ref={comboRef} className="relative z-20">
          <div
            className={`relative border border-sky-100/80 bg-white shadow-inner transition-[border-radius,box-shadow] ${
              panelOpen ? 'rounded-t-2xl ring-2 ring-sky-200' : 'rounded-2xl'
            }`}
          >
            <SvgIcon
              name="search"
              className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={countryQuery}
              onChange={(e) => onCountryInputChange(e.target.value)}
              onKeyDown={onCountryKeyDown}
              onFocus={onCountryFocus}
              placeholder="국가명 입력 후 엔터 또는 목록에서 선택"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={panelOpen}
              aria-controls="country-autocomplete-panel"
              className={`w-full bg-transparent py-3.5 pl-12 pr-4 text-sm text-gray-800 outline-none placeholder:text-gray-400 ${
                panelOpen ? 'rounded-t-2xl' : 'rounded-2xl'
              }`}
            />
          </div>

          {panelOpen && (
            <div
              id="country-autocomplete-panel"
              role="listbox"
              aria-label="국가 자동완성"
              className="absolute left-0 right-0 top-full z-30 max-h-52 overflow-y-auto rounded-b-2xl border border-t-0 border-sky-200 bg-white shadow-lg ring-2 ring-sky-200 ring-t-0"
            >
              {suggestions.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">일치하는 국가가 없어요. 다른 검색어를 입력해 보세요.</p>
              ) : (
                <ul className="py-1">
                  {suggestions.map((c) => (
                    <li key={c.name} role="none">
                      <button
                        type="button"
                        role="option"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onPickCountry(c)
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-800 transition hover:bg-sky-50"
                      >
                        <span className="font-semibold">{c.name}</span>
                        <span className="text-xs text-gray-500">
                          {c.city} · {c.iata}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {selectedCountry && (
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-medium text-gray-500">선택한 여행지</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-900 shadow-sm">
                <span className="text-teal-600">#</span>
                {selectedCountry.name}
                <span className="text-xs font-normal text-teal-700/80">({selectedCountry.city})</span>
                <button
                  type="button"
                  onClick={onRemoveCountryTag}
                  className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-teal-600 hover:bg-teal-200/60"
                  aria-label={`${selectedCountry.name} 선택 해제`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </span>
            </div>
          </div>
        )}
      </div>

      <div
        className={`rounded-2xl border border-sky-100/90 bg-sky-50/90 p-5 shadow-sm transition-opacity ${
          selectedCountry ? '' : 'opacity-60'
        }`}
        aria-disabled={!selectedCountry}
      >
        <div className="mb-4 flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ${
              selectedCountry ? 'bg-white/90 text-sky-600' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <SvgIcon name="calendar" className="h-5 w-5" />
          </div>
          <span className={`text-base font-bold ${selectedCountry ? 'text-gray-900' : 'text-gray-500'}`}>
            언제 떠나시나요?
          </span>
        </div>
        {!selectedCountry && (
          <p className="mb-3 rounded-xl bg-white/80 px-3 py-2 text-xs text-gray-500 ring-1 ring-sky-100/80">
            위에서 <strong className="text-sky-700">여행 국가</strong>를 먼저 선택하면 일정을 입력할 수 있어요.
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-500">출발일</p>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                min={today}
                disabled={!selectedCountry}
                onChange={(e) => onStartChange(e.target.value)}
                className="w-full rounded-xl border border-sky-100/80 bg-sky-100/50 px-3 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-500">귀국일</p>
            <input
              type="date"
              value={endDate}
              min={endMinDate}
              disabled={!selectedCountry}
              onChange={(e) => onEndChange(e.target.value)}
              className="w-full rounded-xl border border-sky-100/80 bg-sky-100/50 py-3 px-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            />
          </div>
        </div>
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
    const syncToday = () => setToday(getLocalDateYYYYMMDD())
    syncToday()
    const intervalId = setInterval(syncToday, 60_000)
    const onFocus = () => syncToday()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncToday()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const [countryQuery, setCountryQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  /** 자정 등으로 today가 바뀌면 과거로 밀린 값은 비움 */
  useEffect(() => {
    setStartDate((prev) => (prev && prev < today ? '' : prev))
    setEndDate((prev) => (prev && prev < today ? '' : prev))
  }, [today])

  const suggestions = useMemo(() => filterCountriesByQuery(countryQuery), [countryQuery])

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
    }
  }, [selectedCountry])

  const confirmCountry = (c) => {
    setSelectedCountry(c)
    setCountryQuery('')
    setDropdownOpen(false)
  }

  const handleCountryInputChange = (raw) => {
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
    if (e.key !== 'Enter') return
    if (e.nativeEvent.isComposing) return
    e.preventDefault()

    const trimmed = countryQuery.trim()
    if (!trimmed) return

    const exact = findExactCountryMatch(trimmed)
    if (exact) {
      confirmCountry(exact)
      return
    }

    const list = filterCountriesByQuery(countryQuery)
    if (list.length === 1) {
      confirmCountry(list[0])
      return
    }
    if (list.length > 1) {
      confirmCountry(list[0])
    }
  }

  const removeCountryTag = () => {
    setSelectedCountry(null)
    setCountryQuery('')
  }

  const endMinDate = useMemo(() => {
    if (!startDate) return today
    return startDate >= today ? startDate : today
  }, [startDate, today])

  const handleStartChange = (value) => {
    let next = value
    if (next && next < today) next = today
    setStartDate(next)
    if (endDate && next && endDate < next) {
      setEndDate('')
    }
  }

  const handleEndChange = (value) => {
    let next = value
    if (next && next < endMinDate) next = endMinDate
    setEndDate(next)
  }

  const handleMobileRangeChange = ({ start, end }) => {
    setStartDate(start)
    setEndDate(end)
  }

  const destinationSectionOk = Boolean(selectedCountry)
  const dateSectionOk =
    startDate !== '' && endDate !== '' && endDate >= startDate

  const isValid = destinationSectionOk && dateSectionOk

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
    }
    saveStep4NavigationState(navState)
    navigate('/trips/new/step4', { state: navState })
  }

  const formProps = {
    comboRef,
    countryQuery,
    onCountryInputChange: handleCountryInputChange,
    onCountryKeyDown: handleCountryKeyDown,
    onCountryFocus: handleCountryFocus,
    suggestions,
    showDropdown: dropdownOpen,
    onPickCountry: confirmCountry,
    selectedCountry,
    onRemoveCountryTag: removeCountryTag,
    startDate,
    endDate,
    today,
    endMinDate,
    onStartChange: handleStartChange,
    onEndChange: handleEndChange,
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #E0F7FA 0%, #F0FDFA 100%)' }}
    >
      <TripStepDesktopSplit
        fullBleed={<FullBleedMintImageHero src={HERO_IMAGE} alt="비행기 창문" />}
        left={
          <>
            <TripFlowDesktopBar backTo="/trips/new/step2" className="mb-6" />

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

            <div className="flex-1">
              <DestinationDateForm {...formProps} />
            </div>

            <div className="mt-6">
              <TripFlowNextStepButton variant="amber" disabled={!isValid} onClick={goNext} />
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
        <TripFlowMobileBar backTo="/trips/new/step2" centerTitle="여행지 & 일정 설정" />

        <div className="px-4 pb-44 pt-4">
          <div className="mb-6 flex items-center gap-3">
            <span className="shrink-0 rounded-full bg-teal-800 px-3 py-1.5 text-[11px] font-bold tracking-wide text-white">
              STEP {String(STEP_DESTINATION_CONFIG.currentStep).padStart(2, '0')}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-sky-100">
              <div
                className="h-full rounded-full bg-teal-500 transition-all duration-500"
                style={{
                  width: `${Math.round(
                    (STEP_DESTINATION_CONFIG.currentStep / STEP_DESTINATION_CONFIG.totalSteps) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>

          <h2 className="mb-3 text-lg font-bold text-gray-900">방문 도시 검색</h2>
          <div className="mb-8 rounded-2xl border border-sky-100/90 bg-sky-50/95 p-4 shadow-sm">
            <div ref={comboRef} className="relative z-20">
              <div
                className={`relative border border-sky-100/80 bg-white shadow-inner transition-[border-radius,box-shadow] ${
                  dropdownOpen && countryQuery.trim().length > 0
                    ? 'rounded-t-2xl ring-2 ring-sky-200'
                    : 'rounded-2xl'
                }`}
              >
                <SvgIcon
                  name="search"
                  className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={countryQuery}
                  onChange={(e) => handleCountryInputChange(e.target.value)}
                  onKeyDown={handleCountryKeyDown}
                  onFocus={handleCountryFocus}
                  placeholder="어디로 떠나시나요?"
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-expanded={dropdownOpen && countryQuery.trim().length > 0}
                  aria-controls="country-autocomplete-panel-mobile"
                  className={`w-full rounded-2xl bg-transparent py-3.5 pl-12 pr-4 text-sm text-gray-800 outline-none placeholder:text-gray-400 ${
                    dropdownOpen && countryQuery.trim().length > 0 ? 'rounded-t-2xl' : ''
                  }`}
                />
              </div>

              {dropdownOpen && countryQuery.trim().length > 0 && (
                <div
                  id="country-autocomplete-panel-mobile"
                  role="listbox"
                  aria-label="국가 자동완성"
                  className="absolute left-0 right-0 top-full z-30 max-h-52 overflow-y-auto rounded-b-2xl border border-t-0 border-sky-200 bg-white shadow-lg ring-2 ring-sky-200 ring-t-0"
                >
                  {suggestions.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      일치하는 국가가 없어요. 다른 검색어를 입력해 보세요.
                    </p>
                  ) : (
                    <ul className="py-1">
                      {suggestions.map((c) => (
                        <li key={c.name} role="none">
                          <button
                            type="button"
                            role="option"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              confirmCountry(c)
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-800 transition hover:bg-sky-50"
                          >
                            <span className="font-semibold">{c.name}</span>
                            <span className="text-xs text-gray-500">
                              {c.city} · {c.iata}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {MOBILE_QUICK_DESTINATION_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    const c = COUNTRY_ARRIVAL_OPTIONS.find((x) => x.name === chip.countryName)
                    if (c) confirmCountry(c)
                  }}
                  className="rounded-full border border-sky-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800 shadow-sm transition active:scale-[0.98]"
                >
                  #{chip.label}
                </button>
              ))}
            </div>

            {selectedCountry && (
              <div className="mt-3 border-t border-sky-100/80 pt-3">
                <p className="mb-2 text-[11px] font-medium text-gray-500">선택한 여행지</p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-900 shadow-sm">
                  <span className="text-teal-600">#</span>
                  {selectedCountry.name}
                  <span className="text-xs font-normal text-teal-700/80">({selectedCountry.city})</span>
                  <button
                    type="button"
                    onClick={removeCountryTag}
                    className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-teal-600 hover:bg-teal-200/60"
                    aria-label={`${selectedCountry.name} 선택 해제`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </span>
              </div>
            )}
          </div>

          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className={`text-lg font-bold ${selectedCountry ? 'text-gray-900' : 'text-gray-400'}`}>
              여행 기간 선택
            </h2>
            <span className="text-sm font-semibold text-gray-500">
              {(startDate ? parseInt(startDate.slice(0, 4), 10) : new Date().getFullYear())}년
            </span>
          </div>

          <div className="relative rounded-2xl border border-sky-100/90 bg-sky-50/95 p-3 shadow-sm">
            {!selectedCountry && (
              <p className="mb-2 rounded-xl bg-white/90 px-3 py-2 text-xs leading-relaxed text-gray-600 ring-1 ring-sky-100/80">
                위에서 <strong className="text-sky-700">여행지</strong>를 먼저 선택하면 일정을 고를 수 있어요.
              </p>
            )}
            <DestinationMobileRangeCalendar
              startDate={startDate}
              endDate={endDate}
              todayYmd={today}
              minDateYmd={today}
              disabled={!selectedCountry}
              onChangeRange={handleMobileRangeChange}
            />
            {selectedCountry && startDate && endDate && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex max-w-[calc(100%-1rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-sky-200/90 bg-white px-3 py-2 text-[11px] font-semibold text-gray-800 shadow-lg sm:text-xs">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 shrink-0 text-amber-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
                </svg>
                <span className="truncate">
                  {formatKoreanDateRangeLine(startDate, endDate)} ({formatTripNightsDaysLabel(startDate, endDate)})
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-16 left-0 right-0 z-40 bg-transparent px-5 pb-3 pt-3 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          <TripFlowNextStepButton variant="amber" disabled={!isValid} onClick={goNext} />
        </div>
      </div>
    </div>
  )
}
