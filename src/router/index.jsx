import { useRoutes, Navigate } from 'react-router-dom'

import RootLayout from '@/layouts/RootLayout'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import TripNewStep2Page from '@/pages/TripNewStep2Page'
import TripNewDestinationPage from '@/pages/TripNewDestinationPage'
import TripNewStep3Page from '@/pages/TripNewStep3Page'
import TripNewStep4Page from '@/pages/TripNewStep4Page'
import TripNewStep5Page from '@/pages/TripNewStep5Page'
import TripLoadingPage from '@/pages/TripLoadingPage'
import TripSearchPage from '@/pages/TripSearchPage'
import TripGuideArchivePage from '@/pages/TripGuideArchivePage'
import TripGuideArchiveDetailPage from '@/pages/TripGuideArchiveDetailPage'
import TripChecklistPage from '@/pages/TripChecklistPage'
import NotFoundPage from '@/pages/NotFoundPage'
import MyPage from '@/pages/MyPage'
import ErrorPage from '@/pages/ErrorPage'

/**
 * AppRoutes - useRoutes 기반 라우터 설정 (03_decision_log.md 기반)
 *
 * 페이지 구조:
 *   /                       홈 / 랜딩
 *   /login                  로그인 · 회원가입
 *   /trips/new              → /trips/new/step2 리다이렉트 (TripNewPage 제거)
 *   /trips/new/step2~       새 여행 플로우 (/destination = 예매 전 도시·날짜)
 *   /trips/:id/search       준비 항목 탐색         (Store Loop - DRD-1)
 *   /trips/:id/guide-archive 저장 가이드 목록 → /guide-archive/:entryId 상세에서 준비물 체크
 *   /trips/:id/checklist    내 체크리스트          (Confirm Loop - DRD-2)
 *   *                       404 NotFound
 *
 * ⚠️ /search 와 /checklist 는 반드시 분리된 페이지로 유지
 *    동시 수행 시 이벤트 집계 노이즈 발생 (DRD-3 배제 사항 참고)
 *
 * 페이지 추가 시:
 *   1. pages/ 에 컴포넌트 생성
 *   2. 아래 routes 배열에 { path, element } 항목 추가
 *   3. 인증이 필요한 페이지는 ProtectedRoute로 감싸기
 */
const AppRoutes = () => {
  const routes = useRoutes([
    // Layout 적용 라우트
    {
      element: <RootLayout />,
      errorElement: <ErrorPage />,
      children: [
        { path: '/',                    element: <HomePage /> },
        { path: '/login',               element: <LoginPage /> },
        { path: '/signup',              element: <SignupPage /> },
        { path: '/mypage',              element: <MyPage /> },
        { path: '/trips/new',           element: <Navigate to="/trips/new/step2" replace /> },
        { path: '/trips/new/step2',     element: <TripNewStep2Page /> },
        { path: '/trips/new/destination', element: <TripNewDestinationPage /> },
        { path: '/trips/new/step3',     element: <TripNewStep3Page /> },
        /** Step4: 이 경로는 TripNewStep4Page 단 하나만 사용 (중복 라우트 없음) */
        { path: '/trips/new/step4',     element: <TripNewStep4Page /> },
        { path: '/trips/new/step5',     element: <TripNewStep5Page /> },
        { path: '/trips/:id/search',                  element: <TripSearchPage /> },
        { path: '/trips/:id/guide-archive/:entryId',  element: <TripGuideArchiveDetailPage /> },
        { path: '/trips/:id/guide-archive',           element: <TripGuideArchivePage /> },
        { path: '/trips/:id/checklist',     element: <TripChecklistPage /> },
        { path: '/404',                 element: <NotFoundPage /> },
      ],
    },

    // 로딩 페이지 - Header/Footer 없는 독립 풀스크린 (RootLayout 미적용)
    { path: '/trips/:id/loading', element: <TripLoadingPage /> },

    // Fallback - 정의되지 않은 URL → 404 페이지로 이동
    {
      path: '*',
      element: <Navigate to="/404" replace />,
    },
  ])

  return routes
}

export default AppRoutes
