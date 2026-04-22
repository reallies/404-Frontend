import { apiClient } from '@/api/client'

/**
 * 사용자 행동 이벤트 수집.
 *
 *   POST /api/analytics/events     Body: Event | Event[]
 *
 * Event = {
 *   userId: string|number,
 *   tripId?: string|number|null,
 *   itemId?: string|number|null,
 *   sessionId: string,
 *   eventType: 'search' | 'detail_check' | 'save' | 'saved_list_open'
 *            | 'edit_text' | 'edit_add' | 'edit_del' | 'edit_reorder'
 *            | 'prepare_action' | 're_search' | 'missing_item_detection',
 *   metadata?: Record<string, unknown>,
 *   occurredAt?: string   // ISO
 * }
 *
 * 네트워크 오류로 분석 데이터 때문에 유저 플로우가 깨지지 않도록 try/catch 로 감싼다.
 */
export async function ingestEvents(events) {
  try {
    await apiClient.post('/analytics/events', events)
    return { ok: true }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[analytics] ingest failed', err?.message ?? err)
    }
    return { ok: false, error: String(err?.message ?? err) }
  }
}
