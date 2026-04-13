import { Outlet } from 'react-router-dom'
import Header from '@/components/common/Header'

/**
 * RootLayout
 * - 모든 페이지에 공통으로 적용되는 최상위 레이아웃
 * - Header + 페이지 컨텐츠(Outlet) 구조
 */
function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default RootLayout
