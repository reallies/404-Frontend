import { apiClient } from '@/api/client'

/**
 * 마스터 데이터 조회. 모든 라우트는 @Public 이라 인증 없이도 호출 가능.
 * 초기에는 프론트 mock 을 그대로 쓰고, 나중에 이 헬퍼들로 하나씩 치환.
 */

export async function listCountries() {
  const res = await apiClient.get('/master/countries')
  return res.data
}

/** @param {{ countryId?: string|number, onlyServed?: boolean }} [opts] */
export async function listCities(opts = {}) {
  const params = {}
  if (opts.countryId != null) params.countryId = opts.countryId
  if (opts.onlyServed) params.onlyServed = 'true'
  const res = await apiClient.get('/master/cities', { params })
  return res.data
}

export async function listChecklistCategories() {
  const res = await apiClient.get('/master/checklist-categories')
  return res.data
}

export async function listTravelStyles() {
  const res = await apiClient.get('/master/travel-styles')
  return res.data
}

export async function listCompanionTypes() {
  const res = await apiClient.get('/master/companion-types')
  return res.data
}
