import { apiClient } from '@/api/client'

/**
 * 내 프로필 수정 (온보딩 "성별·생년월일" 저장 등).
 *
 *   PATCH /api/users/me
 *   Body: { nickname?, gender?, birthDate?: 'YYYY-MM-DD', profileImageUrl? }
 */
export async function updateMyProfile(patch) {
  const res = await apiClient.patch('/users/me', patch)
  return res.data?.user ?? null
}

/**
 * 약관/개인정보 동의 수락.
 *
 *   POST /api/users/me/consent
 *   Body: { marketingOptIn?: boolean }
 *
 * ⚠️ 현재 백엔드는 스텁(echo) 응답. 차후 DB 영속화로 교체 예정.
 */
export async function acceptLegalConsent({ marketingOptIn = false } = {}) {
  const res = await apiClient.post('/users/me/consent', { marketingOptIn })
  return res.data
}
