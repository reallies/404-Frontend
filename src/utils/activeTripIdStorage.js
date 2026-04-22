/**
 * Step5 에서 `POST /api/trips` 로 만든 실제 trip id 를 잠시 보관한다.
 *
 * 용도:
 *   - `/trips/:id/loading`, `/trips/:id/search` 등에서 URL 의 id 가 하드코딩 `1` 이었을 때
 *     "사실은 이 id 를 써야 한다" 라고 복구할 수 있는 hint.
 *   - 브라우저 새로고침을 거쳐도 같은 trip 으로 이어지도록 sessionStorage 사용.
 *
 * 저장 시점: Trip 생성 성공 직후 (Step5 handleCreatePlan)
 * 제거 시점:
 *   - 체크리스트 선택 완료 후 `/guide-archive` 로 이동할 때 또는
 *   - 신규 여행 흐름을 다시 시작할 때 (`/trips/new/step2` 진입 시 자동 cleanup)
 */

const STORAGE_KEY = 'travel_fe_active_trip_id_v1'

export function saveActiveTripId(tripId) {
  if (typeof window === 'undefined' || !tripId) return
  try {
    sessionStorage.setItem(STORAGE_KEY, String(tripId))
  } catch {
    /* quota */
  }
}

export function loadActiveTripId() {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw && raw.trim() ? raw.trim() : null
  } catch {
    return null
  }
}

export function clearActiveTripId() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
