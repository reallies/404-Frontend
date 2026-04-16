/**
 * IMAGES — 프로젝트 전체 이미지 URL 중앙 관리
 *
 * 모든 외부 이미지(Unsplash 등)는 이 파일에서만 선언하고
 * 각 페이지/컴포넌트는 여기서 import 하여 사용합니다.
 *
 * 추후 실제 CDN이나 로컬 asset으로 교체 시 이 파일만 수정하면 됩니다.
 */
export const IMAGES = {
  home: {
    heroDesktop:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=900&auto=format&fit=crop',
    heroSlides: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=900&auto=format&fit=crop',
    ],
    heroMobile:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=600&auto=format&fit=crop',
    product1:
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=400&auto=format&fit=crop',
    product2:
      'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?q=80&w=400&auto=format&fit=crop',
    /** 에디토리얼 섹션: 여행 준비·일정·체크 흐름 (홈 히어로와 톤 맞춤) */
    editorial1:
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=560&auto=format&fit=crop',
    editorial2:
      'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=560&auto=format&fit=crop',
  },

  tripNew: {
    passport:
      'https://images.unsplash.com/photo-1520637836993-5e545bde32ac?q=80&w=500&auto=format&fit=crop',
  },

  checklist: {
    weatherDanang:
      'https://images.unsplash.com/photo-1569700119023-e4d1af7f3c66?q=80&w=300&auto=format&fit=crop',
    destinationMap:
      'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=400&auto=format&fit=crop',
    mountainBanner:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop',
  },
}
