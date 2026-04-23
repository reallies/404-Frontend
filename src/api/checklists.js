import { apiClient } from '@/api/client'

/**
 * 백엔드가 기본 템플릿(DB) + LLM 추천을 합쳐서 돌려주는
 * 맞춤 체크리스트 생성 API.
 *
 *   POST /api/checklists/generate/:tripId
 *
 * 응답 형태 (요약):
 *   {
 *     tripId: string,
 *     context: { destination, durationDays, season, companions[], purposes[] },
 *     summary: { total, fromTemplate, fromLlm, duplicatesRemoved, llmTokensUsed, model },
 *     sections: [{ categoryCode, categoryLabel, items: GeneratedChecklistItem[] }],
 *     items:    GeneratedChecklistItem[]
 *   }
 *
 *   GeneratedChecklistItem = {
 *     title, description?, categoryCode, categoryLabel,
 *     prepType:    'item' | 'pre_booking' | 'pre_departure_check' | 'ai_recommend',
 *     baggageType: 'carry_on' | 'checked' | 'none',
 *     source:      'template' | 'llm',
 *     isEssential: boolean,
 *     orderIndex:  number
 *   }
 */
export async function generateChecklist(tripId) {
  const res = await apiClient.post(`/checklists/generate/${tripId}`)
  return res.data
}

/**
 * Trip 레코드가 아직 DB 에 저장되지 않은 상태에서도 맞춤 체크리스트를 생성한다.
 * 프론트 여행 플로우 중(/destination → step3~5) 로컬에 저장된 컨텍스트로 호출.
 *
 *   POST /api/checklists/generate-from-context
 *
 * @param {{
 *   destination: string,       // 자연어 or "국가 (도시들)" 포맷
 *   durationDays: number,
 *   season?: string,
 *   tripStart?: string,        // YYYY-MM-DD (season 추정에 사용)
 *   companions?: string[],
 *   purposes?: string[]
 * }} ctx
 */
export async function generateChecklistFromContext(ctx) {
  const res = await apiClient.post('/checklists/generate-from-context', ctx)
  return res.data
}

/**
 * 후보 풀(candidate pool) 조회 — 이미 생성된 체크리스트 항목 전체를 돌려준다.
 * 응답 shape 는 `generateChecklist` 와 동일하며, 각 item 에 `id`, `isSelected`, `selectedAt` 이 포함된다.
 *
 *   GET /api/checklists/by-trip/:tripId/candidates
 */
export async function listChecklistCandidates(tripId) {
  const res = await apiClient.get(`/checklists/by-trip/${tripId}/candidates`)
  return res.data
}

/**
 * 후보 풀의 항목을 "내 체크리스트" 에 담는다 (is_selected=true).
 *
 *   POST /api/checklists/items/:itemId/select
 */
export async function selectChecklistItem(itemId) {
  const res = await apiClient.post(`/checklists/items/${itemId}/select`)
  return res.data
}

/**
 * "내 체크리스트" 에서 항목을 뺀다. 후보 풀에는 남는다.
 *
 *   POST /api/checklists/items/:itemId/deselect
 */
export async function deselectChecklistItem(itemId) {
  const res = await apiClient.post(`/checklists/items/${itemId}/deselect`)
  return res.data
}

// -----------------------------------------------------------------
// 영속화 / 편집 / 체크 엔드포인트
//   ⚠️ 현재 백엔드는 스텁(echo) 구현. 프론트 인터페이스는 실제 DB 구현과 동일.
// -----------------------------------------------------------------

/** 체크리스트 아이템 일괄 저장. `items` 는 generate 응답의 `items` 배열을 그대로 넘기면 됨. */
export async function upsertChecklistItems(tripId, items) {
  const res = await apiClient.post(`/checklists/by-trip/${tripId}/items`, { items })
  return res.data
}

export async function editChecklistItem(itemId, patch) {
  const res = await apiClient.patch(`/checklists/items/${itemId}`, patch)
  return res.data
}

export async function deleteChecklistItem(itemId) {
  const res = await apiClient.delete(`/checklists/items/${itemId}`)
  return res.data
}

export async function toggleChecklistItem(itemId, action) {
  const res = await apiClient.post(`/checklists/items/${itemId}/check`, { action })
  return res.data
}

/** 저장된 체크리스트(by-trip) 조회 — 서버에 Checklist 레코드가 있을 때 */
export async function getChecklistByTrip(tripId) {
  const res = await apiClient.get(`/checklists/by-trip/${tripId}`)
  return res.data
}

/**
 * 가이드 보관함 상세 항목 재분류(2차 카테고리 분류).
 *
 * 백엔드 구현 전까지는 404/501 등이 날 수 있으므로
 * 호출부에서 반드시 fallback 처리해야 한다.
 *
 * 권장 응답 shape:
 * {
 *   model?: string,
 *   items: Array<{
 *     id: string,
 *     category: string,      // refinedCategory
 *     subCategory?: string,  // refinedSubCategory
 *     confidence?: number
 *   }>
 * }
 */
export async function reclassifyGuideArchiveItems(payload) {
  const res = await apiClient.post('/checklists/reclassify-guide-archive', payload)
  return res.data
}
