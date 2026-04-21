import { useNavigate } from 'react-router-dom'

/**
 * BackButton — 이전 페이지로 이동하는 공용 버튼
 *
 * Props:
 *   to        {string}  (optional) 특정 경로로 이동. 미지정 시 navigate(-1) 사용
 *   className {string}  (optional) 추가 클래스
 *   iconOnly  {boolean} true면 화살표만 표시 (모바일 컴팩트 바 등)
 *   showIcon  {boolean} false면 텍스트만 (`iconOnly`일 땐 무시하고 아이콘 유지)
 *   label     {string}  (optional) `iconOnly`가 아닐 때 버튼 텍스트. 기본 `이전으로`
 *   ariaLabel {string}  (optional) 접근성 이름. 미지정 시 `to`·히스토리에 따라 기본 문구
 */
export default function BackButton({
  to,
  className = '',
  iconOnly = false,
  showIcon = true,
  label = '이전으로',
  ariaLabel,
}) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (to) navigate(to)
    else navigate(-1)
  }

  const resolvedAria =
    ariaLabel ?? (!to ? '이전 페이지로 이동' : to === '/' ? '홈으로 이동' : '페이지로 이동')

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={resolvedAria}
      className={`
        flex items-center gap-1.5
        ${iconOnly ? 'justify-center rounded-xl p-2.5 text-gray-700 hover:bg-black/5 active:bg-black/10' : 'text-sm font-semibold text-gray-500 hover:text-gray-800'}
        transition-colors duration-150
        ${className}
      `}
    >
      {(iconOnly || showIcon) && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={iconOnly ? 'w-5 h-5' : 'w-4 h-4'}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      )}
      {!iconOnly && label}
    </button>
  )
}
