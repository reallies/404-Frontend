import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  STEP_DESTINATION_CONFIG,
  DESTINATION_ICON_PATHS,
  COUNTRY_ARRIVAL_OPTIONS,
  filterCountriesByQuery,
  sanitizeCountryInput,
  HERO_IMAGE,
  PREVIEW_IMAGE,
  AI_TIP,
  MOBILE_TIP,
} from '@/mocks/tripNewDestinationData'
import StepHeader from '@/components/common/StepHeader'
import AiConciergeTip, { AiConciergeTipHeading, AiConciergeTipIcon } from '@/components/common/AiConciergeTip'
import TripStepDesktopSplit from '@/components/trip/TripStepDesktopSplit'
import { FullBleedMintImageHero } from '@/components/trip/MintProgressiveHero'
import { TripFlowDesktopBar, TripFlowMobileBar } from '@/components/common/TripFlowTopBar'
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
    어디로, 언제 떠날지 알려주시면 Mate가 당신만을 위한 체크리스트를 제안해드릴게요!
  </p>
)

const SUBTITLE_MOBILE = (
  <div className="space-y-2">
    <p className="text-sm text-gray-600">
      어디로, 언제 떠날지 알려주시면 Mate가 맞춤 체크리스트를 제안해드릴게요!
    </p>
  </div>
)

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

  const ctaClassName = `flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold shadow-sm transition-all ${
    isValid
      ? 'cursor-pointer bg-amber-400 text-gray-900 hover:bg-amber-500 hover:shadow-md'
      : 'cursor-not-allowed bg-gray-200 text-gray-400'
  }`

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
              <button type="button" disabled={!isValid} onClick={goNext} className={ctaClassName}>
                다음 단계로 이동
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                </svg>
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
        <TripFlowMobileBar backTo="/trips/new/step2" />

        <div className="px-5 pb-44 pt-4">
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
            subtitle={SUBTITLE_MOBILE}
            className="mb-6"
            titleClassName="text-2xl"
          />

          <DestinationDateForm {...formProps} />

          <div className="mb-5 mt-5 flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
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

          <div className="relative mb-4 h-44 overflow-hidden rounded-2xl">
            <img src={PREVIEW_IMAGE} alt="여행 미리보기" className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-5">
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-white/70">TRIP PREVIEW</p>
              <p className="text-xs text-white/90">Your journey starts with a destination.</p>
            </div>
          </div>
        </div>

        <div className="fixed bottom-16 left-0 right-0 z-40 bg-transparent px-5 pb-3 pt-3 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" disabled={!isValid} onClick={goNext} className={ctaClassName}>
            다음 단계로 이동
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
