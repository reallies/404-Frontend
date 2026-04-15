/**
 * AiPlannerFab — "AI 플래너에게 물어보기" 화면 고정 버튼 (FAB)
 *
 * 어떤 페이지에든 렌더링하면 화면 우측 하단에 항상 고정됩니다.
 * 스크롤과 무관하게 fixed position으로 표시됩니다.
 */
export default function AiPlannerFab() {
  return (
    <button
      aria-label="AI 플래너에게 물어보기"
      className="
        fixed bottom-6 right-6 md:bottom-8 md:right-8
        z-50
        bg-white/90 backdrop-blur-sm
        rounded-full px-5 py-3
        flex items-center gap-2
        shadow-xl hover:shadow-2xl hover:scale-105
        transition-all duration-200
      "
    >
      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-amber-600"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </div>
      <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
        AI 플래너에게 물어보기
      </span>
    </button>
  )
}
