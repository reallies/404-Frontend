import { apiClient } from '@/api/client'

/**
 * 여행(trip) CRUD.
 *
 * 프론트의 Trip Creation Funnel(step2~step5) 완료 시
 * `createTrip(payload)` 를 호출하면 서버가 관련 관계(도시/동행/스타일/항공권)까지
 * 단일 트랜잭션으로 생성한다.
 *
 * payload 스키마 (백엔드 `CreateTripDto`):
 *   {
 *     userId: number,
 *     countryCode: 'VN' | 'JP' | ...,
 *     title: string,
 *     tripStart: 'YYYY-MM-DD',
 *     tripEnd:   'YYYY-MM-DD',
 *     bookingStatus: 'booked' | 'not_booked',
 *     status?: 'planning' | 'preparing' | 'completed',
 *     cities?: [{ cityIata?, cityId?, orderIndex, visitStart?, visitEnd?, isAutoSynced? }],
 *     flights?: [...], companions?: [...], travelStyles?: [...]
 *   }
 */
export async function createTrip(payload) {
  const res = await apiClient.post('/trips', payload)
  return res.data
}

export async function listMyTrips(userId) {
  const res = await apiClient.get('/trips', { params: { userId } })
  return res.data
}

export async function getTrip(tripId) {
  const res = await apiClient.get(`/trips/${tripId}`)
  return res.data
}

export async function updateTrip(tripId, patch) {
  const res = await apiClient.patch(`/trips/${tripId}`, patch)
  return res.data
}

export async function deleteTrip(tripId) {
  const res = await apiClient.delete(`/trips/${tripId}`)
  return res.data
}
