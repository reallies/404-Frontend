/**
 * 온보딩·법적 동의 진입 게이트 — **백엔드 없을 때** 소셜 로그인 직후 분기용 플레이스홀더.
 *
 * ## 제품 흐름 (프론트 시뮬레이션)
 * - **신규(첫 서비스 이용)**: 소셜 로그인 성공 → `/auth/consent`(약관·개인정보) → `/onboarding` → 완료 후 홈
 * - **기존 사용자**: 소셜 로그인 성공 → **바로 `/` (동의·온보딩 화면 생략)**
 *
 * 여기서 **「기존 사용자」**는 로컬 스토리지상 **프로필 온보딩까지 완료한 계정**과 동일합니다.
 * (실서비스에서는 백엔드의 `onboarding_completed` / `profile_completed` 등으로 같은 의미를 쓰면 됩니다.)
 * 온보딩을 **중간에만** 하고 나간 계정은 다음 로그인 시 **남은 단계(온보딩)** 로 이어집니다.
 *
 * ## 로그아웃 후 재로그인 (실서비스와 동일한 의도)
 * - 로그아웃 UI는 `/login`(소셜 로그인 페이지)으로 보냅니다.
 * - `clearClientSessionForLogout()`은 **세션만** 지우고, `localStorage`의 동의·온보딩 완료·프로바이더별 mock `sub`는 **유지**합니다.
 * - 따라서 이미 한 번 전체 플로우를 마친 사용자가 **같은 소셜 버튼**으로 다시 로그인하면 `resolvePostSocialLoginPath`가 `hasCompletedOnboarding(sub)`로 곧바로 `/`를 반환합니다.
 * - 실연동 시: 로그아웃은 토큰/세션만 무효화하고, 재로그인 OAuth 완료 후 서버가 `onboarding_completed` 등을 내려주면 동일하게 홈으로 보내면 됩니다.
 *
 * 백엔드 연동 후:
 * - OAuth 콜백에서 `user.sub`(또는 id)와 서버 플래그만 보고 `navigate(...)` 분기하면 되고,
 * - 이 모듈의 localStorage/sessionStorage 키는 제거해도 됩니다.
 */

const NS = 'checkmate'
const KEY_ONBOARDED = `${NS}:onboarded_account_ids`
const KEY_LEGAL_CONSENT = `${NS}:legal_consent_account_ids`
const mockSubKey = (provider) => `${NS}:mock_oauth_sub:${String(provider).toLowerCase()}`
export const SESSION_LAST_SOCIAL_PROVIDER = `${NS}:last_social_provider`

/**
 * 로그아웃 시 클라이언트 **세션만** 정리합니다.
 *
 * - 제거: `sessionStorage`의 마지막 소셜 프로바이더(모의 로그인 직후 분기용).
 * - 유지: `localStorage`의 약관 동의·온보딩 완료 집합, 프로바이더별 mock OAuth `sub`.
 *   → 같은 기기에서 재로그인 시 약관/프로필 단계를 건너뛰고 홈으로 가는 동작의 전제입니다.
 *
 * 실연동 시: refresh/access 토큰 삭제·`signOut`·쿠키 무효화 등을 여기(또는 호출부)에 추가하고,
 * **계정 단위 플래그는 서버가 권위**를 가지므로 클라이언트에서 임의로 지우지 않습니다.
 */
export function clearClientSessionForLogout() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(SESSION_LAST_SOCIAL_PROVIDER)
  } catch {
    /* ignore */
  }
}

/**
 * 데스크톱 헤더 등 — 「웹에서 로그인된 UI를 쓸지」 모의 판별.
 * 소셜 로그인 플로우에서 `resolvePostSocialLoginPath`가 세팅한 sessionStorage만 본다.
 * 실연동 시: Auth 세션·액세스 토큰·`/me` 응답 등으로 교체하면 됨.
 *
 * @returns {boolean}
 */
export function isMockWebSessionLoggedIn() {
  if (typeof window === 'undefined') return false
  return Boolean(sessionStorage.getItem(SESSION_LAST_SOCIAL_PROVIDER))
}

/** 약관·개인정보 동의 화면 경로 */
export const AUTH_CONSENT_PATH = '/auth/consent'

/** UI 작업용: 이 쿼리가 있으면 로그인·완료 여부와 관계없이 동의 화면을 표시 */
export const AUTH_CONSENT_PREVIEW_PARAM = 'preview'

function readIdSet(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function writeIdSet(storageKey, set) {
  localStorage.setItem(storageKey, JSON.stringify([...set]))
}

function readOnboardedSet() {
  return readIdSet(KEY_ONBOARDED)
}

function writeOnboardedSet(set) {
  writeIdSet(KEY_ONBOARDED, set)
}

function readLegalConsentSet() {
  return readIdSet(KEY_LEGAL_CONSENT)
}

function writeLegalConsentSet(set) {
  writeIdSet(KEY_LEGAL_CONSENT, set)
}

/**
 * 프로바이더별로 브라우저에 고정되는 **가짜 OAuth subject** (실제 JWT `sub` 대역).
 */
export function getOrCreateMockOAuthSubject(provider) {
  const p = String(provider).toLowerCase()
  let sub = localStorage.getItem(mockSubKey(p))
  if (!sub) {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    sub = `${p}:${id}`
    localStorage.setItem(mockSubKey(p), sub)
  }
  return sub
}

/** 서비스 **초기 설정 완료**(= 기존 회원). 백엔드의 온보딩 완료 플래그와 대응. */
export function hasCompletedOnboarding(accountSubject) {
  if (!accountSubject) return false
  return readOnboardedSet().has(accountSubject)
}

export function markOnboardingComplete(accountSubject) {
  if (!accountSubject) return
  const s = readOnboardedSet()
  s.add(accountSubject)
  writeOnboardedSet(s)
}

export function hasAcceptedLegalConsent(accountSubject) {
  if (!accountSubject) return false
  return readLegalConsentSet().has(accountSubject)
}

/**
 * @param {string} accountSubject
 * @param {{ marketingOptIn?: boolean }} [options] 선택 마케팅 동의 — 백엔드 연동 시 API로 전송
 */
export function markLegalConsentAccepted(accountSubject, options = {}) {
  if (!accountSubject) return
  const s = readLegalConsentSet()
  s.add(accountSubject)
  writeLegalConsentSet(s)
  if (options.marketingOptIn) {
    try {
      localStorage.setItem(`${NS}:marketing_opt_in:${accountSubject}`, '1')
    } catch {
      /* ignore quota */
    }
  }
}

/**
 * 소셜 로그인 성공 직후(플레이스홀더 클릭) 이동 경로.
 * 순서: 기존(온보딩 완료) → 홈 / 신규·미동의 → 동의 / 동의만 한 신규 → 온보딩
 *
 * @param {'google'|'kakao'|'naver'} provider
 * @returns {'/'|'/auth/consent'|'/onboarding'}
 */
export function resolvePostSocialLoginPath(provider) {
  if (typeof window === 'undefined') return '/'
  const p = String(provider).toLowerCase()
  sessionStorage.setItem(SESSION_LAST_SOCIAL_PROVIDER, p)
  const sub = getOrCreateMockOAuthSubject(p)
  if (hasCompletedOnboarding(sub)) return '/'
  if (!hasAcceptedLegalConsent(sub)) return AUTH_CONSENT_PATH
  return '/onboarding'
}

export function getActiveOnboardingSubject() {
  if (typeof window === 'undefined') return null
  const prov = sessionStorage.getItem(SESSION_LAST_SOCIAL_PROVIDER)
  if (!prov) return null
  return getOrCreateMockOAuthSubject(prov)
}

/**
 * 온보딩 페이지 마운트 시 리다이렉트.
 * @returns {'login'|'home'|'consent'|null}
 */
export function getOnboardingEntryRedirect() {
  const sub = getActiveOnboardingSubject()
  if (!sub) return 'login'
  if (hasCompletedOnboarding(sub)) return 'home'
  if (!hasAcceptedLegalConsent(sub)) return 'consent'
  return null
}

/**
 * 동의 페이지 진입 가능 여부(이미 동의·온보딩 끝이면 다른 곳으로 보냄).
 * @returns {'login'|'home'|'onboarding'|null} null이면 동의 화면 유지
 */
export function getAuthConsentEntryRedirect() {
  const sub = getActiveOnboardingSubject()
  if (!sub) return 'login'
  if (hasCompletedOnboarding(sub)) return 'home'
  if (hasAcceptedLegalConsent(sub)) return 'onboarding'
  return null
}
