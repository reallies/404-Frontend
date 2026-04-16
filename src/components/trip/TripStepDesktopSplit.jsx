/**
 * Step3 / Step4 데스크톱 50:50 레이아웃.
 * - fullBleed: 화면 전체 민트→중앙 페이드 + 이미지/글로브 (필수)
 * - 우측 열: pointer-events 비활성 + AI 팁 등만 pointer-events-auto
 *
 * md 이상에서는 높이를 뷰포트에 고정하고 왼쪽만 스크롤합니다.
 * (폼이 길어질 때 배경 WebGL/이미지 영역이 세로로 늘어나 캔버스가 리사이즈되는 것을 방지)
 */
export default function TripStepDesktopSplit({ left, right, fullBleed }) {
  return (
    <div className="relative hidden md:block md:h-screen md:max-h-screen md:min-h-0 md:w-full md:overflow-hidden">
      {fullBleed}
      <div className="relative z-10 grid h-full min-h-0 w-full grid-cols-1 md:grid-cols-2">
        <div className="relative z-20 flex min-h-0 min-w-0 flex-col overflow-x-hidden md:col-start-1 md:h-full">
          <div className="relative z-20 flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-8 py-10 lg:px-10 xl:px-12">
            {left}
          </div>
        </div>
        <div className="relative z-20 min-h-0 min-w-0 md:col-start-2 md:h-full md:pointer-events-none">{right}</div>
      </div>
    </div>
  )
}
