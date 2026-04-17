import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  STEP3_CONFIG,
  STEP3_ICON_PATHS,
  FLIGHT_SECTIONS,
  FLIGHT_NO_EXAMPLES_HINT,
  HERO_IMAGE,
  AI_TIP,
  MOBILE_TIP,
} from '@/mocks/tripNewStep3Data'
import { fetchFlightInfo } from '@/mocks/flightMockData'
import StepHeader from '@/components/common/StepHeader'
import { TripFlowDesktopBar, TripFlowMobileBar } from '@/components/common/TripFlowTopBar'
import AiConciergeTip, { AiConciergeTipHeading, AiConciergeTipIcon } from '@/components/common/AiConciergeTip'
import TripStepDesktopSplit from '@/components/trip/TripStepDesktopSplit'
import { TripFlowNextStepButton } from '@/components/trip/TripFlowNextStepButton'
import { FullBleedMintImageHero } from '@/components/trip/MintProgressiveHero'
import { saveStep4NavigationState } from '@/utils/tripFlowDraftStorage'

/* ─────────────────────────────────────────────
   범용 SVG 아이콘
───────────────────────────────────────────── */
function SvgIcon({ name, className = 'w-4 h-4' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d={STEP3_ICON_PATHS[name]} />
    </svg>
  )
}

/** Step3 헤더 부제 */
const STEP3_SUBTITLE_TEXT =
  '맞춤 여행 준비를 도와드리려면, 먼저 예약하신 항공 일정이 필요해요. 가는편과 오는편 각각 탑승 날짜와 편명을 입력해 주세요.'

const STEP3_SUBTITLE_DESKTOP = (
  <>
    <p className="text-gray-600 leading-relaxed">{STEP3_SUBTITLE_TEXT}</p>
    <p className="mt-3 text-[11px] leading-relaxed text-gray-600">{FLIGHT_NO_EXAMPLES_HINT}</p>
  </>
)

const STEP3_SUBTITLE_MOBILE = (
  <>
    <p className="text-sm text-gray-600 leading-relaxed">{STEP3_SUBTITLE_TEXT}</p>
    <p className="mt-3 text-[11px] leading-relaxed text-gray-600">{FLIGHT_NO_EXAMPLES_HINT}</p>
  </>
)

/* ─────────────────────────────────────────────
   조회 결과 배지 (출발 → 도착 노선 표시)
───────────────────────────────────────────── */
function FlightResultBadge({ info }) {
  return (
    <div className="mt-3 bg-cyan-50 border border-cyan-100 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-teal-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-teal-700">
          {info.departure.iata} → {info.arrival.iata}
          <span className="ml-2 font-normal text-gray-500">{info.airline}</span>
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {info.departure.city} → {info.arrival.city}
          {info.arrival.country && ` (${info.arrival.country})`}
        </p>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   항공편 입력 카드 (데스크탑용)
───────────────────────────────────────────── */
function DesktopFlightCard({ section, date, flightNo, flightResult, loadingLookup, lookupError, today, returnMinDate, onDateChange, onFlightNoChange, onLookup }) {
  return (
    <div className="relative bg-white rounded-2xl p-6 pt-7 shadow-sm">
      {flightResult && (
        <span className="absolute right-6 top-4 text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
          조회 완료
        </span>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* 날짜 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">{section.dateLabel}</p>
          <input
            type="date"
            value={date}
            min={section.id === 'return' ? returnMinDate : today}
            onChange={(e) => onDateChange(section.id, e.target.value)}
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-cyan-400 transition"
          />
        </div>

        {/* 편명 + 조회 버튼 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">{section.flightLabel}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={flightNo}
              onChange={(e) => onFlightNoChange(section.id, e.target.value.toUpperCase())}
              placeholder={section.flightPlaceholder}
              className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-cyan-400 transition"
            />
            <button
              onClick={() => onLookup(section.id)}
              disabled={!flightNo.trim() || loadingLookup}
              className={`flex-shrink-0 px-3 py-3 rounded-xl text-xs font-bold transition-all ${
                !flightNo.trim() || loadingLookup
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
              }`}
            >
              {loadingLookup ? '...' : '조회'}
            </button>
          </div>
        </div>
      </div>

      {/* 오류 메시지 */}
      {lookupError && (
        <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {lookupError}
        </p>
      )}

      {/* 조회 결과 */}
      {flightResult && <FlightResultBadge info={flightResult} />}
    </div>
  )
}

/* ─────────────────────────────────────────────
   항공편 입력 카드 (모바일용)
───────────────────────────────────────────── */
function MobileFlightCard({ section, date, flightNo, flightResult, loadingLookup, lookupError, today, returnMinDate, onDateChange, onFlightNoChange, onLookup }) {
  return (
    <div className="relative bg-white rounded-2xl p-5 pt-6 shadow-sm">
      {flightResult && (
        <span className="absolute right-5 top-4 text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
          조회 완료
        </span>
      )}

      <div className="space-y-3">
        {/* 날짜 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">날짜</p>
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2">
            <SvgIcon name="calendar" className="w-4 h-4 text-cyan-500 flex-shrink-0" />
            <input
              type="date"
              value={date}
              min={section.id === 'return' ? returnMinDate : today}
              onChange={(e) => onDateChange(section.id, e.target.value)}
              className="bg-transparent text-sm text-gray-700 outline-none w-full"
            />
          </div>
        </div>

        {/* 편명 + 조회 버튼 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">편명</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2">
              <SvgIcon name="flightTicket" className="w-4 h-4 text-cyan-500 flex-shrink-0" />
              <input
                type="text"
                value={flightNo}
                onChange={(e) => onFlightNoChange(section.id, e.target.value.toUpperCase())}
                placeholder={section.flightPlaceholder}
                className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
              />
            </div>
            <button
              onClick={() => onLookup(section.id)}
              disabled={!flightNo.trim() || loadingLookup}
              className={`flex-shrink-0 px-4 rounded-xl text-xs font-bold transition-all ${
                !flightNo.trim() || loadingLookup
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
              }`}
            >
              {loadingLookup ? '...' : '조회'}
            </button>
          </div>
        </div>

        {/* 오류 */}
        {lookupError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {lookupError}
          </p>
        )}

        {/* 조회 결과 */}
        {flightResult && <FlightResultBadge info={flightResult} />}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   메인 컴포넌트
───────────────────────────────────────────── */
function TripNewStep3Page() {
  const navigate = useNavigate()

  const today = new Date().toISOString().split('T')[0]

  const [flights, setFlights] = useState({
    departure: { date: '', flightNo: '' },
    return: { date: '', flightNo: '' },
  })
  const [flightInfo, setFlightInfo] = useState({ departure: null, return: null })
  const [loading, setLoading] = useState({ departure: false, return: false })
  const [error, setError] = useState({ departure: '', return: '' })

  const getReturnMinDate = () => {
    if (!flights.departure.date) return today
    const next = new Date(flights.departure.date)
    next.setDate(next.getDate() + 1)
    return next.toISOString().split('T')[0]
  }

  const handleDateChange = (sectionId, value) => {
    setFlights((prev) => ({ ...prev, [sectionId]: { ...prev[sectionId], date: value } }))
    // 출국편 날짜 변경 시 귀국편 조회 결과 초기화
    if (sectionId === 'departure') {
      setFlightInfo((prev) => ({ ...prev, return: null }))
      setFlights((prev) => ({ ...prev, return: { ...prev.return, date: '' } }))
    }
  }

  const handleFlightNoChange = (sectionId, value) => {
    setFlights((prev) => ({ ...prev, [sectionId]: { ...prev[sectionId], flightNo: value } }))
    // 편명 변경 시 이전 조회 결과 초기화
    setFlightInfo((prev) => ({ ...prev, [sectionId]: null }))
    setError((prev) => ({ ...prev, [sectionId]: '' }))
  }

  const handleLookup = async (sectionId) => {
    const flightNo = flights[sectionId].flightNo.trim()
    if (!flightNo) return

    setLoading((prev) => ({ ...prev, [sectionId]: true }))
    setError((prev) => ({ ...prev, [sectionId]: '' }))
    setFlightInfo((prev) => ({ ...prev, [sectionId]: null }))

    try {
      const data = await fetchFlightInfo(flightNo)
      setFlightInfo((prev) => ({ ...prev, [sectionId]: data }))
    } catch (e) {
      setError((prev) => ({ ...prev, [sectionId]: e.message }))
    } finally {
      setLoading((prev) => ({ ...prev, [sectionId]: false }))
    }
  }

  const isValid =
    flights.departure.date !== '' &&
    flights.return.date !== '' &&
    flightInfo.departure !== null &&
    flightInfo.return !== null

  const cardProps = (section) => ({
    section,
    date: flights[section.id].date,
    flightNo: flights[section.id].flightNo,
    flightResult: flightInfo[section.id],
    loadingLookup: loading[section.id],
    lookupError: error[section.id],
    today,
    returnMinDate: getReturnMinDate(),
    onDateChange: handleDateChange,
    onFlightNoChange: handleFlightNoChange,
    onLookup: handleLookup,
  })

  const goToStep4 = () => {
    const navState = { destination: flightInfo.departure?.arrival || null }
    saveStep4NavigationState(navState)
    navigate('/trips/new/step4', { state: navState })
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #E0F7FA 0%, #F0FDFA 100%)' }}
    >

      {/* ══════════════════════════════════
          데스크탑 레이아웃 (md 이상)
      ══════════════════════════════════ */}
      <TripStepDesktopSplit
        fullBleed={<FullBleedMintImageHero src={HERO_IMAGE} alt="비행기 창문" />}
        left={
          <>
            <TripFlowDesktopBar backTo="/trips/new/step2" className="mb-6" />

            <StepHeader
              currentStep={STEP3_CONFIG.currentStep}
              totalSteps={STEP3_CONFIG.totalSteps}
              title={
                <>
                  예약한 항공편 정보를
                  <br />
                  입력하세요
                </>
              }
              subtitle={STEP3_SUBTITLE_DESKTOP}
              className="mb-8"
              subtitleClassName="text-sm"
            />

            <div className="flex-1 space-y-4">
              {FLIGHT_SECTIONS.map((section) => (
                <DesktopFlightCard key={section.id} {...cardProps(section)} />
              ))}
            </div>

            <div className="mt-6">
              <TripFlowNextStepButton variant="teal" disabled={!isValid} onClick={goToStep4} />
            </div>
          </>
        }
        right={
          <div className="pointer-events-auto absolute bottom-8 left-8 right-8 z-30">
            <AiConciergeTip
              description={AI_TIP.description}
            />
          </div>
        }
      />

      {/* ══════════════════════════════════
          모바일 레이아웃 (md 미만)
      ══════════════════════════════════ */}
      <div className="md:hidden">

        <TripFlowMobileBar backTo="/trips/new/step2" />

        <div className="px-5 pt-4 pb-44">

          <StepHeader
            currentStep={STEP3_CONFIG.currentStep}
            totalSteps={STEP3_CONFIG.totalSteps}
            title={<>예약한 항공편 정보를<br />입력하세요</>}
            subtitle={STEP3_SUBTITLE_MOBILE}
            className="mb-6"
            titleClassName="text-2xl"
            subtitleClassName="text-sm"
          />

          {/* 항공편 입력 카드 목록 */}
          <div className="space-y-4 mb-5">
            {FLIGHT_SECTIONS.map((section) => (
              <MobileFlightCard key={section.id} {...cardProps(section)} />
            ))}
          </div>

          {/* AI 팁 카드 */}
          <div className="bg-white rounded-2xl p-4 mb-5 flex items-start gap-3 shadow-sm">
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
        </div>

        {/* 모바일 하단 고정 CTA — 바텀 네비 위에만 띄움. 흰색 그라데이션 없음(스크롤 영역과 색 이음) */}
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-transparent px-5 pb-3 pt-3 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          <TripFlowNextStepButton variant="teal" disabled={!isValid} onClick={goToStep4} />
        </div>
      </div>
    </div>
  )
}

export default TripNewStep3Page
