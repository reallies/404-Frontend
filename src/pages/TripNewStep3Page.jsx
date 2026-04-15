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
import BackButton from '@/components/common/BackButton'
import AiPlannerFab from '@/components/common/AiPlannerFab'
import AiConciergeTip from '@/components/common/AiConciergeTip'

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
      <div className="hidden md:flex min-h-screen">

        {/* 왼쪽 입력 패널 */}
        <div className="flex flex-col w-[500px] flex-shrink-0 px-12 py-10">

          <div className="flex justify-end mb-6">
            <BackButton to="/trips/new/step2" />
          </div>

          <StepHeader
            currentStep={STEP3_CONFIG.currentStep}
            totalSteps={STEP3_CONFIG.totalSteps}
            title="예약한 항공편 정보를 
          입력하세요"
            subtitle={
              <>
                편명을 입력하고 <strong className="text-teal-600">조회</strong> 버튼을 눌러주세요.<br />
                AI가 비행 일정에 맞춰 최적의 여행 계획을 제안합니다.
              </>
            }
            className="mb-8"
          />

          {/* 항공편 입력 카드 목록 */}
          <div className="space-y-4 flex-1">
            {FLIGHT_SECTIONS.map((section) => (
              <DesktopFlightCard key={section.id} {...cardProps(section)} />
            ))}
          </div>

          {/* 안내 문구 */}
          <p className="mt-4 text-xs text-gray-400 text-center">
            예: KE101, VN401, KE801, OZ851 — 편명을 조회하면 입국 국가·공항이 Step4에 반영됩니다.
          </p>

          {/* 다음 버튼 */}
          <div className="flex justify-end mt-5">
            <button
              onClick={() => navigate('/trips/new/step4', {
                state: { destination: flightInfo.departure?.arrival || null }
              })}
              className="flex items-center gap-2 font-bold text-base py-4 px-8 rounded-2xl transition-all bg-teal-700 hover:bg-teal-800 text-white shadow-sm hover:shadow-md cursor-pointer"
            >
              다음 단계로 이동
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
            </button>
          </div>
        </div>

        {/* 오른쪽 이미지 패널 */}
        <div className="flex-1 relative overflow-hidden">
          <img
            src={HERO_IMAGE}
            alt="비행기 창문"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/70" />

          {/* 하단 AI 컨시어지 팁 */}
          <div className="absolute bottom-8 left-8 right-8">
            <AiConciergeTip
              title={AI_TIP.title}
              description={AI_TIP.description}
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          모바일 레이아웃 (md 미만)
      ══════════════════════════════════ */}
      <div className="md:hidden">

        {/* 모바일 상단 바 */}
        <div className="flex items-center justify-between px-5 py-4 bg-white/80">
          <span className="font-bold text-gray-900">Travel Plans</span>
          <BackButton to="/trips/new/step2" />
        </div>

        <div className="px-5 pt-4 pb-36">

          <StepHeader
            currentStep={STEP3_CONFIG.currentStep}
            totalSteps={STEP3_CONFIG.totalSteps}
            title={<>예약한 항공편 정보를<br />입력하세요</>}
            subtitle="편명을 입력하고 조회 버튼을 눌러주세요."
            className="mb-6"
          />

          {/* 항공편 입력 카드 목록 */}
          <div className="space-y-4 mb-5">
            {FLIGHT_SECTIONS.map((section) => (
              <MobileFlightCard key={section.id} {...cardProps(section)} />
            ))}
          </div>

          {/* AI 팁 카드 */}
          <div className="bg-white rounded-2xl p-4 mb-5 flex items-start gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <SvgIcon name="sparkle" className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{MOBILE_TIP}</p>
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

        {/* 모바일 하단 고정 CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-6 pt-3 bg-gradient-to-t from-white/95 to-transparent">
          <button
            onClick={() => navigate('/trips/new/step4', {
              state: { destination: flightInfo.departure?.arrival || null }
            })}
            className="w-full flex items-center justify-center gap-2 font-bold text-base py-4 rounded-2xl transition-all bg-teal-700 hover:bg-teal-800 text-white shadow-sm cursor-pointer"
          >
            다음 단계로 이동
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
          </button>
        </div>
      </div>

      <AiPlannerFab />
    </div>
  )
}

export default TripNewStep3Page
