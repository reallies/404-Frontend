import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  STEP_CONFIG,
  WEEKDAYS,
  PERSON_TYPES,
  TRIPNEW_ICON_PATHS,
  GALLERY_IMAGES,
} from '@/mocks/tripNewData'
import StepHeader from '@/components/common/StepHeader'
import AiPlannerFab from '@/components/common/AiPlannerFab'
import BackButton from '@/components/common/BackButton'

/* ─────────────────────────────────────────────
   범용 SVG 아이콘
───────────────────────────────────────────── */
function SvgIcon({ name, className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d={TRIPNEW_ICON_PATHS[name]} />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   캘린더 유틸
───────────────────────────────────────────── */
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay()
}

/* ─────────────────────────────────────────────
   캘린더 그리드 (데스크탑·모바일 공용)
───────────────────────────────────────────── */
function CalendarGrid({ cells, compact, rangeStart, rangeEnd, onDateClick, viewYear, viewMonth, todayYear, todayMonth, todayDay }) {
  const isPastDay = (day) => {
    if (viewYear < todayYear) return true
    if (viewYear === todayYear && viewMonth < todayMonth) return true
    if (viewYear === todayYear && viewMonth === todayMonth && day <= todayDay) return true
    return false
  }

  const getDateClass = (cell) => {
    if (cell.type !== 'current') return 'text-gray-300 cursor-default'
    const d = cell.day
    if (isPastDay(d)) return 'text-gray-300 cursor-not-allowed'

    const isStart = d === rangeStart
    const isEnd = d === rangeEnd
    const inRange = rangeStart && rangeEnd && d > rangeStart && d < rangeEnd

    if (isStart && isEnd) return 'bg-teal-700 text-white rounded-full'
    if (isStart) return `bg-cyan-400 text-white ${rangeEnd ? 'rounded-l-full' : 'rounded-full'}`
    if (isEnd) return 'bg-teal-700 text-white rounded-r-full'
    if (inRange) return 'bg-cyan-100 text-gray-800'
    return 'text-gray-700 hover:bg-gray-100 rounded-full'
  }

  return (
    <>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className={`text-center font-semibold text-gray-400 ${compact ? 'text-[10px] py-1' : 'text-xs py-2'}`}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, idx) => {
          const disabled = cell.type !== 'current' || isPastDay(cell.day)
          return (
            <button
              key={idx}
              onClick={() => !disabled && onDateClick(cell.day)}
              disabled={disabled}
              className={`${compact ? 'py-2' : 'py-3'} text-sm font-medium text-center transition-colors ${getDateClass(cell)}`}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────
   인원 카운터 버튼 (+ / −)
───────────────────────────────────────────── */
function CounterButton({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-9 h-9 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-lg hover:bg-cyan-100 transition disabled:opacity-30"
    >
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────────
   메인 컴포넌트
───────────────────────────────────────────── */
function TripNewPage() {
  const navigate = useNavigate()
  const now = new Date()
  const todayYear = now.getFullYear()
  const todayMonth = now.getMonth()
  const todayDay = now.getDate()

  const [viewYear, setViewYear] = useState(todayYear)
  const [viewMonth, setViewMonth] = useState(todayMonth)
  const [rangeStart, setRangeStart] = useState(null)
  const [rangeEnd, setRangeEnd] = useState(null)
  const [persons, setPersons] = useState({ adults: 0, teens: 0, children: 0 })

  const totalPersons = persons.adults + persons.teens + persons.children
  const isValid = rangeStart !== null && rangeEnd !== null && totalPersons >= 1

  /* ── 캘린더 셀 생성 ── */
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth)
  const prevMonthDays = getDaysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1,
  )

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: prevMonthDays - firstDay + i + 1, type: 'prev' })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, type: 'current' })
  const remainder = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= remainder; i++) cells.push({ day: i, type: 'next' })

  /* ── 월 이동 (날짜 선택 초기화 포함) ── */
  const goPrevMonth = () => {
    setRangeStart(null)
    setRangeEnd(null)
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  const goNextMonth = () => {
    setRangeStart(null)
    setRangeEnd(null)
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  /* ── 날짜 범위 선택 ── */
  const handleDateClick = (day) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(day)
      setRangeEnd(null)
    } else if (day === rangeStart) {
      setRangeStart(null)
    } else if (day < rangeStart) {
      setRangeEnd(rangeStart)
      setRangeStart(day)
    } else {
      setRangeEnd(day)
    }
  }

  /* ── 인원 수 변경 ── */
  const updateCount = (id, delta) => {
    setPersons((prev) => ({
      ...prev,
      [id]: Math.max(0, prev[id] + delta),
    }))
  }

  const handleNext = () => { if (isValid) navigate('/trips/new/step2') }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #E0F7FA 0%, #F0FDFA 100%)' }}
    >

      {/* ══════════════════════════════════
          데스크탑 레이아웃 (md 이상)
      ══════════════════════════════════ */}
      <div className="hidden md:block mx-auto max-w-5xl px-6 py-10">

        {/* 뒤로가기 버튼 */}
        <div className="flex justify-end mb-4">
          <BackButton to="/" />
        </div>

        <StepHeader
          currentStep={STEP_CONFIG.currentStep}
          totalSteps={STEP_CONFIG.totalSteps}
          title="언제, 몇 명이서 떠나시나요?"
          className="mb-8"
        />

        {/* 캘린더 + 인원 선택 */}
        <div className="grid grid-cols-5 gap-6 mb-8">

          {/* 캘린더 카드 */}
          <div className="col-span-3 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <SvgIcon name="calendar" className="w-5 h-5 text-gray-600" />
                <span className="font-bold text-gray-900">여행 일정 선택</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-600 min-w-[80px] text-center">
                  {viewYear}년 {viewMonth + 1}월
                </span>
                <button onClick={goPrevMonth} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition">
                  <SvgIcon name="chevronLeft" className="w-5 h-5 text-gray-500" />
                </button>
                <button onClick={goNextMonth} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition">
                  <SvgIcon name="chevronRight" className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <CalendarGrid
              cells={cells}
              compact={false}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onDateClick={handleDateClick}
              viewYear={viewYear}
              viewMonth={viewMonth}
              todayYear={todayYear}
              todayMonth={todayMonth}
              todayDay={todayDay}
            />
          </div>

          {/* 인원 선택 카드 */}
          <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <SvgIcon name="people" className="w-5 h-5 text-gray-600" />
              <span className="font-bold text-gray-900">인원 선택</span>
            </div>
            <div className="space-y-6">
              {PERSON_TYPES.map((type) => (
                <div key={type.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{type.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{type.sub}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CounterButton
                      onClick={() => updateCount(type.id, -1)}
                      disabled={persons[type.id] <= 0}
                    >
                      −
                    </CounterButton>
                    <span className="w-6 text-center font-bold text-gray-900 text-lg tabular-nums">
                      {persons[type.id]}
                    </span>
                    <CounterButton onClick={() => updateCount(type.id, 1)}>
                      +
                    </CounterButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA 버튼 */}
        <button
          onClick={handleNext}
          disabled={!isValid}
          className={`w-full font-bold text-base py-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm mb-10 ${
            isValid
              ? 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          다음 단계로 이동
          <SvgIcon name="arrowRight" className="w-5 h-5" />
        </button>

        {/* 하단 갤러리 */}
        <div className="grid grid-cols-3 gap-4">
          {GALLERY_IMAGES.map((src, idx) => (
            <div key={idx} className="relative rounded-2xl overflow-hidden aspect-[4/3]">
              <img
                src={src}
                alt={`여행 이미지 ${idx + 1}`}
                className="w-full h-full object-cover grayscale-[80%] opacity-70"
                loading="lazy"
              />
              {idx === 2 && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/40 rounded-full -translate-y-1/3 translate-x-1/3" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════
          모바일 레이아웃 (md 미만)
      ══════════════════════════════════ */}
      <div className="md:hidden">

        {/* 모바일 상단 바 */}
        <div className="flex items-center justify-between px-5 py-4 bg-white/80">
          <span className="font-bold text-gray-900">Travel Plans</span>
          <BackButton to="/" />
        </div>

        <div className="px-5 pt-4 pb-32">

          <StepHeader
            currentStep={STEP_CONFIG.currentStep}
            totalSteps={STEP_CONFIG.totalSteps}
            title={<>언제, 몇 명이서<br />떠나시나요?</>}
            className="mb-6"
          />

          {/* 날짜 선택 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-gray-900 text-sm">날짜 선택</span>
              <div className="flex items-center gap-1">
                <button onClick={goPrevMonth} className="p-1" aria-label="이전 달">
                  <SvgIcon name="chevronLeft" className="w-5 h-5 text-gray-500" />
                </button>
                <span className="text-sm font-semibold text-gray-700 min-w-[90px] text-center">
                  {viewYear}년 {viewMonth + 1}월
                </span>
                <button onClick={goNextMonth} className="p-1" aria-label="다음 달">
                  <SvgIcon name="chevronRight" className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <CalendarGrid
                cells={cells}
                compact
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onDateClick={handleDateClick}
                viewYear={viewYear}
                viewMonth={viewMonth}
                todayYear={todayYear}
                todayMonth={todayMonth}
                todayDay={todayDay}
              />
            </div>
          </div>

          {/* 인원 선택 */}
          <div className="mb-6">
            <p className="font-bold text-gray-900 text-sm mb-3">인원 선택</p>
            <div className="space-y-3">
              {PERSON_TYPES.map((type) => (
                <div key={type.id} className="bg-white rounded-2xl px-4 py-3.5 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center">
                      <SvgIcon name={type.iconName} className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{type.label}</p>
                      <p className="text-xs text-gray-400">{type.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CounterButton
                      onClick={() => updateCount(type.id, -1)}
                      disabled={persons[type.id] <= 0}
                    >
                      −
                    </CounterButton>
                    <span className="w-5 text-center font-bold text-gray-900 text-lg tabular-nums">
                      {persons[type.id]}
                    </span>
                    <CounterButton onClick={() => updateCount(type.id, 1)}>
                      +
                    </CounterButton>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 프리미엄 일정 카드 */}
          <div
            className="rounded-2xl p-5 mb-6 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0F766E 0%, #134E4A 100%)' }}
          >
            <div className="absolute top-3 right-4 text-amber-300 opacity-80">
              <SvgIcon name="sparkle" className="w-10 h-10" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">프리미엄 일정 관리</h3>
            <p className="text-teal-200 text-sm leading-relaxed pr-10">
              AI가 실시간으로 분석하여 당신만을 위한 최적의 동선을 제안합니다.
            </p>
          </div>

          {/* CTA 버튼 */}
          <button
            onClick={handleNext}
            disabled={!isValid}
            className={`w-full font-bold text-base py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm ${
              isValid
                ? 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            다음 단계로 이동
            <SvgIcon name="arrowRight" className="w-5 h-5" />
          </button>
        </div>
      </div>
      {/* AI 플래너 FAB (화면 고정) */}
      <AiPlannerFab />
    </div>
  )
}

export default TripNewPage
