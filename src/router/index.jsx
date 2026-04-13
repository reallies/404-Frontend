import { useRoutes, Navigate } from 'react-router-dom'

import RootLayout from '@/layouts/RootLayout'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import TripListPage from '@/pages/TripListPage'
import TripNewPage from '@/pages/TripNewPage'
import TripSearchPage from '@/pages/TripSearchPage'
import TripChecklistPage from '@/pages/TripChecklistPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ErrorPage from '@/pages/ErrorPage'

/**
 * AppRoutes - useRoutes 기반 라우터 설정 (03_decision_log.md 기반)
 *
 * 페이지 구조:
 *   /                       홈 / 랜딩
 *   /login                  로그인 · 회원가입
 *   /trips                  내 여행 목록          (Travel Fixed 관리)
 *   /trips/new              새 여행 만들기         (준비 시작 진입 구조 - DRD-3)
 *   /trips/:id/search       준비 항목 탐색         (Store Loop - DRD-1)
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
        { path: '/trips',               element: <TripListPage /> },
        { path: '/trips/new',           element: <TripNewPage /> },
        { path: '/trips/:id/search',    element: <TripSearchPage /> },
        { path: '/trips/:id/checklist', element: <TripChecklistPage /> },
        { path: '/404',                 element: <NotFoundPage /> },
      ],
    },

    // Fallback - 정의되지 않은 URL → 404 페이지로 이동
    {
      path: '*',
      element: <Navigate to="/404" replace />,
    },
  ])

  return routes
}

export default AppRoutes
