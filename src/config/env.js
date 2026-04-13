/**
 * 환경변수 중앙 관리 파일
 *
 * 규칙:
 * - 환경변수는 반드시 이 파일을 통해서만 접근한다.
 * - 코드 어디서도 import.meta.env.VITE_XXX 를 직접 사용하지 않는다.
 * - 새로운 환경변수 추가 시 이 파일과 .env.example 을 함께 업데이트한다.
 *
 * 참고: 04_meta_okr.md - 이벤트 수집 구조에서 사용하는 분석 키 포함
 */

const env = {
  /** 앱 기본 설정 */
  APP_NAME: import.meta.env.VITE_APP_NAME ?? 'Travel Checklist',
  APP_ENV: import.meta.env.VITE_APP_ENV ?? 'development',

  /** 백엔드 API */
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? '',

  /** Supabase */
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',

  /** 분석 도구 (사용자 행동 이벤트 수집 - 04_meta_okr.md 참고) */
  ANALYTICS_KEY: import.meta.env.VITE_ANALYTICS_KEY ?? '',

  /** 환경 판별 헬퍼 */
  isDevelopment: import.meta.env.VITE_APP_ENV === 'development',
  isStaging: import.meta.env.VITE_APP_ENV === 'staging',
  isProduction: import.meta.env.VITE_APP_ENV === 'production',
}

/**
 * 필수 환경변수 누락 여부를 개발 단계에서 조기 감지한다.
 * 배포 전 CI/CD에서도 이 에러를 통해 누락을 잡을 수 있다.
 */
const REQUIRED_KEYS = ['API_BASE_URL']

if (env.isProduction) {
  REQUIRED_KEYS.push('SUPABASE_URL', 'SUPABASE_ANON_KEY', 'ANALYTICS_KEY')
}

REQUIRED_KEYS.forEach((key) => {
  if (!env[key]) {
    console.error(
      `[env] 필수 환경변수 누락: VITE_${key}\n` +
        `.env.local 또는 배포 환경의 환경변수를 확인하세요.\n` +
        `.env.example 파일을 참고하세요.`
    )
  }
})

export default env
