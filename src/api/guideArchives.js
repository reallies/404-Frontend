import { apiClient } from '@/api/client'

/**
 * Guide Archive (여행별 "저장한 가이드") API.
 *
 * ⚠️ 현재 서버는 인메모리 스텁(재시작 시 소실). 프론트 인터페이스는 실제 영속화 버전과
 * 동일하므로, 스키마 마이그레이션 이후 서버 코드만 교체하면 된다.
 *
 * 라우트:
 *   GET    /api/trips/:tripId/guide-archives
 *   POST   /api/trips/:tripId/guide-archives        Body: { name, snapshot }
 *   PATCH  /api/guide-archives/:archiveId            Body: { name?, snapshot? }
 *   DELETE /api/guide-archives/:archiveId
 */
export async function listGuideArchives(tripId) {
  const res = await apiClient.get(`/trips/${tripId}/guide-archives`)
  return res.data?.archives ?? []
}

export async function createGuideArchive(tripId, { name, snapshot }) {
  const res = await apiClient.post(`/trips/${tripId}/guide-archives`, {
    name,
    snapshot,
  })
  return res.data
}

export async function updateGuideArchive(archiveId, patch) {
  const res = await apiClient.patch(`/guide-archives/${archiveId}`, patch)
  return res.data
}

export async function deleteGuideArchive(archiveId) {
  const res = await apiClient.delete(`/guide-archives/${archiveId}`)
  return res.data
}
