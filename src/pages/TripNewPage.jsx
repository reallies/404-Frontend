import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * TripNewPage - 새 여행 만들기 페이지
 *
 * 역할: 여행 조건 입력 (Travel Fixed → Store Loop 진입 구조)
 * 루프: Total Loop 진입 - "준비 시작 진입 구조" 핵심 페이지 (DRD-3)
 * 이벤트: travel_fixed (폼 제출 완료 시)
 *
 * 결정로그(03_decision_log.md) 근거:
 * - "여행이 확정된 이후 다시 탐색부터 시작해야 하는 마찰을 줄임"
 * - "초기 진입 행동을 바로 Store Loop로 유도"
 * - 구현 범위: 여행 조건 입력 UI (여행지, 일정 등 필터)
 */
function TripNewPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    companions: 'solo',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: API 연동 후 여행 생성 + travel_fixed 이벤트 수집
    // 임시로 ID 1로 탐색 페이지 이동
    navigate('/trips/1/search')
  }

  const isValid = form.destination && form.startDate && form.endDate

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-8">
        <button
          onClick={() => navigate('/trips')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          ← 내 여행으로
        </button>
        <h1 className="text-2xl font-bold text-gray-900">새 여행 만들기</h1>
        <p className="mt-1 text-sm text-gray-500">
          여행 조건을 입력하면 맞춤 준비 항목을 찾아드려요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
            여행지 <span className="text-red-500">*</span>
          </label>
          <input
            id="destination"
            name="destination"
            type="text"
            value={form.destination}
            onChange={handleChange}
            placeholder="예) 일본 도쿄, 태국 방콕"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              출발일 <span className="text-red-500">*</span>
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              귀국일 <span className="text-red-500">*</span>
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              required
              min={form.startDate}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="companions" className="block text-sm font-medium text-gray-700 mb-1">
            동행 유형
          </label>
          <select
            id="companions"
            name="companions"
            value={form.companions}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="solo">혼자</option>
            <option value="couple">커플</option>
            <option value="family">가족</option>
            <option value="friends">친구</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!isValid}
          className="w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          준비 항목 찾기 →
        </button>
      </form>
    </div>
  )
}

export default TripNewPage
