import { useState } from 'react'

function SvgIcon({ name, className = 'w-5 h-5' }) {
  const paths = {
    cloud:
      'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
    map:
      'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z',
    warning:
      'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    chevron: 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z',
  }
  const d = paths[name]
  if (!d) return null
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d={d} />
    </svg>
  )
}

/**
 * 저장된 가이드 스냅샷을 읽기 전용으로 표시합니다.
 */
export default function GuideSnapshotView({ entry }) {
  const [openDayId, setOpenDayId] = useState(entry.dailyGuidesFull?.[0]?.id ?? entry.dailySummaries?.[0]?.id ?? null)

  const dailyList =
    entry.dailyGuidesFull?.length > 0
      ? entry.dailyGuidesFull
      : (entry.dailySummaries ?? []).map((d) => ({
          ...d,
          environment: [],
          essentials: [],
          cautions: [],
        }))

  const envTags = entry.environmentTags ?? []
  const phaseHints = entry.phaseHints ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="mb-8">
        <p className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-1">저장된 맞춤 여행 체크리스트</p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">{entry.pageTitle}</h1>
        {entry.pageSubtitle ? (
          <p className="mt-2 text-sm text-gray-600 max-w-2xl leading-relaxed">{entry.pageSubtitle}</p>
        ) : null}
      </div>

      <div className="rounded-3xl bg-white/90 border border-teal-100 shadow-sm p-6 md:p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 text-cyan-800 text-xs font-bold px-3 py-1">
                <SvgIcon name="map" className="w-3.5 h-3.5" />
                {entry.destination}
              </span>
              <span className="text-xs text-gray-500">{entry.country}</span>
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-2">{entry.tripWindowLabel}</p>
            <div className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed mb-4">
              <SvgIcon name="cloud" className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">날씨 요약</p>
                <p>{entry.weatherSummary}</p>
                {(entry.temperatureRange || entry.rainChance) && (
                  <p className="mt-2 text-xs text-gray-500">
                    {entry.temperatureRange ? <>기온 {entry.temperatureRange}</> : null}
                    {entry.temperatureRange && entry.rainChance ? ' · ' : null}
                    {entry.rainChance || ''}
                  </p>
                )}
              </div>
            </div>
            {envTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {envTags.map((t) => (
                  <span
                    key={t.id}
                    className="text-xs font-semibold bg-teal-50 text-teal-900 border border-teal-100 rounded-xl px-3 py-1.5"
                  >
                    {t.label}
                    <span className="font-normal text-teal-700/90"> — {t.detail}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
          {phaseHints.length > 0 && (
            <div className="lg:w-80 space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">여행 단계별 팁</p>
              <ul className="space-y-2">
                {phaseHints.map((p) => (
                  <li key={p.phase} className="text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                    <span className="font-bold text-gray-800">{p.phase}</span> — {p.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {dailyList.length > 0 && (
      <section className="mb-10">
        <h2 className="text-lg font-extrabold text-gray-900 mb-1 flex items-center gap-2">
          <SvgIcon name="warning" className="w-5 h-5 text-amber-500" />
          날짜 · 지역별 맞춤 필수품 & 주의사항
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          저장 시점 기준으로, 비행기 탑승 전부터 귀국 전까지 구간별 안내입니다.
        </p>
        <div className="space-y-3">
          {dailyList.map((day) => {
            const open = openDayId === day.id
            const hasDetail = (day.essentials?.length ?? 0) > 0 || (day.cautions?.length ?? 0) > 0
            return (
              <div
                key={day.id}
                className="rounded-2xl border border-gray-200/80 bg-white/95 shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenDayId(open ? null : day.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50/80 transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-teal-600">{day.dateLabel}</p>
                    <p className="text-sm font-bold text-gray-900">{day.region}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{day.weatherLine}</p>
                  </div>
                  <span className={`text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}>
                    <SvgIcon name="chevron" className="w-5 h-5" />
                  </span>
                </button>
                {open && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100 space-y-4">
                    {day.environment?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-3">
                        {day.environment.map((e) => (
                          <span
                            key={e}
                            className="text-[11px] font-semibold bg-slate-100 text-slate-700 rounded-full px-2 py-0.5"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    )}
                    {!hasDetail && (
                      <p className="text-sm text-gray-500 pt-2">
                        이 저장본에는 일정 상세(챙길 것·주의사항)가 포함되지 않았습니다. 최신 가이드를 다시 저장해 보세요.
                      </p>
                    )}
                    {hasDetail && (
                      <>
                        <div>
                          <p className="text-xs font-bold text-gray-700 mb-1.5">이날 챙기면 좋은 것</p>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                            {(day.essentials ?? []).map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-amber-800 mb-1.5 flex items-center gap-1">
                            <SvgIcon name="warning" className="w-3.5 h-3.5" />
                            주의사항
                          </p>
                          <ul className="space-y-1.5">
                            {(day.cautions ?? []).map((line) => (
                              <li
                                key={line}
                                className="text-sm text-gray-700 bg-amber-50/80 border border-amber-100 rounded-xl px-3 py-2 leading-snug"
                              >
                                {line}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">카테고리별 필수품</h2>
        <p className="text-sm text-gray-500 mb-4">저장 시점에 안내된 필수품 목록입니다.</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(entry.items ?? []).map((it) => (
            <div
              key={it.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <span className="text-[11px] rounded-full bg-gray-100 text-gray-700 px-2.5 py-0.5 font-bold">
                {it.categoryLabel}
              </span>
              <p className="text-sm font-bold text-gray-900 mt-2">{it.title}</p>
              {it.description && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{it.description}</p>}
              {it.detail && (
                <p className="text-xs text-gray-500 mt-2 leading-relaxed border-l-2 border-teal-200 pl-2">{it.detail}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
