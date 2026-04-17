import { useMemo } from 'react'

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

function parseYmd(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function ymd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

/** start ≤ end 인 YYYY-MM-DD 구간의 밤·일 (한국식: n박 n+1일) */
export function formatTripNightsDaysLabel(startStr, endStr) {
  const a = parseYmd(startStr)
  const b = parseYmd(endStr)
  if (!a || !b || b < a) return null
  const nights = Math.round((b - a) / 86400000)
  const days = nights + 1
  return `${nights}박 ${days}일`
}

function monthGrid(year, monthIndex) {
  const firstDow = new Date(year, monthIndex, 1).getDay()
  const dim = daysInMonth(year, monthIndex)
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= dim; d++) cells.push(d)
  const rows = []
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7))
  }
  return rows
}

/**
 * 모바일 목적지 페이지용 — 스크롤 가능한 다월 달력, 기간(시작·종료) 선택
 */
export default function DestinationMobileRangeCalendar({
  startDate,
  endDate,
  todayYmd,
  minDateYmd,
  disabled,
  onChangeRange,
}) {
  const months = useMemo(() => {
    const start = parseYmd(minDateYmd) || new Date()
    const y = start.getFullYear()
    const m = start.getMonth()
    const list = []
    for (let i = 0; i < 14; i++) {
      const mi = m + i
      const yy = y + Math.floor(mi / 12)
      const mm = ((mi % 12) + 12) % 12
      list.push({ year: yy, monthIndex: mm, key: `${yy}-${mm}` })
    }
    return list
  }, [minDateYmd])

  const start = parseYmd(startDate)
  const end = parseYmd(endDate)
  const minD = parseYmd(minDateYmd)

  const handleDayClick = (year, monthIndex, day) => {
    if (disabled) return
    const cell = new Date(year, monthIndex, day)
    const s = ymd(cell)
    if (minD && cell < minD) return

    if (!startDate || (startDate && endDate)) {
      onChangeRange({ start: s, end: '' })
      return
    }
    if (!endDate) {
      const a = parseYmd(startDate)
      const b = cell
      if (b < a) {
        onChangeRange({ start: s, end: startDate })
      } else if (+b === +a) {
        onChangeRange({ start: s, end: s })
      } else {
        onChangeRange({ start: startDate, end: s })
      }
    }
  }

  const inRange = (year, monthIndex, day) => {
    if (!start || !end) return false
    const t = new Date(year, monthIndex, day)
    return t > start && t < end
  }

  const isStart = (year, monthIndex, day) => {
    if (!startDate) return false
    const [ys, ms, ds] = startDate.split('-').map(Number)
    return ys === year && ms - 1 === monthIndex && ds === day
  }

  const isEnd = (year, monthIndex, day) => {
    if (!endDate) return false
    const [ye, me, de] = endDate.split('-').map(Number)
    return ye === year && me - 1 === monthIndex && de === day
  }

  const isDisabledDay = (year, monthIndex, day) => {
    const t = new Date(year, monthIndex, day)
    if (minD && t < minD) return true
    return false
  }

  return (
    <div
      className={`max-h-[min(52vh,420px)] overflow-y-auto overscroll-contain px-1 pb-2 pt-1 ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      {months.map(({ year, monthIndex, key }) => (
        <div key={key} className="mb-6 last:mb-2">
          <p className="mb-3 text-center text-sm font-bold text-gray-800">
            {year}년 {monthIndex + 1}월
          </p>
          <div className="mb-2 grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-gray-400">
            {WEEKDAYS_KO.map((w) => (
              <span key={w} className="py-1">
                {w}
              </span>
            ))}
          </div>
          <div className="space-y-0.5">
            {monthGrid(year, monthIndex).map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 gap-0.5">
                {row.map((day, ci) => {
                  if (day == null) {
                    return <div key={`e-${ci}`} className="aspect-square min-h-[2.25rem]" />
                  }
                  const dis = isDisabledDay(year, monthIndex, day)
                  const selStart = isStart(year, monthIndex, day)
                  const selEnd = isEnd(year, monthIndex, day)
                  const range = inRange(year, monthIndex, day)
                  const isToday =
                    ymd(new Date(year, monthIndex, day)) === todayYmd && !dis

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={dis}
                      onClick={() => handleDayClick(year, monthIndex, day)}
                      className={`relative flex min-h-[2.25rem] items-center justify-center text-sm font-medium transition-colors ${
                        dis
                          ? 'cursor-not-allowed text-gray-300'
                          : 'text-gray-800 active:scale-[0.97]'
                      }`}
                    >
                      {range && (
                        <span className="absolute inset-y-1 left-0 right-0 bg-sky-200/70" aria-hidden />
                      )}
                      <span
                        className={`relative z-[1] flex h-9 w-9 items-center justify-center rounded-full ${
                          selStart || selEnd
                            ? 'bg-sky-500 font-bold text-white shadow-sm'
                            : range
                              ? 'bg-transparent'
                              : isToday
                                ? 'ring-1 ring-sky-400'
                                : ''
                        }`}
                      >
                        {day}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
