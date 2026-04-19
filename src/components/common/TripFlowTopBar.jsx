import BackButton from '@/components/common/BackButton'

export function TripFlowDesktopBar({ backTo, className = '' }) {
  return (
    <div className={`flex justify-end ${className}`}>
      <BackButton to={backTo} />
    </div>
  )
}

/**
 * 예전: 모바일 전용 상단바(뒤로·로고·프로필).
 * 현재: 모바일 상단은 전역 `Header`(로고·조건부 뒤로·햄버거)로 통일되어 여기서는 렌더하지 않습니다.
 * 호출부는 그대로 두어도 되며, 필요 시 다시 구현할 수 있습니다.
 */
export function TripFlowMobileBar(_props) {
  return null
}
