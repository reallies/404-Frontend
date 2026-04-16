import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { loadGuideArchive, clearGuideArchive } from '@/utils/guideArchiveStorage'

function TripGuideArchiveInner({ tripId }) {
  const [entries, setEntries] = useState(() => loadGuideArchive(tripId))

  useEffect(() => {
    setEntries(loadGuideArchive(tripId))
  }, [tripId])

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString('ko-KR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return iso
    }
  }

  const handleClearAll = () => {
    if (entries.length === 0) return
    if (!window.confirm('저장된 가이드 목록을 모두 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return
    clearGuideArchive(tripId)
    setEntries([])
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #E0F7FA 0%, #F8FAFC 55%, #F1F5F9 100%)' }}
    >
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <Link
          to="/"
          className="text-sm text-teal-700 hover:text-teal-900 mb-4 inline-flex items-center gap-1 font-medium"
        >
          홈으로
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">여행 정보 Ckeck리스트</h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              저장한 항목을 누르면 그 시점의 <strong className="text-gray-800">맞춤 여행 준비 가이드</strong> 전체를 다시 볼 수
              있습니다.
            </p>
          </div>
          {entries.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="shrink-0 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 transition-colors"
            >
              목록 전체 삭제
            </button>
          )}
        </div>

        {!entries.length ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 px-6 py-16 text-center">
            <p className="text-gray-500 text-sm mb-4">아직 저장된 가이드가 없습니다.</p>
            <Link
              to="/trips/new/step2"
              className="inline-block rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold px-6 py-3"
            >
              여행 정보 캐러 가기
            </Link>
          </div>
        ) : (
          <ul className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Link
                  to={`/trips/${tripId}/guide-archive/${entry.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-teal-50/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-teal-600 mb-0.5">{formatDate(entry.savedAt)}</p>
                    <p className="text-base font-extrabold text-gray-900 truncate">
                      {entry.pageTitle || entry.destination}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {entry.destination} · {entry.tripWindowLabel}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      필수품 {entry.items?.length ?? 0}개 · 일정{' '}
                      {entry.dailySummaries?.length ?? entry.dailyGuidesFull?.length ?? 0}구간
                    </p>
                  </div>
                  <span className="text-teal-700 font-bold text-sm flex-shrink-0">보기 →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function TripGuideArchivePage() {
  const { id } = useParams()
  const location = useLocation()
  return <TripGuideArchiveInner key={`${id}-${location.key}`} tripId={id} />
}
