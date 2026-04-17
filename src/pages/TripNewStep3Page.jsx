import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  STEP3_CONFIG,
  STEP3_ICON_PATHS,
  FLIGHT_SECTIONS,
  HERO_IMAGE,
  PREVIEW_IMAGE,
  AI_TIP,
  MOBILE_TIP,
} from '@/mocks/tripNewStep3Data'
import { fetchFlightInfo } from '@/mocks/flightMockData'
import StepHeader from '@/components/common/StepHeader'
import { TripFlowDesktopBar, TripFlowMobileBar } from '@/components/common/TripFlowTopBar'
import AiConciergeTip, { AiConciergeTipHeading, AiConciergeTipIcon } from '@/components/common/AiConciergeTip'
import TripStepDesktopSplit from '@/components/trip/TripStepDesktopSplit'
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

/** Step3 헤더 부제 — 고객용: 항공 일정이 왜 필요한지, 무엇을 입력하면 되는지 */
const STEP3_SUBTITLE_DESKTOP = (
  <>
    <p className="text-gray-600">
      맞춤 여행 준비를 도와드리려면, 먼저 <strong className="text-teal-700">예약하신 항공 일정</strong>이 필요해요. 가는편과
      오는편 각각 <strong className="text-teal-700">탑승 날짜</strong>와 <strong className="text-teal-700">편명</strong>을
      입력해 주세요. 확인된 노선 정보를 바탕으로 이후 여행 일정과 방문 지역 안내를 이어갑니다.
    </p>
    <p className="text-sm text-gray-500">
      편명을 입력한 뒤 <strong className="text-teal-600">조회</strong>를 눌러 출발·도착 공항이 맞는지 확인할 수 있어요. 가는편과
      오는편을 모두 확인하시면 다음 단계로 넘어갈 수 있습니다. 안내가 나오면 항공권이나 예약 확인서에 적힌 편명을 다시 한 번
      확인해 주세요.
    </p>
    <p className="mt-2 text-center text-sm font-medium leading-relaxed text-slate-700">
      예: KE101, VN401, KE801, OZ851 — 편명을 조회하면 입국 국가·공항이 Step4에 반영됩니다.
    </p>
  </>
)

const STEP3_SUBTITLE_MOBILE = (
  <>
    <p className="text-sm text-gray-600">
      예약하신 항공 일정이 있어야 준비를 이어갈 수 있어요. 가는편·오는편 <strong className="text-teal-700">날짜</strong>와{' '}
      <strong className="text-teal-700">편명</strong>을 입력하고 조회해 주세요.
    </p>
    <p className="text-xs text-gray-500">
      양쪽 모두 확인되면 다음 단계로 이동합니다. 편명은 예약 확인서와 동일하게 입력해 주세요.
    </p>
    <p className="mt-2 text-center text-xs font-medium leading-relaxed text-slate-700">
      예: KE101, VN401, KE801, OZ851 — 편명을 조회하면 입국 국가·공항이 Step4에 반영됩니다.
    </p>
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
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-teal-700">
          <SvgIcon name={section.icon} className="w-5 h-5" />
        </div>
        <span className="font-bold text-gray-900 text-base">{section.label}</span>
        {flightResult && (
          <span className="ml-auto text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
            조회 완료
          </span>
        )}
      </div>

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
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center text-teal-700">
          <SvgIcon name={section.icon} className="w-4 h-4" />
        </div>
        <span className="font-bold text-gray-900 text-sm">{section.label}</span>
        {flightResult && (
          <span className="ml-auto text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
            조회 완료
          </span>
        )}
      </div>

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

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                disabled={!isValid}
                onClick={() => {
                  const navState = { destination: flightInfo.departure?.arrival || null }
                  saveStep4NavigationState(navState)
                  navigate('/trips/new/step4', { state: navState })
                }}
                className={`flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold shadow-sm transition-all ${
                  isValid
                    ? 'cursor-pointer bg-teal-700 text-white hover:bg-teal-800 hover:shadow-md'
                    : 'cursor-not-allowed bg-gray-200 text-gray-400'
                }`}
              >
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

          {/* Flight Preview 이미지 */}
          <div className="relative rounded-2xl overflow-hidden h-44">
            <img
              src={PREVIEW_IMAGE}
              alt="기내 미리보기"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-5">
              <p className="text-[10px] font-bold text-white/70 tracking-widest uppercase mb-0.5">
                FLIGHT PREVIEW
              </p>
              <p className="text-xs text-white/90">Journey to your destination begins here.</p>
            </div>
          </div>
        </div>

        {/* 모바일 하단 고정 CTA — 바텀 네비 위에만 띄움. 흰색 그라데이션 없음(스크롤 영역과 색 이음) */}
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-transparent px-5 pb-3 pt-3 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            disabled={!isValid}
            onClick={() => {
              const navState = { destination: flightInfo.departure?.arrival || null }
              saveStep4NavigationState(navState)
              navigate('/trips/new/step4', { state: navState })
            }}
            className={`w-full flex items-center justify-center gap-2 font-bold text-base py-4 rounded-2xl transition-all shadow-sm ${
              isValid
                ? 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
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
    </div>
  )
}

export default TripNewStep3Page
