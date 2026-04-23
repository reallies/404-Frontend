import { arrayMove } from '@dnd-kit/sortable'
import {
  BAGGAGE_CARRY_ON,
  BAGGAGE_CHECKED,
  GUIDE_USER_DIRECT_CATEGORY,
  GUIDE_USER_DIRECT_SECTION_LABEL,
  resolveBaggageSection,
} from '@/utils/guideArchiveBaggage'

/** 목 데이터·레거시 스냅샷용. 백엔드에서 항목이 실제 탭 카테고리로 내려오면 이 값은 사라짐. */
export const GUIDE_ARCHIVE_LEGACY_AI_CATEGORY = 'ai_recommend'

/**
 * 보관함 목록/드래그에서만 사용: AI 전용 탭 제거 후 레거시 ai_recommend 는 준비물(supplies)과 같은 섹션으로 취급.
 * @param {Record<string, unknown>|undefined|null} item
 * @returns {string}
 */
export function resolveGuideArchiveCategoryForSection(item) {
  const c = item?.refinedCategory ?? item?.category ?? '_misc'
  if (c === GUIDE_ARCHIVE_LEGACY_AI_CATEGORY) return 'supplies'
  return c
}

/** 목록 표시: `ai_recommend` 항목을 같은 섹션 안에서 항상 위쪽에 */
export function compareGuideArchiveAiFirst(a, b) {
  const aBase = a?.category ?? '_misc'
  const bBase = b?.category ?? '_misc'
  const aAi = aBase === GUIDE_ARCHIVE_LEGACY_AI_CATEGORY || a?.source === 'llm' ? 0 : 1
  const bAi = bBase === GUIDE_ARCHIVE_LEGACY_AI_CATEGORY || b?.source === 'llm' ? 0 : 1
  return aAi - bAi
}

/**
 * 가이드 보관함 체크리스트 — 동일 수하물 구간·카테고리(직접 추가 제외) 내에서만 순서 변경.
 * @param {Array<Record<string, unknown>>} allItems
 * @param {string} bagKey
 * @param {string} categoryValue
 * @param {number} fromIdx
 * @param {number} toIdx
 */
export function reorderGuideArchiveSectionItems(allItems, bagKey, categoryValue, fromIdx, toIdx) {
  const sectionItems = []
  for (const it of allItems) {
    if (resolveBaggageSection(it) !== bagKey) continue
    const cv = it.category ?? '_misc'
    if (cv === GUIDE_USER_DIRECT_CATEGORY) continue
    if (resolveGuideArchiveCategoryForSection(it) !== categoryValue) continue
    sectionItems.push(it)
  }
  if (sectionItems.length <= 1 || fromIdx === toIdx) return allItems
  const moved = arrayMove(sectionItems, fromIdx, toIdx)
  const idSet = new Set(sectionItems.map((i) => String(i.id)))
  const out = []
  let merged = false
  for (const it of allItems) {
    const id = String(it.id)
    if (!idSet.has(id)) {
      out.push(it)
      continue
    }
    if (!merged) {
      out.push(...moved)
      merged = true
    }
  }
  return out
}

/**
 * 「직접 추가」 블록 — 현재 필터에 보이는 직접 추가 항목만 순서 변경
 * @param {Array<Record<string, unknown>>} allItems
 * @param {'all'|string} filterBaggage
 * @param {number} fromIdx
 * @param {number} toIdx
 */
export function reorderGuideArchiveDirectItems(allItems, filterBaggage, fromIdx, toIdx) {
  const isDirect = (it) => (it.category ?? '_misc') === GUIDE_USER_DIRECT_CATEGORY
  const inFilter = (it) =>
    filterBaggage === 'all' || resolveBaggageSection(it) === filterBaggage

  const segment = []
  for (const it of allItems) {
    if (isDirect(it) && inFilter(it)) segment.push(it)
  }
  if (segment.length <= 1 || fromIdx === toIdx) return allItems
  const moved = arrayMove(segment, fromIdx, toIdx)
  const idSet = new Set(segment.map((i) => String(i.id)))
  const out = []
  let merged = false
  for (const it of allItems) {
    const id = String(it.id)
    if (!idSet.has(id)) {
      out.push(it)
      continue
    }
    if (!merged) {
      out.push(...moved)
      merged = true
    }
  }
  return out
}

export function buildGuideArchiveSectionDroppableId(bagKey, categoryValue, categoryLabel) {
  const payload = encodeURIComponent(JSON.stringify({ v: categoryValue, l: categoryLabel }))
  return `gadrop|${bagKey}|${payload}`
}

export function buildGuideArchiveDirectDroppableId() {
  return 'gadrop|direct'
}

/**
 * @param {string|number} id
 * @returns {{ kind: 'direct' } | { kind: 'section', bagKey: string, categoryValue: string, categoryLabel: string } | null}
 */
export function parseGuideArchiveDropTarget(id) {
  const s = String(id)
  if (s === 'gadrop|direct') return { kind: 'direct' }
  if (!s.startsWith('gadrop|')) return null
  const rest = s.slice(7)
  const idx = rest.indexOf('|')
  if (idx < 0) return null
  const bagKey = rest.slice(0, idx)
  const payload = rest.slice(idx + 1)
  try {
    const { v, l } = JSON.parse(decodeURIComponent(payload))
    return { kind: 'section', bagKey, categoryValue: v, categoryLabel: l ?? '준비물' }
  } catch {
    return null
  }
}

/**
 * 다른 카테고리/수하물 구간으로 이동 — 대상 섹션 **맨 끝에 추가**(기존 항목 순서 유지).
 * @param {Array<Record<string, unknown>>} allItems
 * @param {string|number} itemId
 * @param {string} targetBagKey
 * @param {string} targetCategoryValue
 * @param {string} targetCategoryLabel
 */
export function moveItemAppendToSection(
  allItems,
  itemId,
  targetBagKey,
  targetCategoryValue,
  targetCategoryLabel,
) {
  const id = String(itemId)
  const idx = allItems.findIndex((it) => String(it.id) === id)
  if (idx < 0) return allItems

  const it = allItems[idx]
  const updated = {
    ...it,
    category: targetCategoryValue,
    categoryLabel: targetCategoryLabel,
    refinedCategory: targetCategoryValue,
    refinedAt: new Date().toISOString(),
    baggageType: targetBagKey === BAGGAGE_CHECKED ? BAGGAGE_CHECKED : BAGGAGE_CARRY_ON,
  }

  const rest = allItems.filter((_, i) => i !== idx)

  let lastInTarget = -1
  for (let i = 0; i < rest.length; i++) {
    const x = rest[i]
    if ((x.category ?? '_misc') === GUIDE_USER_DIRECT_CATEGORY) continue
    if (resolveBaggageSection(x) !== targetBagKey) continue
    if (resolveGuideArchiveCategoryForSection(x) !== targetCategoryValue) continue
    lastInTarget = i
  }

  let insertAt = rest.length
  if (lastInTarget >= 0) {
    insertAt = lastInTarget + 1
  } else {
    let lastInBag = -1
    for (let i = 0; i < rest.length; i++) {
      const x = rest[i]
      if ((x.category ?? '_misc') === GUIDE_USER_DIRECT_CATEGORY) continue
      if (resolveBaggageSection(x) === targetBagKey) lastInBag = i
    }
    insertAt = lastInBag >= 0 ? lastInBag + 1 : rest.length
  }

  return [...rest.slice(0, insertAt), updated, ...rest.slice(insertAt)]
}

/**
 * 직접 추가 블록 맨 끝에 추가 (기존 직접 추가 항목 순서 유지).
 * @param {Array<Record<string, unknown>>} allItems
 * @param {string|number} itemId
 */
export function moveItemAppendToDirectSection(allItems, itemId) {
  const id = String(itemId)
  const idx = allItems.findIndex((it) => String(it.id) === id)
  if (idx < 0) return allItems

  const it = allItems[idx]
  const updated = {
    ...it,
    category: GUIDE_USER_DIRECT_CATEGORY,
    categoryLabel: GUIDE_USER_DIRECT_SECTION_LABEL,
    refinedCategory: GUIDE_USER_DIRECT_CATEGORY,
    refinedAt: new Date().toISOString(),
    baggageType: BAGGAGE_CARRY_ON,
  }

  const rest = allItems.filter((_, i) => i !== idx)
  let lastDirect = -1
  for (let i = 0; i < rest.length; i++) {
    if ((rest[i].category ?? '_misc') === GUIDE_USER_DIRECT_CATEGORY) lastDirect = i
  }
  const insertAt = lastDirect >= 0 ? lastDirect + 1 : rest.length
  return [...rest.slice(0, insertAt), updated, ...rest.slice(insertAt)]
}

/**
 * 다른 카테고리/수하물 구간으로 이동 — `insertBeforeId` 항목 **바로 앞**에 끼워 넣음.
 * `insertBeforeId`가 없거나 유효하지 않으면 해당 섹션 맨 뒤(기존 append 규칙)로 붙음.
 */
export function moveItemInsertIntoSection(
  allItems,
  itemId,
  targetBagKey,
  targetCategoryValue,
  targetCategoryLabel,
  insertBeforeId,
) {
  const id = String(itemId)
  const beforeId = insertBeforeId != null ? String(insertBeforeId) : null

  const idx = allItems.findIndex((it) => String(it.id) === id)
  if (idx < 0) return allItems

  const it = allItems[idx]
  const updated = {
    ...it,
    category: targetCategoryValue,
    categoryLabel: targetCategoryLabel,
    refinedCategory: targetCategoryValue,
    refinedAt: new Date().toISOString(),
    baggageType: targetBagKey === BAGGAGE_CHECKED ? BAGGAGE_CHECKED : BAGGAGE_CARRY_ON,
  }

  const rest = allItems.filter((_, i) => i !== idx)

  const inTargetSection = (x) =>
    (x.category ?? '_misc') !== GUIDE_USER_DIRECT_CATEGORY &&
    resolveBaggageSection(x) === targetBagKey &&
    resolveGuideArchiveCategoryForSection(x) === targetCategoryValue

  if (beforeId) {
    const insertIdx = rest.findIndex((x) => String(x.id) === beforeId)
    if (insertIdx >= 0 && inTargetSection(rest[insertIdx])) {
      return [...rest.slice(0, insertIdx), updated, ...rest.slice(insertIdx)]
    }
  }

  let lastInTarget = -1
  for (let i = 0; i < rest.length; i++) {
    const x = rest[i]
    if ((x.category ?? '_misc') === GUIDE_USER_DIRECT_CATEGORY) continue
    if (resolveBaggageSection(x) !== targetBagKey) continue
    if (resolveGuideArchiveCategoryForSection(x) !== targetCategoryValue) continue
    lastInTarget = i
  }

  let insertAt = rest.length
  if (lastInTarget >= 0) {
    insertAt = lastInTarget + 1
  } else {
    let lastInBag = -1
    for (let i = 0; i < rest.length; i++) {
      const x = rest[i]
      if ((x.category ?? '_misc') === GUIDE_USER_DIRECT_CATEGORY) continue
      if (resolveBaggageSection(x) === targetBagKey) lastInBag = i
    }
    insertAt = lastInBag >= 0 ? lastInBag + 1 : rest.length
  }

  return [...rest.slice(0, insertAt), updated, ...rest.slice(insertAt)]
}

/**
 * 직접 추가로 이동 — `insertBeforeId` 항목 **바로 앞**에 끼워 넣음 (필터에 보이는 직접 추가 항목 기준).
 * `insertBeforeId`가 없거나 유효하지 않으면 직접 추가 블록 맨 뒤.
 */
export function moveItemInsertIntoDirectSection(allItems, itemId, insertBeforeId, filterBaggage) {
  const id = String(itemId)
  const beforeId = insertBeforeId != null ? String(insertBeforeId) : null

  const idx = allItems.findIndex((it) => String(it.id) === id)
  if (idx < 0) return allItems

  const it = allItems[idx]
  const updated = {
    ...it,
    category: GUIDE_USER_DIRECT_CATEGORY,
    categoryLabel: GUIDE_USER_DIRECT_SECTION_LABEL,
    refinedCategory: GUIDE_USER_DIRECT_CATEGORY,
    refinedAt: new Date().toISOString(),
    baggageType: BAGGAGE_CARRY_ON,
  }

  const rest = allItems.filter((_, i) => i !== idx)

  const isDirectVisible = (x) =>
    (x.category ?? '_misc') === GUIDE_USER_DIRECT_CATEGORY &&
    (filterBaggage === 'all' || resolveBaggageSection(x) === filterBaggage)

  if (beforeId) {
    const insertIdx = rest.findIndex((x) => String(x.id) === beforeId)
    if (insertIdx >= 0 && isDirectVisible(rest[insertIdx])) {
      return [...rest.slice(0, insertIdx), updated, ...rest.slice(insertIdx)]
    }
  }

  let lastDirect = -1
  for (let i = 0; i < rest.length; i++) {
    if ((rest[i].category ?? '_misc') === GUIDE_USER_DIRECT_CATEGORY) lastDirect = i
  }
  const insertAt = lastDirect >= 0 ? lastDirect + 1 : rest.length
  return [...rest.slice(0, insertAt), updated, ...rest.slice(insertAt)]
}
