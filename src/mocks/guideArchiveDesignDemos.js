import { MOCK_ITEMS, TRIP_SEARCH_CONTEXT } from '@/mocks/searchData'
import { loadGuideArchive, saveGuideArchiveList } from '@/utils/guideArchiveStorage'
import { loadSavedItems, replaceSavedItemsList } from '@/utils/savedTripItems'

const DEMO_PREFIX = 'demo-design-'
const ID_0 = `${DEMO_PREFIX}0`
const ID_50 = `${DEMO_PREFIX}50`
const ID_100 = `${DEMO_PREFIX}100`

/** 예시 진행률에 쓰는 MOCK id 12개 (0%·50%·100% 각 4개, 저장소에서 함께 제거) */
export function getDemoDesignMockItemIds() {
  return new Set(
    [...MOCK_ITEMS.slice(0, 4), ...MOCK_ITEMS.slice(4, 8), ...MOCK_ITEMS.slice(8, 12)].map((i) =>
      String(i.id),
    ),
  )
}

export function hasGuideArchiveDesignDemos(tripId) {
  return loadGuideArchive(tripId).some((e) => String(e.id).startsWith(DEMO_PREFIX))
}

/** /trips/:id/search 에서 저장한 「다낭 · 호이안… · 베트남」 스냅샷 (예시 제외) */
function isTripSearchDaNangArchiveEntry(entry) {
  const d = String(entry.destination ?? '').trim()
  const c = String(entry.country ?? '').trim()
  return d === TRIP_SEARCH_CONTEXT.destination.trim() && c === TRIP_SEARCH_CONTEXT.country.trim()
}

/** 검색 목록 전체 id — 예시 불러오기 시 체크리스트 저장분을 비워 진행도 0으로 맞춤 */
function getAllSearchMockItemIds() {
  return new Set(MOCK_ITEMS.map((i) => String(i.id)))
}

function toArchiveItem(i) {
  return {
    id: i.id,
    category: i.category,
    categoryLabel: i.categoryLabel,
    title: i.title,
    description: i.description,
    detail: i.detail,
  }
}

function toSavedRow(item, checked) {
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    subtitle: item.detail || item.description || '',
    checked,
    savedAt: new Date().toISOString(),
  }
}

function baseSnapshot() {
  return {
    pageSubtitle: '',
    tripWindowLabel: TRIP_SEARCH_CONTEXT.tripWindowLabel,
    weatherSummary: TRIP_SEARCH_CONTEXT.weatherSummary,
    temperatureRange: TRIP_SEARCH_CONTEXT.temperatureRange,
    rainChance: TRIP_SEARCH_CONTEXT.rainChance,
    environmentTags: TRIP_SEARCH_CONTEXT.environmentTags.map((t) => ({ ...t })),
    phaseHints: TRIP_SEARCH_CONTEXT.phaseHints.map((p) => ({ ...p })),
    dailySummaries: [],
    dailyGuidesFull: [],
  }
}

/**
 * 0%·50%·100% 예시를 넣기 전에:
 * - 검색(/search)에서 저장한 「다낭 · 호이안… · 베트남」 비예시 보관함 항목 제거
 * - 해당 여행 MOCK 전체 id의 체크리스트 저장분 제거 → 진행도 0
 * 이후 예시 스냅샷 3개와 데모용 체크만 남깁니다.
 */
export function seedGuideArchiveDesignDemos(tripId) {
  const items0 = MOCK_ITEMS.slice(8, 12)
  const items50 = MOCK_ITEMS.slice(0, 4)
  const items100 = MOCK_ITEMS.slice(4, 8)
  if (items0.length < 4 || items50.length < 4 || items100.length < 4) return

  const archive = loadGuideArchive(tripId).filter((e) => {
    if (String(e.id).startsWith(DEMO_PREFIX)) return false
    if (isTripSearchDaNangArchiveEntry(e)) return false
    return true
  })

  const now = new Date().toISOString()
  const entry0 = {
    ...baseSnapshot(),
    id: ID_0,
    savedAt: now,
    pageTitle: '[예시] 0% · 미작성',
    destination: '산토리니, 그리스',
    country: '디자인 미리보기',
    items: items0.map(toArchiveItem),
  }
  const entry50 = {
    ...baseSnapshot(),
    id: ID_50,
    savedAt: now,
    pageTitle: '[예시] 50% · 작성중',
    destination: '파리, 프랑스',
    country: '디자인 미리보기',
    items: items50.map(toArchiveItem),
  }
  const entry100 = {
    ...baseSnapshot(),
    id: ID_100,
    savedAt: now,
    pageTitle: '[예시] 100% · 완료',
    destination: '교토, 일본',
    country: '디자인 미리보기',
    items: items100.map(toArchiveItem),
  }

  saveGuideArchiveList(tripId, [entry0, entry50, entry100, ...archive])

  const demoIds = new Set([...items0, ...items50, ...items100].map((i) => String(i.id)))
  const allSearchMockIds = getAllSearchMockItemIds()

  const savedRest = loadSavedItems(tripId).filter((s) => {
    const id = String(s.id)
    if (demoIds.has(id)) return false
    if (allSearchMockIds.has(id)) return false
    return true
  })

  const demoSaved = [
    ...items0.map((item) => toSavedRow(item, false)),
    ...items50.map((item, idx) => toSavedRow(item, idx < 2)),
    ...items100.map((item) => toSavedRow(item, true)),
  ]

  replaceSavedItemsList(tripId, [...savedRest, ...demoSaved])
}

/**
 * 예시 스냅샷·해당 MOCK 항목 저장분을 제거해 예시 추가 전 상태로 돌립니다.
 */
export function removeGuideArchiveDesignDemos(tripId) {
  const archive = loadGuideArchive(tripId).filter((e) => !String(e.id).startsWith(DEMO_PREFIX))
  saveGuideArchiveList(tripId, archive)

  const mockIds = getDemoDesignMockItemIds()
  const saved = loadSavedItems(tripId).filter((s) => !mockIds.has(String(s.id)))
  replaceSavedItemsList(tripId, saved)
}

/** 예시가 있으면 제거, 없으면 넣기 */
export function toggleGuideArchiveDesignDemos(tripId) {
  if (hasGuideArchiveDesignDemos(tripId)) {
    removeGuideArchiveDesignDemos(tripId)
  } else {
    seedGuideArchiveDesignDemos(tripId)
  }
}
