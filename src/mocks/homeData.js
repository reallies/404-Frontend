/**
 * HomePage 목데이터 (랜딩 레이아웃)
 * 카피·톤: CHECKMATE — 차분한 틸/민트 계열 브랜드와 맞춤
 */

import homeHeroOceanSunsetUrl from '@/assets/home-hero-ocean-sunset.png'

export const FOOTER_BOTTOM_LINKS = [
  { label: '문의하기', href: '#' },
  { label: '개인정보 처리방침', href: '#' },
  { label: '서비스 이용약관', href: '#' },
]

export const FOOTER_SECTIONS = [
  {
    id: 'support',
    title: '고객지원',
    links: ['이용 가이드', '공지사항', '자주 묻는 질문'],
  },
  {
    id: 'company',
    title: '회사',
    links: ['서비스 소개', '브랜드 스토리', '채용'],
  },
  {
    id: 'legal',
    title: '법적 고지',
    links: ['이용약관', '개인정보처리방침', '운영 정책'],
  },
  {
    id: 'contact',
    title: '문의',
    links: ['제휴·협력', 'B2B 문의', 'press@checkmate.app'],
  },
]

export const FOOTER_SOCIAL_LINKS = [
  { label: 'LinkedIn', href: '#', icon: 'linkedin' },
  { label: 'Instagram', href: 'https://www.instagram.com/checkmate._.v/', icon: 'instagram' },
]

export const LANDING_SECTION_IDS = {
  features: 'landing-features',
  how: 'landing-how',
}

/**
 * 히어로 메인 헤딩 — 순서대로 <br />로 연결
 * 한 줄이 [앞, 강조, 뒤] 배열이면 가운데만 보라 그라데이션(HomePage)
 */
export const HOME_HERO_TITLE_LINES = [
  '준비는 쉽게,',
  ['여행은 ', '완벽하게', ''],
]

export const HOME_HERO_SUBTITLE =
  '복잡한 여행 준비, 이제는 메이트가 도와드릴게요'

/** 히어로 배경 — 브랜드 제공 PNG (일몰·청록 바다) */
export const HOME_HERO_BG = homeHeroOceanSunsetUrl

export const HOME_CTA_SIDE_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop'

/** 피처 섹션 키커 — “왜 쓰는가” 톤 */
export const HOME_FEATURE_KICKER = 'CHECKMATE · 여행 준비를 가볍게 만드는 이유'

/** 피처 섹션 메인 헤드라인 — 가치 제안(이유), 줄바꿈은 HomePage 에서 처리 */
export const HOME_FEATURE_HEADING = {
  line1: '여행은 설레는데 준비만 무겁다면,',
  line2: '그 부담을 덜어드립니다',
}

export const HOME_FEATURE_CARDS = [
  {
    id: 'auto',
    icon: 'folder',
    accent: 'teal',
    title: '흩어진 탭·메모 대신, 한 화면에서 시작해요',
    description:
      '북마크와 캡처를 뒤지느라 시간 쓰지 마세요. 목적지와 일정만 알려 주면 맞춤 준비 목록을 한 번에 받아볼 수 있어요.',
  },
  {
    id: 'care',
    icon: 'network',
    accent: 'amber',
    title: '빠뜨릴까 불안한 마음을, 체크로 조금 덜어요',
    description:
      '저장해 둔 리스트를 언제든 다시 열고 항목을 체크하며 정리할 수 있어요. 출발 직전·짐 싸기 전 마지막 점검도 같은 곳에서 이어가요.',
  },
  {
    id: 'smart',
    icon: 'list',
    accent: 'cyan',
    title: '정리된 흐름이라, 머릿속이 덜 복잡해져요',
    description:
      '이동·숙박·서류처럼 흐름이 잡혀 있어 “다음에 뭘 챙기지?”를 금방 파악할 수 있어요. 여러 앱과 메모를 오가며 정리할 부담이 줄어듭니다.',
  },
]

export const HOME_PROCESS_HEADING = '저장하고, 열고, 체크하면 끝나요'

export const HOME_PROCESS_STEPS = [
  {
    title: '여행 조건 입력하기',
    description: '가는 곳과 날짜, 여행 스타일에 맞게 정보를 입력해 주세요.',
  },
  {
    title: '체크리스트 받기',
    description: '체크메이트가 상황에 맞는 준비 목록을 만들어 드립니다.',
  },
  {
    title: '보관함에서 체크하기',
    description: '저장한 리스트를 열고 항목을 체크하며 출발 전까지 마무리해 보세요.',
  },
]

/** 홈 CTA 배너 — 나의 체크리스트(/trips/:id/guide-archive) 안내 (헤더와 동일 데모 tripId) */
export const HOME_CTA = {
  title: {
    line1: '저장해 둔 체크리스트,',
    line2: '나만의 체크리스트로 만들어요',
  },
  subtitle:
    '여행 준비할 때 골라 담은 목록이 모이는 보관함이에요. 리스트를 열고 항목을 체크하며 출발 전 준비를 마무리하고, 계획 중인 여행과 지난 일정을 한곳에서 관리해 보세요.',
  buttonLabel: '나의 체크리스트로',
  buttonTo: '/trips/1/guide-archive',
}

/** 랜딩 하단 캐치프레이즈 — 1행 카피 + 2행은 로고 + afterLogo (줄바꿈) */
export const HOME_CATCHPHRASE_DISPLAY = {
  line1: '빠짐없는 여행 준비,',
  afterLogo: '와 한곳에서 완성해 보세요.',
}

/** 히어로·푸터 등에 쓰는 짧은 브랜드 설명 (HomePage에서도 사용 가능) */
export const HOME_BRAND_TAGLINE =
  '저장부터 체크까지 이어지는 여행 준비. CHECKMATE가 동행합니다.'
