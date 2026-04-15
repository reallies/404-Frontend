/**
 * AiConciergeTip — AI 컨시어지 팁 공용 컴포넌트
 *
 * Props:
 *   title        {string}  팁 제목
 *   description  {string}  팁 설명 (HTML 허용)
 *   className    {string}  추가 클래스
 */
export default function AiConciergeTip({ title, description, className = '' }) {
  return (
    <div className={`bg-teal-800 rounded-2xl px-8 py-6 flex items-center gap-6 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-teal-700/60 flex items-center justify-center flex-shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-amber-300"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-bold text-base mb-1">{title}</h4>
        <p
          className="text-teal-200 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </div>
    </div>
  )
}
