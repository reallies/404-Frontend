/**
 * 여행 검색(/trips/:id/search)에서 「저장」 시 스냅샷을 쌓아
 * 가이드 보관함(/trips/:id/guide-archive) 목록에서 조회합니다.
 *
 * 백엔드 연동 시 권장 스냅샷 필드 (목적지 페이지 `/trips/new/destination` 와 동일 의미):
 * - tripStartDate, tripEndDate: YYYY-MM-DD
 * - country, destination: 국가명 · 대표 도시(또는 지역 한 줄)
 * - countryCode, iata: 공항/국가 코드 (검색·날씨 API 매핑용)
 */

const STORAGE_PREFIX = 'travel_fe_guide_archive_v1_'

/**
 * @typedef {Object} GuideArchiveEntry
 * @property {string} id
 * @property {string} savedAt - ISO
 * @property {string} pageTitle
 * @property {string} destination
 * @property {string} country
 * @property {string} tripWindowLabel
 * @property {string} weatherSummary
 * @property {Array<{
 *   id: string,
 *   category: string,
 *   categoryLabel: string,
 *   title: string,
 *   description?: string,
 *   detail?: string,
 *   baggageType?: 'carry_on'|'checked',
 *   serverId?: string|null,
 *   source?: string,
 *   prepType?: string,
 *   subCategory?: string,
 *   subCategoryLabel?: string,
 *   refinedCategory?: string,
 *   refinedSubCategory?: string,
 *   refineConfidence?: number,
 *   refinedByModel?: string,
 *   refinedAt?: string
 * }>} items
 * @property {Array<{ id: string, dateLabel: string, region: string, weatherLine: string }>} dailySummaries
 * @property {string} [pageSubtitle]
 * @property {string} [temperatureRange]
 * @property {string} [rainChance]
 * @property {Array<{ id: string, label: string, detail: string }>} [environmentTags]
 * @property {Array<{ phase: string, text: string }>} [phaseHints]
 * @property {Array<{ id: string, dateLabel: string, region: string, weatherLine: string, environment: string[], essentials: string[], cautions: string[] }>} [dailyGuidesFull]
 */

/**
 * @param {string|number} tripId
 * @returns {GuideArchiveEntry[]}
 */
export function loadGuideArchive(tripId) {
  if (tripId == null) return []
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + String(tripId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * @param {string|number} tripId
 * @param {string} entryId
 */
export function getGuideArchiveEntry(tripId, entryId) {
  if (tripId == null || entryId == null) return null
  return loadGuideArchive(tripId).find((e) => String(e.id) === String(entryId)) ?? null
}

/**
 * 기존 엔트리에 필드 병합 (체크리스트 저장 시 진행률 스냅샷 등)
 * @param {string|number} tripId
 * @param {string|number} entryId
 * @param {Record<string, unknown>} partial
 */
export function patchGuideArchiveEntry(tripId, entryId, partial) {
  if (tripId == null || entryId == null) return null
  const list = loadGuideArchive(tripId)
  const idx = list.findIndex((e) => String(e.id) === String(entryId))
  if (idx < 0) return null
  const next = [...list]
  next[idx] = { ...next[idx], ...partial }
  saveGuideArchiveList(tripId, next)
  return next[idx]
}

/** 해당 여행의 가이드 보관함 목록을 모두 삭제합니다. */
export function clearGuideArchive(tripId) {
  if (tripId == null) return
  try {
    localStorage.removeItem(STORAGE_PREFIX + String(tripId))
  } catch (e) {
    console.warn('[guideArchiveStorage] clear failed', e)
  }
}

/**
 * @param {string|number} tripId
 * @param {Omit<GuideArchiveEntry, 'id'|'savedAt'> & { id?: string, savedAt?: string }} snapshot
 * @returns {GuideArchiveEntry[]}
 */
export function appendGuideArchiveEntry(tripId, snapshot) {
  const prev = loadGuideArchive(tripId)
  const entry = {
    id: snapshot.id ?? `ga-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    savedAt: snapshot.savedAt ?? new Date().toISOString(),
    pageTitle: snapshot.pageTitle,
    pageSubtitle: snapshot.pageSubtitle ?? '',
    destination: snapshot.destination,
    country: snapshot.country,
    tripWindowLabel: snapshot.tripWindowLabel,
    weatherSummary: snapshot.weatherSummary,
    temperatureRange: snapshot.temperatureRange ?? '',
    rainChance: snapshot.rainChance ?? '',
    environmentTags: Array.isArray(snapshot.environmentTags) ? snapshot.environmentTags : [],
    phaseHints: Array.isArray(snapshot.phaseHints) ? snapshot.phaseHints : [],
    items: Array.isArray(snapshot.items) ? snapshot.items : [],
    dailySummaries: Array.isArray(snapshot.dailySummaries) ? snapshot.dailySummaries : [],
    dailyGuidesFull: Array.isArray(snapshot.dailyGuidesFull) ? snapshot.dailyGuidesFull : [],
    tripStartDate: snapshot.tripStartDate ?? '',
    tripEndDate: snapshot.tripEndDate ?? '',
    countryCode: snapshot.countryCode ?? '',
    iata: snapshot.iata ?? '',
  }
  const next = [entry, ...prev]
  try {
    localStorage.setItem(STORAGE_PREFIX + String(tripId), JSON.stringify(next))
  } catch (e) {
    console.warn('[guideArchiveStorage] save failed', e)
  }
  return next
}

/** 목록 전체를 덮어씁니다. (예시 시드 등 특수 용도) */
export function saveGuideArchiveList(tripId, entries) {
  if (tripId == null) return
  try {
    localStorage.setItem(STORAGE_PREFIX + String(tripId), JSON.stringify(entries))
  } catch (e) {
    console.warn('[guideArchiveStorage] saveGuideArchiveList failed', e)
  }
}

/** 지정한 id의 스냅샷만 제거합니다. */
export function removeGuideArchiveEntriesByIds(tripId, entryIds) {
  if (tripId == null || !Array.isArray(entryIds) || entryIds.length === 0) return
  const drop = new Set(entryIds.map((id) => String(id)))
  const next = loadGuideArchive(tripId).filter((e) => !drop.has(String(e.id)))
  saveGuideArchiveList(tripId, next)
}
