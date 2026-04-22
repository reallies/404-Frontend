import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  loadSavedItems,
  patchSavedItemContent,
  removeSavedItem,
  saveItemForTrip,
  setSavedItemChecked,
} from '@/utils/savedTripItems'
import { patchGuideArchiveEntry } from '@/utils/guideArchiveStorage'
import { deselectChecklistItem } from '@/api/checklists'
import { buildGuideArchiveDateLine, buildGuideArchiveListTitle } from '@/utils/guideArchivePresentation'
import GuideArchiveProgressBar from '@/components/guide/GuideArchiveProgressBar'
import {
  loadEntryChecklistChecks,
  saveEntryChecklistChecks,
  seedEntryChecksFromSavedIfEmpty,
} from '@/utils/guideArchiveEntryChecklistStorage'
import {
  BAGGAGE_CARRY_ON,
  BAGGAGE_SECTION_LABEL,
  BAGGAGE_SECTION_ORDER,
  GUIDE_USER_DIRECT_CATEGORY,
  GUIDE_USER_DIRECT_SECTION_LABEL,
  resolveBaggageSection,
} from '@/utils/guideArchiveBaggage'

/**
 * 가이드 보관함 상세 — 이 여행 스냅샷에 담긴 필수품을 하나씩 체크하며 준비합니다.
 * 체크 상태는 entry 단위로 저장되며, 같은 trip에 다른 여행지 목록이 있어도 섞이지 않습니다.
 * 화면에서의 체크/해제는 메모리만 바꾸고, **저장 → 확인**을 눌렀을 때만 스토리지에 반영합니다(뒤로가기 시 폐기).
 * 준비물 **삭제**(선택 삭제)는 스토리지에 즉시 반영됩니다. 보관함에서 빠진 항목 id는 탐색 저장(`savedTripItems`)에서도 제거합니다.
 * **선택메뉴**로 관리 모드 진입 후, 같은 카테고리(섹션) 항목을 체크하고 「수정」을 누르면 **선택한 항목만** 편집 모달에 표시·저장됩니다.
 * **직접 추가**: 선택메뉴에서 항목을 저장하면 **기내 반입**으로 분류되어 본문 **맨 아래** `직접 추가` 블록에 붙습니다(상단 필터 반영).
 * `onArchiveMutated`: 삭제·섹션 저장 후 부모가 스토리지에서 entry를 다시 읽을 때 호출합니다.
 */
export default function GuideArchiveChecklistView({ tripId, entry, onArchiveMutated }) {
  const navigate = useNavigate()
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)
  const [manageMode, setManageMode] = useState(false)
  const [sectionEditModalOpen, setSectionEditModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [sectionEditDraft, setSectionEditDraft] = useState(null)
  const [directAddModalOpen, setDirectAddModalOpen] = useState(false)
  const [directAddDraft, setDirectAddDraft] = useState({
    title: '',
    description: '',
    detail: '',
  })
  const [selectedItemIdsForDelete, setSelectedItemIdsForDelete] = useState([])
  /** 'all' | carry_on | checked — 상단 「카테고리별 선택」에서 수하물 구간만 고름 */
  const [filterBaggage, setFilterBaggage] = useState('all')
  const items = entry.items ?? []
  const [checks, setChecks] = useState(() => loadEntryChecklistChecks(tripId, entry.id))

  const archiveItemsFingerprint = useMemo(
    () => [...items.map((it) => String(it.id))].sort().join('|'),
    [items],
  )

  useEffect(() => {
    seedEntryChecksFromSavedIfEmpty(tripId, entry.id, loadSavedItems(tripId), items)
    setChecks(loadEntryChecklistChecks(tripId, entry.id))
  }, [tripId, entry.id, archiveItemsFingerprint, items])

  const exitManageMode = useCallback(() => {
    setManageMode(false)
    setSectionEditModalOpen(false)
    setEditingSection(null)
    setSectionEditDraft(null)
    setDirectAddModalOpen(false)
    setDirectAddDraft({
      title: '',
      description: '',
      detail: '',
    })
    setSelectedItemIdsForDelete([])
  }, [])

  useEffect(() => {
    if (items.length === 0) {
      exitManageMode()
    }
  }, [items.length, exitManageMode])

  /** 항목이 있는 수하물 구간만 탭으로 노출 */
  const baggageFilterTabs = useMemo(() => {
    const present = new Set()
    for (const it of items) {
      present.add(resolveBaggageSection(it))
    }
    const tabs = [{ value: 'all', label: '전체' }]
    for (const key of BAGGAGE_SECTION_ORDER) {
      if (present.has(key)) {
        tabs.push({ value: key, label: BAGGAGE_SECTION_LABEL[key] })
      }
    }
    return tabs
  }, [items])

  useEffect(() => {
    if (filterBaggage === 'all') return
    const ok = baggageFilterTabs.some((t) => t.value === filterBaggage)
    if (!ok) setFilterBaggage('all')
  }, [baggageFilterTabs, filterBaggage])

  /** 수하물 구역(기내/위탁) → 카테고리 값 단위 소그룹(필터용 value 보존) */
  const sectionsByBaggage = useMemo(() => {
    return BAGGAGE_SECTION_ORDER.map((bagKey) => {
      const catMap = new Map()
      for (const it of items) {
        if (resolveBaggageSection(it) !== bagKey) continue
        const categoryValue = it.category ?? '_misc'
        if (categoryValue === GUIDE_USER_DIRECT_CATEGORY) continue
        const categoryLabel = it.categoryLabel || it.category || '준비물'
        if (!catMap.has(categoryValue)) {
          catMap.set(categoryValue, { label: categoryLabel, list: [] })
        }
        catMap.get(categoryValue).list.push(it)
      }
      const grouped = Array.from(catMap.entries()).map(([categoryValue, { label, list }]) => ({
        categoryValue,
        categoryLabel: label,
        items: list,
      }))
      return {
        bagKey,
        bagTitle: BAGGAGE_SECTION_LABEL[bagKey],
        grouped,
      }
    }).filter((s) => s.grouped.length > 0)
  }, [items])

  const visibleSectionsByBaggage = useMemo(() => {
    if (filterBaggage === 'all') return sectionsByBaggage
    return sectionsByBaggage.filter((s) => s.bagKey === filterBaggage)
  }, [sectionsByBaggage, filterBaggage])

  /** 「직접 추가」는 수하물 블록 밖 페이지 최하단에만 표시 (필터 반영) */
  const directAddSectionItems = useMemo(() => {
    const out = []
    for (const it of items) {
      if ((it.category ?? '_misc') !== GUIDE_USER_DIRECT_CATEGORY) continue
      const bag = resolveBaggageSection(it)
      if (filterBaggage !== 'all' && bag !== filterBaggage) continue
      out.push(it)
    }
    return out
  }, [items, filterBaggage])

  /** 현재 필터에서 편집 가능한 카테고리 섹션이 1개 이상인지 */
  const hasEditableSection = useMemo(
    () =>
      visibleSectionsByBaggage.some((s) => s.grouped.length > 0) || directAddSectionItems.length > 0,
    [visibleSectionsByBaggage, directAddSectionItems],
  )

  const total = items.length
  const checkedCount = useMemo(() => items.filter((it) => checks[String(it.id)]).length, [items, checks])
  const progress = total > 0 ? Math.round((checkedCount / total) * 100) : 0

  const handleToggle = useCallback((itemId) => {
    const id = String(itemId)
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const toggleItemSelectForDelete = useCallback((itemId) => {
    const id = String(itemId)
    setSelectedItemIdsForDelete((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const enterManageMode = useCallback(() => {
    setManageMode(true)
    setSectionEditModalOpen(false)
    setEditingSection(null)
    setSectionEditDraft(null)
    setDirectAddModalOpen(false)
    setDirectAddDraft({
      title: '',
      description: '',
      detail: '',
    })
    setSelectedItemIdsForDelete([])
  }, [])

  const openDirectAddModal = useCallback(() => {
    setDirectAddDraft({
      title: '',
      description: '',
      detail: '',
    })
    setDirectAddModalOpen(true)
  }, [])

  const cancelDirectAdd = useCallback(() => {
    setDirectAddModalOpen(false)
    setDirectAddDraft({
      title: '',
      description: '',
      detail: '',
    })
  }, [])

  const submitDirectAdd = useCallback(() => {
    const title = (directAddDraft.title ?? '').trim()
    if (!title) {
      window.alert('제목을 입력해 주세요.')
      return
    }
    const description = (directAddDraft.description ?? '').trim()
    const detail = (directAddDraft.detail ?? '').trim()
    const id = `ga-direct-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const newItem = {
      id,
      category: GUIDE_USER_DIRECT_CATEGORY,
      categoryLabel: GUIDE_USER_DIRECT_SECTION_LABEL,
      title,
      description,
      detail,
      baggageType: BAGGAGE_CARRY_ON,
    }
    const newItems = [...items, newItem]
    const idStr = String(id)
    const nextChecks = { ...checks, [idStr]: false }
    const totalN = newItems.length
    const checkedN = newItems.filter((it) => nextChecks[String(it.id)]).length
    const progressN = totalN > 0 ? Math.round((checkedN / totalN) * 100) : 0
    saveEntryChecklistChecks(tripId, entry.id, nextChecks)
    patchGuideArchiveEntry(tripId, entry.id, {
      items: newItems,
      checklistProgressPercent: progressN,
      checklistSavedAt: new Date().toISOString(),
    })
    const subtitle =
      [detail, description].filter(Boolean).join(' — ') || title
    saveItemForTrip(tripId, {
      id,
      category: GUIDE_USER_DIRECT_SECTION_LABEL,
      title,
      subtitle,
    })
    setChecks(nextChecks)
    setDirectAddModalOpen(false)
    setDirectAddDraft({
      title: '',
      description: '',
      detail: '',
    })
    onArchiveMutated?.()
  }, [directAddDraft, items, checks, tripId, entry.id, onArchiveMutated])

  /** 관리 모드에서 체크한 항목만 모달에 넣는다. 서로 다른 섹션이 섞이면 안내 후 중단 */
  const openEditFromManageSelection = useCallback(() => {
    if (selectedItemIdsForDelete.length === 0) return
    const idSet = new Set(selectedItemIdsForDelete.map(String))
    const selectedItems = items.filter((it) => idSet.has(String(it.id)))
    if (selectedItems.length === 0) return

    const first = selectedItems[0]
    const bagKey = resolveBaggageSection(first)
    const categoryValue = first.category ?? '_misc'
    const sameSection = selectedItems.every(
      (it) => resolveBaggageSection(it) === bagKey && (it.category ?? '_misc') === categoryValue,
    )
    if (!sameSection) {
      window.alert('수정하려면 같은 카테고리(섹션)에 속한 항목만 선택해 주세요.')
      return
    }

    const categoryLabel = first.categoryLabel || first.category || '준비물'
    setEditingSection({ bagKey, categoryValue })
    setSectionEditDraft({
      categoryLabel: categoryLabel ?? '',
      rows: selectedItems.map((it) => ({
        id: it.id,
        title: it.title ?? '',
        description: it.description ?? '',
        detail: it.detail ?? '',
      })),
    })
    setSectionEditModalOpen(true)
  }, [selectedItemIdsForDelete, items])

  const cancelSectionEditor = useCallback(() => {
    setSectionEditModalOpen(false)
    setEditingSection(null)
    setSectionEditDraft(null)
  }, [])

  const persistItemsAndChecks = useCallback(
    (newItems, nextChecks) => {
      const nextIds = new Set(newItems.map((it) => String(it.id)))
      for (const it of items) {
        const id = String(it.id)
        if (nextIds.has(id)) continue
        removeSavedItem(tripId, id)
        // 서버 ChecklistItem.is_selected 플래그도 되돌린다 (fire-and-forget).
        // serverId 가 없으면 (목데이터 / context 기반 생성 / 레거시 snapshot) 호출을 건너뛴다.
        const serverId = it.serverId
        if (serverId && String(serverId).trim()) {
          deselectChecklistItem(serverId).catch((err) => {
            console.warn(
              `[GuideArchiveChecklistView] deselectChecklistItem(${serverId}) 실패 — localStorage 삭제는 완료:`,
              err?.response?.data?.message || err?.message || err,
            )
          })
        }
      }
      const totalN = newItems.length
      const checkedN = newItems.filter((it) => nextChecks[String(it.id)]).length
      const progressN = totalN > 0 ? Math.round((checkedN / totalN) * 100) : 0
      saveEntryChecklistChecks(tripId, entry.id, nextChecks)
      patchGuideArchiveEntry(tripId, entry.id, {
        items: newItems,
        checklistProgressPercent: progressN,
        checklistSavedAt: new Date().toISOString(),
      })
      setChecks(nextChecks)
      exitManageMode()
      onArchiveMutated?.()
    },
    [tripId, entry.id, items, exitManageMode, onArchiveMutated],
  )

  const saveSectionEdit = useCallback(() => {
    if (!editingSection || !sectionEditDraft) return
    const { bagKey, categoryValue } = editingSection
    const rowById = new Map(sectionEditDraft.rows.map((r) => [String(r.id), r]))
    const newItems = items.map((it) => {
      const id = String(it.id)
      const row = rowById.get(id)
      if (!row) return it
      if (resolveBaggageSection(it) !== bagKey || (it.category ?? '_misc') !== categoryValue) return it
      return {
        ...it,
        title: (row.title ?? '').trim() || it.title,
        description: (row.description ?? '').trim(),
        detail: (row.detail ?? '').trim(),
      }
    })
    const totalN = newItems.length
    const checkedN = newItems.filter((it) => checks[String(it.id)]).length
    const progressN = totalN > 0 ? Math.round((checkedN / totalN) * 100) : 0
    saveEntryChecklistChecks(tripId, entry.id, checks)
    patchGuideArchiveEntry(tripId, entry.id, {
      items: newItems,
      checklistProgressPercent: progressN,
      checklistSavedAt: new Date().toISOString(),
    })
    for (const r of sectionEditDraft.rows) {
      const id = String(r.id)
      const sub =
        [(r.detail ?? '').trim(), (r.description ?? '').trim()].filter(Boolean).join(' — ') ||
        (r.title ?? '').trim()
      patchSavedItemContent(tripId, id, {
        title: (r.title ?? '').trim(),
        subtitle: sub,
      })
    }
    setSectionEditModalOpen(false)
    setEditingSection(null)
    setSectionEditDraft(null)
    setManageMode(false)
    onArchiveMutated?.()
  }, [editingSection, sectionEditDraft, items, tripId, entry.id, checks, onArchiveMutated])

  const handleDeleteSelectedItems = useCallback(() => {
    if (selectedItemIdsForDelete.length === 0) return
    if (
      !window.confirm(
        `선택한 ${selectedItemIdsForDelete.length}개 필수품을 이 체크리스트에서 삭제할까요? 되돌릴 수 없습니다.`,
      )
    ) {
      return
    }
    const drop = new Set(selectedItemIdsForDelete)
    const newItems = items.filter((it) => !drop.has(String(it.id)))
    const nextChecks = {}
    for (const it of newItems) {
      const id = String(it.id)
      nextChecks[id] = Boolean(checks[id])
    }
    persistItemsAndChecks(newItems, nextChecks)
  }, [selectedItemIdsForDelete, items, checks, persistItemsAndChecks])

  const performSave = useCallback(() => {
    const persisted = {}
    for (const it of items) {
      const id = String(it.id)
      persisted[id] = Boolean(checks[id])
    }
    saveEntryChecklistChecks(tripId, entry.id, persisted)
    for (const it of items) {
      setSavedItemChecked(tripId, String(it.id), Boolean(checks[String(it.id)]))
    }
    patchGuideArchiveEntry(tripId, entry.id, {
      checklistProgressPercent: progress,
      checklistSavedAt: new Date().toISOString(),
    })
    window.dispatchEvent(
      new CustomEvent('guide-archive-checklist-saved', {
        detail: { tripId: String(tripId), entryId: String(entry.id), progress },
      }),
    )
    setSaveConfirmOpen(false)
    navigate(`/trips/${tripId}/guide-archive`)
  }, [tripId, entry.id, items, checks, progress, navigate])

  const handleBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  useEffect(() => {
    if (!saveConfirmOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setSaveConfirmOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saveConfirmOpen])

  const title = buildGuideArchiveListTitle(entry)
  const dateLine = buildGuideArchiveDateLine(entry)

  /** 항목 체크박스로 「삭제 대상」 고를 때만 true */
  const deleteSelectMode = manageMode && !sectionEditModalOpen && !directAddModalOpen

  useEffect(() => {
    if (!sectionEditModalOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') cancelSectionEditor()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sectionEditModalOpen, cancelSectionEditor])

  useEffect(() => {
    if (!directAddModalOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') cancelDirectAdd()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [directAddModalOpen, cancelDirectAdd])

  const bottomBar = (
    <div
      className="fixed bottom-16 left-0 right-0 z-40 bg-transparent px-5 py-3 md:bottom-0 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-3xl gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="min-w-0 flex-1 basis-0 rounded-2xl border-2 border-gray-100 bg-white/95 px-4 py-3.5 text-sm font-bold text-gray-800 shadow-sm transition-colors hover:bg-cyan-50/80"
        >
          뒤로가기
        </button>
        <button
          type="button"
          onClick={() => setSaveConfirmOpen(true)}
          className="min-w-0 flex-1 basis-0 rounded-2xl bg-amber-400 px-4 py-3.5 text-sm font-bold text-gray-900 shadow-sm transition-all hover:bg-amber-500 hover:shadow-md active:scale-[0.98]"
        >
          저장
        </button>
      </div>
    </div>
  )

  const saveConfirmModal = saveConfirmOpen ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="presentation"
      onClick={() => setSaveConfirmOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-archive-save-confirm-title"
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="guide-archive-save-confirm-title" className="mb-8 text-center text-base font-bold leading-snug text-gray-900">
          저장하시겠습니까?
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={performSave}
            className="min-h-12 flex-1 rounded-2xl bg-amber-400 py-3 text-sm font-bold text-gray-900 shadow-sm transition-all hover:bg-amber-500 hover:shadow-md"
          >
            확인
          </button>
          <button
            type="button"
            onClick={() => setSaveConfirmOpen(false)}
            className="min-h-12 flex-1 rounded-2xl border-2 border-gray-200 bg-white py-3 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  ) : null

  if (total === 0) {
    return (
      <>
        {saveConfirmModal}
        <div className="mx-auto max-w-2xl px-5 pb-36 pt-10 text-center md:px-4 md:pb-28">
          <p className="text-lg font-bold text-gray-900">담긴 준비물이 없습니다</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            맞춤 여행 준비 탐색에서 필요한 항목을 저장하면 여기에서 하나씩 체크할 수 있어요.
          </p>
          <Link
            to={`/trips/${tripId}/search`}
            className="mt-6 inline-flex rounded-2xl bg-amber-400 px-6 py-3 text-sm font-bold text-gray-900 shadow-sm transition-all hover:bg-amber-500 hover:shadow-md active:scale-[0.98]"
          >
            준비물 검색하러 가기
          </Link>
        </div>
        {bottomBar}
      </>
    )
  }

  return (
    <>
      {saveConfirmModal}
      <div className="mx-auto max-w-3xl px-5 pb-36 pt-5 md:px-4 md:pb-28 md:pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold leading-snug tracking-tight text-gray-900 md:text-3xl">{title}</h1>
        <p className="mt-2 flex items-center gap-2 text-base font-semibold text-gray-700 md:text-lg">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-teal-600 md:h-2.5 md:w-2.5" aria-hidden />
          {dateLine}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          골라 저장한 체크리스트로 필수품을 빠짐없이 챙겨보세요!
        </p>
      </header>

      <div className="sticky top-0 z-20 -mx-5 mb-6 border-b border-slate-100/90 bg-white px-5 py-3 backdrop-blur-sm md:static md:mx-0 md:rounded-xl md:border md:border-slate-100 md:bg-white md:px-5 md:py-4 md:shadow-sm">
        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-semibold text-slate-600">
          <span>
            준비 진행도{' '}
            <span className="tabular-nums text-slate-800">
              {checkedCount} / {total}
            </span>
          </span>
          <span className="tabular-nums text-slate-800">{progress}%</span>
        </div>
        <GuideArchiveProgressBar value={progress} />
      </div>

      <section className="mb-8" aria-label="수하물 구간 필터">
        <h2 className="mb-3 text-lg font-extrabold text-gray-900">카테고리별 선택</h2>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {baggageFilterTabs.map((tab) => {
            const selected = filterBaggage === tab.value
            const tabClass = selected
              ? 'border-2 border-sky-600 bg-sky-600 text-white shadow-md shadow-sky-900/15'
              : 'border-2 border-sky-100 bg-white text-slate-600 shadow-sm hover:border-sky-200 hover:bg-sky-50'
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilterBaggage(tab.value)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${tabClass}`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </section>

      <div className="mb-6 flex w-full max-w-full flex-wrap items-center justify-end gap-2 gap-y-3">
        {!manageMode ? (
          <button
            type="button"
            onClick={enterManageMode}
            className="shrink-0 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-bold text-sky-800 shadow-sm transition-colors hover:bg-sky-50"
          >
            선택메뉴
          </button>
        ) : sectionEditModalOpen ? (
          <p className="max-w-[min(100%,18rem)] text-right text-sm text-gray-500">
            수정 창을 닫은 뒤 다른 섹션을 선택할 수 있어요.
          </p>
        ) : directAddModalOpen ? (
          <p className="max-w-[min(100%,18rem)] text-right text-sm text-gray-500">
            직접 추가 창을 닫으면 다시 메뉴를 사용할 수 있어요.
          </p>
        ) : (
          <>
            <Link
              to={`/trips/${tripId}/search?archiveEntry=${encodeURIComponent(entry.id)}`}
              className="inline-flex shrink-0 items-center rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition-all hover:bg-amber-500 hover:shadow-md active:scale-[0.98]"
            >
              필수품 추가
            </Link>
            <button
              type="button"
              onClick={openDirectAddModal}
              className="shrink-0 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-bold text-teal-900 shadow-sm transition-colors hover:bg-teal-100/90"
            >
              직접 추가
            </button>
            <button
              type="button"
              onClick={handleDeleteSelectedItems}
              disabled={selectedItemIdsForDelete.length === 0}
              className="shrink-0 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-800 shadow-sm transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              삭제
            </button>
            <button
              type="button"
              onClick={openEditFromManageSelection}
              disabled={!hasEditableSection || selectedItemIdsForDelete.length === 0}
              className="shrink-0 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-bold text-sky-800 shadow-sm transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              수정
            </button>
            <button
              type="button"
              onClick={exitManageMode}
              className="shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              닫기
            </button>
          </>
        )}
      </div>

      <div className="space-y-10">
        {visibleSectionsByBaggage.map(({ bagKey, bagTitle, grouped }) => (
          <div key={bagKey} className="space-y-6">
            <h2 className="border-b border-teal-100/90 pb-2 text-base font-extrabold tracking-tight text-[#0a3d3d]">
              {bagTitle}
            </h2>
            <div className="space-y-8">
              {grouped.map(({ categoryValue, categoryLabel, items: list }) => {
                return (
                  <section key={`${bagKey}-${categoryValue}`} className="rounded-xl transition">
                    <>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                        {categoryLabel}
                      </h3>
                      <ul className="space-y-2">
                          {list.map((it) => {
                            const id = String(it.id)
                            const on = Boolean(checks[id])
                            const showCheckedStyle = !deleteSelectMode && on
                            const isDelSelected = selectedItemIdsForDelete.includes(id)
                            return (
                              <li key={id}>
                                <label
                                  className={`flex cursor-pointer gap-3 rounded-2xl border-2 px-4 py-3.5 transition-all duration-200 ${
                                    deleteSelectMode
                                      ? isDelSelected
                                        ? 'border-teal-400 bg-cyan-50/95 shadow-sm ring-2 ring-teal-500 ring-offset-2'
                                        : 'border-gray-100 bg-white/95 shadow-sm hover:bg-cyan-50/80'
                                      : on
                                        ? 'border-amber-400 bg-amber-200/95 shadow-sm ring-1 ring-amber-300/70'
                                        : 'border-gray-100 bg-white/95 shadow-sm hover:bg-cyan-50/80'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={deleteSelectMode ? isDelSelected : on}
                                    onChange={() =>
                                      deleteSelectMode ? toggleItemSelectForDelete(it.id) : handleToggle(it.id)
                                    }
                                    aria-label={
                                      deleteSelectMode ? `삭제 대상 ${isDelSelected ? '해제' : '선택'}` : undefined
                                    }
                                    className={`mt-1 h-5 w-5 shrink-0 rounded border-gray-300 ${deleteSelectMode ? 'accent-teal-600' : 'accent-amber-600'}`}
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span
                                      className={`block text-sm font-extrabold ${
                                        showCheckedStyle
                                          ? 'text-gray-900 line-through decoration-amber-700/45'
                                          : 'text-gray-900'
                                      }`}
                                    >
                                      {it.title}
                                    </span>
                                    {it.description ? (
                                      <span
                                        className={`mt-1 block text-xs leading-relaxed ${showCheckedStyle ? 'text-gray-700' : 'text-gray-600'}`}
                                      >
                                        {it.description}
                                      </span>
                                    ) : null}
                                    {it.detail ? (
                                      <span
                                        className={`mt-2 block border-l-2 pl-2 text-xs leading-relaxed ${
                                          showCheckedStyle
                                            ? 'border-amber-300 text-gray-700'
                                            : 'border-cyan-200 text-gray-500'
                                        }`}
                                      >
                                        {it.detail}
                                      </span>
                                    ) : null}
                                  </span>
                                </label>
                              </li>
                            )
                          })}
                        </ul>
                    </>
                  </section>
                )
              })}
            </div>
          </div>
        ))}
        {directAddSectionItems.length > 0 ? (
          <div className="mt-10 space-y-6">
            <h2 className="border-b border-teal-100/90 pb-2 text-base font-extrabold tracking-tight text-[#0a3d3d]">
              {GUIDE_USER_DIRECT_SECTION_LABEL}
            </h2>
            <ul className="space-y-2">
              {directAddSectionItems.map((it) => {
                const id = String(it.id)
                const on = Boolean(checks[id])
                const showCheckedStyle = !deleteSelectMode && on
                const isDelSelected = selectedItemIdsForDelete.includes(id)
                return (
                  <li key={id}>
                    <label
                      className={`flex cursor-pointer gap-3 rounded-2xl border-2 px-4 py-3.5 transition-all duration-200 ${
                        deleteSelectMode
                          ? isDelSelected
                            ? 'border-teal-400 bg-cyan-50/95 shadow-sm ring-2 ring-teal-500 ring-offset-2'
                            : 'border-gray-100 bg-white/95 shadow-sm hover:bg-cyan-50/80'
                          : on
                            ? 'border-amber-400 bg-amber-200/95 shadow-sm ring-1 ring-amber-300/70'
                            : 'border-gray-100 bg-white/95 shadow-sm hover:bg-cyan-50/80'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={deleteSelectMode ? isDelSelected : on}
                        onChange={() =>
                          deleteSelectMode ? toggleItemSelectForDelete(it.id) : handleToggle(it.id)
                        }
                        aria-label={
                          deleteSelectMode ? `삭제 대상 ${isDelSelected ? '해제' : '선택'}` : undefined
                        }
                        className={`mt-1 h-5 w-5 shrink-0 rounded border-gray-300 ${deleteSelectMode ? 'accent-teal-600' : 'accent-amber-600'}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm font-extrabold ${
                            showCheckedStyle
                              ? 'text-gray-900 line-through decoration-amber-700/45'
                              : 'text-gray-900'
                          }`}
                        >
                          {it.title}
                        </span>
                        {it.description ? (
                          <span
                            className={`mt-1 block text-xs leading-relaxed ${showCheckedStyle ? 'text-gray-700' : 'text-gray-600'}`}
                          >
                            {it.description}
                          </span>
                        ) : null}
                        {it.detail ? (
                          <span
                            className={`mt-2 block border-l-2 pl-2 text-xs leading-relaxed ${
                              showCheckedStyle
                                ? 'border-amber-300 text-gray-700'
                                : 'border-cyan-200 text-gray-500'
                            }`}
                          >
                            {it.detail}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </div>
      </div>

      {sectionEditModalOpen && sectionEditDraft ? (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={cancelSectionEditor}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-archive-section-edit-title"
            className="max-h-[min(90dvh,720px)] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-h-[85vh] sm:rounded-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="guide-archive-section-edit-title"
              className="mb-4 text-lg font-extrabold text-[#0a3d3d]"
            >
              섹션 수정
            </h2>
            <div className="mb-4">
              <p id="guide-archive-section-name-label" className="mb-1 text-xs font-bold text-gray-600">
                섹션 이름
              </p>
              <p
                aria-labelledby="guide-archive-section-name-label"
                className="rounded-xl border border-gray-100 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gray-900"
              >
                {sectionEditDraft.categoryLabel || '—'}
              </p>
            </div>
            <div className="space-y-4">
              {sectionEditDraft.rows.map((row, rowIdx) => (
                <div
                  key={String(row.id)}
                  className="rounded-xl border border-gray-100 bg-slate-50/80 p-3 shadow-sm"
                >
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    항목 {rowIdx + 1}
                  </p>
                  <label className="mb-2 block">
                    <span className="mb-0.5 block text-xs font-semibold text-gray-600">제목</span>
                    <input
                      type="text"
                      value={row.title}
                      onChange={(e) =>
                        setSectionEditDraft((d) => {
                          if (!d) return d
                          const rows = d.rows.map((r, i) =>
                            i === rowIdx ? { ...r, title: e.target.value } : r,
                          )
                          return { ...d, rows }
                        })
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                    />
                  </label>
                  <label className="mb-2 block">
                    <span className="mb-0.5 block text-xs font-semibold text-gray-600">설명</span>
                    <textarea
                      value={row.description}
                      onChange={(e) =>
                        setSectionEditDraft((d) => {
                          if (!d) return d
                          const rows = d.rows.map((r, i) =>
                            i === rowIdx ? { ...r, description: e.target.value } : r,
                          )
                          return { ...d, rows }
                        })
                      }
                      rows={2}
                      className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-0.5 block text-xs font-semibold text-gray-600">추가 메모</span>
                    <textarea
                      value={row.detail}
                      onChange={(e) =>
                        setSectionEditDraft((d) => {
                          if (!d) return d
                          const rows = d.rows.map((r, i) =>
                            i === rowIdx ? { ...r, detail: e.target.value } : r,
                          )
                          return { ...d, rows }
                        })
                      }
                      rows={2}
                      className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                    />
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={saveSectionEdit}
                className="min-h-12 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-sky-700 sm:min-h-0 sm:px-5"
              >
                이 섹션 저장
              </button>
              <button
                type="button"
                onClick={cancelSectionEditor}
                className="min-h-12 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50 sm:min-h-0 sm:px-5"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {directAddModalOpen ? (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={cancelDirectAdd}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-archive-direct-add-title"
            className="max-h-[min(90dvh,640px)] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-h-[85vh] sm:rounded-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="guide-archive-direct-add-title"
              className="mb-4 text-lg font-extrabold text-[#0a3d3d]"
            >
              직접 추가
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              제목은 필수입니다. 항목은 <strong className="font-semibold text-gray-800">기내 반입</strong>으로
              저장되며, 체크리스트 본문 맨 아래 「{GUIDE_USER_DIRECT_SECTION_LABEL}」 블록(구역 제목과 같은 스타일)에
              붙습니다.
            </p>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-semibold text-gray-600">제목 (필수)</span>
              <input
                type="text"
                value={directAddDraft.title}
                onChange={(e) => setDirectAddDraft((d) => ({ ...d, title: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                placeholder="예: 보조배터리"
              />
            </label>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-semibold text-gray-600">설명</span>
              <textarea
                value={directAddDraft.description}
                onChange={(e) => setDirectAddDraft((d) => ({ ...d, description: e.target.value }))}
                rows={2}
                className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
              />
            </label>
            <label className="mb-6 block">
              <span className="mb-1 block text-xs font-semibold text-gray-600">추가 메모</span>
              <textarea
                value={directAddDraft.detail}
                onChange={(e) => setDirectAddDraft((d) => ({ ...d, detail: e.target.value }))}
                rows={2}
                className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={submitDirectAdd}
                className="min-h-12 rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-700 sm:min-h-0 sm:px-5"
              >
                추가
              </button>
              <button
                type="button"
                onClick={cancelDirectAdd}
                className="min-h-12 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50 sm:min-h-0 sm:px-5"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bottomBar}
    </>
  )
}
