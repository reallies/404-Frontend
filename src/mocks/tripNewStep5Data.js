/**
 * TripNewStep5Page 목데이터
 *
 * 동행인(단일) · 여행 스타일(복수) 선택 후 계획 생성으로 이어지는 마지막 입력 단계입니다.
 */

/* ─────────────────────────────────────────────
   스텝 설정 (화면에 4 / 5 표시)
───────────────────────────────────────────── */
export const STEP5_CONFIG = {
  totalSteps: 5,
  currentStep: 4,
}

export const STEP5_PAGE_TITLE = '누구와 함께 하고 싶으세요?'

export const STEP5_PAGE_SUBTITLE =
  '가장 완벽한 일정을 위해 여행 동행자와 스타일을 알려주세요.'

/* ─────────────────────────────────────────────
   동행인 카드용 SVG path (fill)
───────────────────────────────────────────── */
export const STEP5_ICON_PATHS = {
  person:
    'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  heart:
    'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  group:
    'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  /** 아이와 — 프로필 실루엣 */
  child:
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
}

/* ─────────────────────────────────────────────
   동행인 옵션
───────────────────────────────────────────── */
export const COMPANIONS = [
  {
    id: 'alone',
    label: '혼자',
    description: '나만의 온전한 시간',
    icon: 'person',
  },
  {
    id: 'couple',
    label: '연인과',
    description: '로맨틱한 둘만의 여행',
    icon: 'heart',
  },
  {
    id: 'withKids',
    label: '아이와',
    description: '즐거운..? 육아 여행',
    icon: 'child',
  },
  {
    id: 'friends',
    label: '친구와',
    description: '함께라서 더 신나는 여행',
    icon: 'group',
  },
  {
    id: 'parents',
    label: '부모님과',
    description: '사랑하는 부모님과 함께',
    icon: 'home',
  },
]

/* ─────────────────────────────────────────────
   여행 스타일 (복수 선택) — public/travel-style-icons/*.png
───────────────────────────────────────────── */
export const TRAVEL_STYLES = [
  { id: 'foodie', label: '먹방', iconSrc: '/travel-style-icons/foodie.png' },
  { id: 'landmark', label: '랜드마크', iconSrc: '/travel-style-icons/landmark.png' },
  { id: 'healing', label: '힐링', iconSrc: '/travel-style-icons/healing.png' },
  { id: 'shopping', label: '쇼핑', iconSrc: '/travel-style-icons/shopping.png' },
  { id: 'nature', label: '자연', iconSrc: '/travel-style-icons/nature.png' },
  { id: 'activity', label: '액티비티', iconSrc: '/travel-style-icons/activity.png' },
  { id: 'culture', label: '문화예술', iconSrc: '/travel-style-icons/culture.png' },
  { id: 'photo', label: '포토스팟', iconSrc: '/travel-style-icons/photo.png' },
  { id: 'nightlife', label: '나이트 라이프', iconSrc: '/travel-style-icons/nightlife.png' },
]

export const EDITORIAL_PICK = {
  eyebrow: 'EDITORIAL PICK',
  title: '이번 시즌 추천 동선',
  description: '동행과 스타일에 맞춰 코스를 구성해 드릴게요.',
}
