import { useNavigate } from 'react-router-dom'

/**
 * BackButton — 이전 페이지로 이동하는 공용 버튼
 *
 * Props:
 *   to        {string}  (optional) 특정 경로로 이동. 미지정 시 navigate(-1) 사용
 *   className {string}  (optional) 추가 클래스
 */
export default function BackButton({ to, className = '' }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (to) navigate(to)
    else navigate(-1)
  }

  return (
    <button
      onClick={handleClick}
      aria-label="이전 페이지로 이동"
      className={`
        flex items-center gap-1.5
        text-sm font-semibold text-gray-500
        hover:text-gray-800
        transition-colors duration-150
        ${className}
      `}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
      </svg>
      이전으로
    </button>
  )
}
