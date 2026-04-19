const PAGE_BG = {
  background: 'linear-gradient(180deg, #E0F7FA 0%, #F8FAFC 55%, #F0FDFA 100%)',
}

function MyPage() {
  return (
    <div className="flex min-h-full w-full flex-1 flex-col" style={PAGE_BG}>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-28 pt-6 md:hidden">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600">My page</p>
        <h1 className="mb-2 text-2xl font-extrabold text-gray-900">마이페이지</h1>
        <p className="text-sm leading-relaxed text-gray-600">
          프로필·계정·알림 설정을 한곳에서 관리할 수 있도록 준비 중입니다.{' '}
          <span className="text-gray-400">(UI 연동 예정)</span>
        </p>
      </div>

      <div className="mx-auto hidden w-full max-w-5xl flex-1 flex-col px-8 py-12 md:block">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-600">My page</p>
        <h1 className="mb-4 text-3xl font-extrabold text-gray-900">마이페이지</h1>
        <p className="max-w-xl text-base leading-relaxed text-gray-600">
          프로필·계정·알림 설정을 한곳에서 관리할 수 있도록 준비 중입니다. (UI 연동 예정)
        </p>
      </div>
    </div>
  )
}

export default MyPage
