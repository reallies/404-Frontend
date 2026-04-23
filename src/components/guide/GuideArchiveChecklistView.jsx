import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  loadSavedItems,
  patchSavedItemContent,
  removeSavedItem,
  saveItemForTrip,
  setSavedItemChecked,
} from '@/utils/savedTripItems'
import { patchGuideArchiveEntry } from '@/utils/guideArchiveStorage'
import { deselectChecklistItem, reclassifyGuideArchiveItems } from '@/api/checklists'
import { buildGuideArchiveDateLine, buildGuideArchiveListTitle } from '@/utils/guideArchivePresentation'
import { CATEGORIES } from '@/mocks/searchData'
import GuideArchiveProgressBar from '@/components/guide/GuideArchiveProgressBar'
import {
  loadEntryChecklistChecks,
  saveEntryChecklistChecks,
  seedEntryChecksFromSavedIfEmpty,
} from '@/utils/guideArchiveEntryChecklistStorage'
import {
  BAGGAGE_CARRY_ON,
  BAGGAGE_CHECKED,
  BAGGAGE_SECTION_LABEL,
  BAGGAGE_SECTION_ORDER,
  GUIDE_USER_DIRECT_CATEGORY,
  GUIDE_USER_DIRECT_SECTION_LABEL,
  resolveBaggageSection,
} from '@/utils/guideArchiveBaggage'
import {
  buildGuideArchiveDirectDroppableId,
  buildGuideArchiveSectionDroppableId,
  moveItemAppendToDirectSection,
  moveItemAppendToSection,
  moveItemInsertIntoDirectSection,
  moveItemInsertIntoSection,
  parseGuideArchiveDropTarget,
  reorderGuideArchiveDirectItems,
  reorderGuideArchiveSectionItems,
  resolveGuideArchiveCategoryForSection,
  compareGuideArchiveAiFirst,
} from '@/utils/guideArchiveChecklistReorder'
import GuideArchiveSectionDndList from '@/components/guide/GuideArchiveSectionDndList'
import { GuideArchiveChecklistDragPreview } from '@/components/guide/GuideArchiveSortableChecklistItem'

/** 카테고리별 선택 — 1차: 준비물 유형 vs 수하물 유형(보기 기준) */
const VIEW_BASIS_SUPPLIES = 'supplies'
const VIEW_BASIS_BAGGAGE = 'baggage'

const GUIDE_VIEW_BASIS_OPTIONS = [
  { value: VIEW_BASIS_SUPPLIES, label: '준비물 유형' },
  { value: VIEW_BASIS_BAGGAGE, label: '수하물 유형' },
]

const GUIDE_BAGGAGE_TYPE_TABS = [
  { value: 'all', label: '전체' },
  { value: BAGGAGE_CARRY_ON, label: BAGGAGE_SECTION_LABEL[BAGGAGE_CARRY_ON] },
  { value: BAGGAGE_CHECKED, label: BAGGAGE_SECTION_LABEL[BAGGAGE_CHECKED] },
]
const GUIDE_SUPPLIES_SUBSECTION_ORDER = [
  'essentials',
  'clothing',
  'health',
  'toiletries',
  'beauty',
  'electronics',
  'travel_goods',
]
const GUIDE_SUPPLIES_SUBSECTION_LABEL = {
  essentials: '필수 준비물',
  clothing: '입을 옷',
  health: '상비약',
  toiletries: '세면도구',
  beauty: '미용용품',
  electronics: '전자제품',
  travel_goods: '여행용품',
}
const GUIDE_SUPPLIES_ID_PREFIX_TO_SUBSECTION = {
  doc: 'essentials',
  clo: 'clothing',
  hl: 'health',
  pk: 'toiletries',
  bty: 'beauty',
  ele: 'electronics',
  act: 'travel_goods',
}

/** 가이드 보관함 항목 유형 탭 — 탐색의 `CATEGORIES` 중 AI 전용 탭 제외(AI 추천은 백엔드에서 일반 카테고리로 귀속). */
const GUIDE_ARCHIVE_SUPPLIES_CATEGORY_TABS = CATEGORIES.filter((c) => c.value !== 'ai_recommend')

function filterGroupedByItemCategory(grouped, filterItemCategory) {
  if (filterItemCategory === 'all') return grouped
  return grouped.filter((g) => g.categoryValue === filterItemCategory)
}

function resolveGuideSuppliesSubsection(item) {
  const refinedSub = String(item?.refinedSubCategory ?? '').trim()
  const sub = String(item?.subCategory ?? '').trim()
  const picked = refinedSub || sub
  if (picked === 'clothing') return 'clothing'
  if (picked === 'health') return 'health'
  if (picked === 'toiletries') return 'toiletries'
  if (picked === 'beauty') return 'beauty'
  if (picked === 'electronics') return 'electronics'
  if (picked === 'travel_goods' || picked === 'packing' || picked === 'activity') return 'travel_goods'
  if (picked === 'essentials' || picked === 'documents') return 'essentials'

  const rawId = String(item?.id ?? '')
  const seg = rawId.split('-')[1]
  if (seg && GUIDE_SUPPLIES_ID_PREFIX_TO_SUBSECTION[seg]) {
    return GUIDE_SUPPLIES_ID_PREFIX_TO_SUBSECTION[seg]
  }
  return 'essentials'
}

function buildGuideSuppliesSubsections(carry, checked) {
  return GUIDE_SUPPLIES_SUBSECTION_ORDER.map((key) => {
    const carryItems = carry.filter((item) => resolveGuideSuppliesSubsection(item) === key)
    const checkedItems = checked.filter((item) => resolveGuideSuppliesSubsection(item) === key)
    return {
      key,
      label: GUIDE_SUPPLIES_SUBSECTION_LABEL[key],
      items: [...carryItems, ...checkedItems],
    }
  }).filter((section) => section.items.length > 0)
}

const GUIDE_ARCHIVE_DROP_ANIMATION = {
  duration: 280,
  easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
}

/**
 * 가이드 보관함 상세 — 이 여행 스냅샷에 담긴 필수품을 하나씩 체크하며 준비합니다.
 * 체크 상태는 entry 단위로 저장되며, 같은 trip에 다른 여행지 목록이 있어도 섞이지 않습니다.
 * 화면에서의 체크/해제는 메모리만 바꾸고, **저장 → 확인**을 눌렀을 때만 스토리지에 반영합니다(뒤로가기 시 폐기).
 * 준비물 **삭제**는 각 행의 휴지통에서 확인 후 스토리지에 즉시 반영됩니다. 보관함에서 빠진 항목 id는 탐색 저장(`savedTripItems`)에서도 제거합니다.
 * **수정**: 각 행의 연필 아이콘으로 해당 항목만 편집 모달을 엽니다.
 * **직접 추가**: 직접 추가로 항목을 저장하면 **기내 반입**으로 분류되어 본문 **맨 아래** `직접 추가` 블록에 붙습니다(보기 기준·수하물 유형 필터 반영).
 * **순서 변경**: 카드 오른쪽 **드래그 핸들**만 잡고 이동(@dnd-kit·Mouse/Touch 센서, 터치는 길게 누른 뒤 이동). 같은 카테고리 안에서는 순서 변경, 다른 섹션으로 옮길 때는 **놓은 항목 앞**에 끼워 넣습니다(빈 드롭 영역이면 해당 섹션 맨 뒤). 스토리지 반영은 「완료」와 동일 시점.
 * **AI 추천**: AI 전용 탭·섹션 제목은 없고, `category === ai_recommend` 인 항목은 **준비물(supplies)** 등 실제 탭과 같은 블록에 섞이되 **보라 톤 카드**로 구분하고 **같은 소섹션(기내/위탁) 목록 상단**에 둡니다. 백엔드는 동일 필드로 내려주면 됩니다.
 * `onArchiveMutated`: 삭제·저장 후 부모가 스토리지에서 entry를 다시 읽을 때 호출합니다.
 */
export default function GuideArchiveChecklistView({ tripId, entry, onArchiveMutated }) {
  const navigate = useNavigate()
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)
  const [sectionEditModalOpen, setSectionEditModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [sectionEditDraft, setSectionEditDraft] = useState(null)
  const [directAddModalOpen, setDirectAddModalOpen] = useState(false)
  const [directAddDraft, setDirectAddDraft] = useState({
    title: '',
    description: '',
    detail: '',
  })
  /** 보기 기준: 준비물 유형(항목 카테고리 탭) vs 수하물 유형(기내/위탁 탭) */
  const [viewBasis, setViewBasis] = useState(VIEW_BASIS_SUPPLIES)
  /** 준비물 유형 모드일 때만 사용 — CATEGORIES value */
  const [suppliesCategory, setSuppliesCategory] = useState('all')
  /** 수하물 유형 모드일 때만 사용 — 전체 | 기내 | 위탁 */
  const [baggageSection, setBaggageSection] = useState('all')
  /** @dnd-kit DragOverlay용 — 드래그 중인 항목 id */
  const [activeDragId, setActiveDragId] = useState(null)
  /** 드래그 시작 시 원본 행의 측정 크기(오버레이를 카드와 동일 너비로) */
  const [activeDragRect, setActiveDragRect] = useState(null)
  /** 스토리지에서 읽은 순서 — 로컬에서 드래그 순서만 바꿀 때는 entry 참조가 같을 수 있어 id 나열로 동기화 */
  const entryOrderSignature = useMemo(
    () => `${entry.id}:${(entry.items ?? []).map((it) => String(it.id)).join('\u001f')}`,
    [entry.id, entry.items],
  )
  const [localItems, setLocalItems] = useState(() => entry.items ?? [])
  useEffect(() => {
    setLocalItems(entry.items ?? [])
  }, [entryOrderSignature])
  const reclassificationAttemptedRef = useRef(new Set())

  const reclassificationCandidatesSignature = useMemo(() => {
    return (localItems ?? [])
      .filter((it) => {
        const baseCategory = String(it?.category ?? '')
        if (!baseCategory || baseCategory === GUIDE_USER_DIRECT_CATEGORY) return false
        return !String(it?.refinedCategory ?? '').trim()
      })
      .map((it) => String(it.id))
      .sort((a, b) => a.localeCompare(b))
      .join('|')
  }, [localItems])

  useEffect(() => {
    if (!reclassificationCandidatesSignature) return
    const requestKey = `${String(tripId)}:${String(entry.id)}:${reclassificationCandidatesSignature}`
    if (reclassificationAttemptedRef.current.has(requestKey)) return
    reclassificationAttemptedRef.current.add(requestKey)
    const candidates = (localItems ?? []).filter((it) => {
      const baseCategory = String(it?.category ?? '')
      if (!baseCategory || baseCategory === GUIDE_USER_DIRECT_CATEGORY) return false
      return !String(it?.refinedCategory ?? '').trim()
    })
    if (candidates.length === 0) return

    let cancelled = false
    ;(async () => {
      try {
        const response = await reclassifyGuideArchiveItems({
          tripId: String(tripId),
          entryId: String(entry.id),
          items: candidates.map((it) => ({
            id: String(it.id),
            title: it.title ?? '',
            description: it.description ?? '',
            detail: it.detail ?? '',
            category: it.category ?? '',
            prepType: it.prepType ?? '',
            subCategory: it.subCategory ?? '',
          })),
        })

        const mapped = new Map(
          (Array.isArray(response?.items) ? response.items : [])
            .filter((row) => row && row.id != null)
            .map((row) => [
              String(row.id),
              {
                refinedCategory: String(row.category ?? '').trim(),
                refinedSubCategory: String(row.subCategory ?? '').trim(),
                refineConfidence:
                  typeof row.confidence === 'number' && Number.isFinite(row.confidence)
                    ? row.confidence
                    : undefined,
              },
            ]),
        )
        if (mapped.size === 0 || cancelled) return

        let changed = false
        const refinedAt = new Date().toISOString()
        const nextItems = localItems.map((it) => {
          const key = String(it.id)
          const hit = mapped.get(key)
          if (!hit) return it
          const nextRefinedCategory =
            hit.refinedCategory || String(it.refinedCategory ?? '').trim() || String(it.category ?? '')
          const nextRefinedSubCategory =
            hit.refinedSubCategory || String(it.refinedSubCategory ?? '').trim() || undefined
          const sameCategory = String(it.refinedCategory ?? '') === nextRefinedCategory
          const sameSubCategory = String(it.refinedSubCategory ?? '') === String(nextRefinedSubCategory ?? '')
          if (sameCategory && sameSubCategory) return it
          changed = true
          return {
            ...it,
            refinedCategory: nextRefinedCategory,
            refinedSubCategory: nextRefinedSubCategory,
            refineConfidence: hit.refineConfidence ?? it.refineConfidence,
            refinedByModel: response?.model ?? it.refinedByModel,
            refinedAt,
          }
        })

        if (!changed || cancelled) return
        patchGuideArchiveEntry(tripId, entry.id, {
          items: nextItems,
          checklistSavedAt: new Date().toISOString(),
        })
        setLocalItems(nextItems)
        onArchiveMutated?.()
      } catch (err) {
        // 백엔드 미연결(404/501) 또는 일시 실패 시 기존 카테고리 렌더링으로 안전하게 유지
        console.warn(
          '[GuideArchiveChecklistView] 2차 분류 요청 실패(기존 분류 유지):',
          err?.response?.data?.message || err?.message || err,
        )
      }
    })()

    return () => {
      cancelled = true
    }
  }, [tripId, entry.id, reclassificationCandidatesSignature, localItems, onArchiveMutated])

  const items = localItems
  const activeDragItem = useMemo(
    () =>
      activeDragId ? localItems.find((i) => String(i.id) === activeDragId) ?? null : null,
    [activeDragId, localItems],
  )
  const [checks, setChecks] = useState(() => loadEntryChecklistChecks(tripId, entry.id))

  const archiveItemsFingerprint = useMemo(
    () => [...(entry.items ?? []).map((it) => String(it.id))].sort().join('|'),
    [entry.items],
  )

  useEffect(() => {
    seedEntryChecksFromSavedIfEmpty(tripId, entry.id, loadSavedItems(tripId), entry.items ?? [])
    setChecks(loadEntryChecklistChecks(tripId, entry.id))
  }, [tripId, entry.id, archiveItemsFingerprint, entry.items])

  const closeAllModals = useCallback(() => {
    setSectionEditModalOpen(false)
    setEditingSection(null)
    setSectionEditDraft(null)
    setDirectAddModalOpen(false)
    setDirectAddDraft({
      title: '',
      description: '',
      detail: '',
    })
  }, [])

  useEffect(() => {
    if (items.length === 0) {
      closeAllModals()
    }
  }, [items.length, closeAllModals])

  useEffect(() => {
    if (suppliesCategory === 'ai_recommend') {
      setSuppliesCategory('all')
    }
  }, [suppliesCategory])

  const setViewBasisAndReset = useCallback((next) => {
    setViewBasis((current) => {
      if (current === next) return current
      if (next === VIEW_BASIS_SUPPLIES) setSuppliesCategory('all')
      else setBaggageSection('all')
      return next
    })
  }, [])

  /** 목록 필터: 수하물 모드면 선택 구간, 준비물 모드면 항상 전체 구간 표시 */
  const effectiveBaggageFilter = viewBasis === VIEW_BASIS_BAGGAGE ? baggageSection : 'all'
  /** 목록 필터: 준비물 모드면 선택 카테고리, 수하물 모드면 유형 구분 없음 */
  const effectiveItemCategory = viewBasis === VIEW_BASIS_SUPPLIES ? suppliesCategory : 'all'

  /** 수하물 구역(기내/위탁) → 카테고리 값 단위 소그룹(필터용 value 보존) */
  const sectionsByBaggage = useMemo(() => {
    return BAGGAGE_SECTION_ORDER.map((bagKey) => {
      const catMap = new Map()
      for (const it of items) {
        if (resolveBaggageSection(it) !== bagKey) continue
        let categoryValue = it.category ?? '_misc'
        if (categoryValue === GUIDE_USER_DIRECT_CATEGORY) continue
        categoryValue = resolveGuideArchiveCategoryForSection(it)
        const categoryLabel =
          categoryValue === 'supplies'
            ? CATEGORIES.find((c) => c.value === 'supplies')?.label ?? '준비물'
            : it.categoryLabel || it.category || '준비물'
        if (!catMap.has(categoryValue)) {
          catMap.set(categoryValue, { label: categoryLabel, list: [] })
        }
        catMap.get(categoryValue).list.push(it)
      }
      for (const { list } of catMap.values()) {
        list.sort(compareGuideArchiveAiFirst)
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
    if (effectiveBaggageFilter === 'all') return sectionsByBaggage
    return sectionsByBaggage.filter((s) => s.bagKey === effectiveBaggageFilter)
  }, [sectionsByBaggage, effectiveBaggageFilter])

  /** 「직접 추가」는 수하물 블록 밖 페이지 최하단에만 표시 (필터 반영) */
  const directAddSectionItems = useMemo(() => {
    const out = []
    for (const it of items) {
      if ((it.category ?? '_misc') !== GUIDE_USER_DIRECT_CATEGORY) continue
      const bag = resolveBaggageSection(it)
      if (effectiveBaggageFilter !== 'all' && bag !== effectiveBaggageFilter) continue
      out.push(it)
    }
    return out
  }, [items, effectiveBaggageFilter])

  /**
   * 준비물 유형 보기: 최상위를 항목 유형(준비물·사전 예약·…)으로만 나눔. 기내/위탁은 카드 안에서만 구분.
   */
  const suppliesViewSections = useMemo(() => {
    if (viewBasis !== VIEW_BASIS_SUPPLIES) return []

    const tabOrder = CATEGORIES.filter((c) => c.value !== 'all' && c.value !== 'ai_recommend').map(
      (c) => c.value,
    )
    const catMap = new Map()

    for (const it of items) {
      const raw = it.category ?? '_misc'
      if (raw === GUIDE_USER_DIRECT_CATEGORY) continue
      const cv = resolveGuideArchiveCategoryForSection(it)
      if (effectiveItemCategory !== 'all' && cv !== effectiveItemCategory) continue

      if (!catMap.has(cv)) {
        const categoryLabel =
          cv === 'supplies'
            ? CATEGORIES.find((c) => c.value === 'supplies')?.label ?? '준비물'
            : it.categoryLabel || it.category || '준비물'
        catMap.set(cv, {
          categoryValue: cv,
          categoryLabel,
          carry: [],
          checked: [],
        })
      }
      const bucket = catMap.get(cv)
      if (resolveBaggageSection(it) === BAGGAGE_CHECKED) bucket.checked.push(it)
      else bucket.carry.push(it)
    }

    for (const g of catMap.values()) {
      g.carry.sort(compareGuideArchiveAiFirst)
      g.checked.sort(compareGuideArchiveAiFirst)
    }

    const ordered = []
    for (const cv of tabOrder) {
      const g = catMap.get(cv)
      if (!g || (g.carry.length === 0 && g.checked.length === 0)) continue
      ordered.push(g)
      catMap.delete(cv)
    }
    for (const g of catMap.values()) {
      if (g.carry.length || g.checked.length) ordered.push(g)
    }
    return ordered
  }, [viewBasis, items, effectiveItemCategory])

  /** 현재 보기 기준·필터로 화면에 보이는 항목 수 */
  const visibleChecklistItemCount = useMemo(() => {
    if (viewBasis === VIEW_BASIS_SUPPLIES) {
      let n = 0
      for (const s of suppliesViewSections) {
        n += s.carry.length + s.checked.length
      }
      if (effectiveItemCategory === 'all') n += directAddSectionItems.length
      return n
    }
    let n = 0
    for (const s of visibleSectionsByBaggage) {
      const gr = filterGroupedByItemCategory(s.grouped, effectiveItemCategory)
      for (const g of gr) n += g.items.length
    }
    if (effectiveItemCategory === 'all') n += directAddSectionItems.length
    return n
  }, [
    viewBasis,
    suppliesViewSections,
    visibleSectionsByBaggage,
    effectiveItemCategory,
    directAddSectionItems,
  ])

  /** 필터 후 첫 수하물 블록에만 드래그 안내 표시(수하물 유형 보기) */
  const firstVisibleBagKeyForHint = useMemo(() => {
    for (const s of visibleSectionsByBaggage) {
      if (filterGroupedByItemCategory(s.grouped, effectiveItemCategory).length > 0) return s.bagKey
    }
    return null
  }, [visibleSectionsByBaggage, effectiveItemCategory])

  /** 준비물 유형 보기 — 첫 항목 유형 블록에만 드래그 안내 */
  const firstSuppliesCategoryForHint = useMemo(() => {
    if (viewBasis !== VIEW_BASIS_SUPPLIES) return null
    for (const s of suppliesViewSections) {
      if (s.carry.length || s.checked.length) return s.categoryValue
    }
    return null
  }, [viewBasis, suppliesViewSections])

  const total = items.length
  const checkedCount = useMemo(() => items.filter((it) => checks[String(it.id)]).length, [items, checks])
  const progress = total > 0 ? Math.round((checkedCount / total) * 100) : 0

  const handleToggle = useCallback((itemId) => {
    const id = String(itemId)
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }))
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

  const openSectionEditorForSingleItem = useCallback((item) => {
    const bagKey = resolveBaggageSection(item)
    const categoryValue = item.category ?? '_misc'
    const categoryLabel = item.categoryLabel || item.category || '준비물'
    setEditingSection({ bagKey, categoryValue })
    setSectionEditDraft({
      categoryLabel,
      rows: [
        {
          id: item.id,
          title: item.title ?? '',
          description: item.description ?? '',
          detail: item.detail ?? '',
        },
      ],
    })
    setSectionEditModalOpen(true)
  }, [])

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
      setLocalItems(newItems)
      setChecks(nextChecks)
      onArchiveMutated?.()
    },
    [tripId, entry.id, items, onArchiveMutated],
  )

  const confirmDeleteSingleItem = useCallback(
    (item) => {
      const title = (item.title ?? '').trim() || '이 항목'
      if (!window.confirm(`「${title}」을(를) 이 체크리스트에서 삭제할까요? 되돌릴 수 없습니다.`)) return
      const id = String(item.id)
      const newItems = items.filter((it) => String(it.id) !== id)
      const nextChecks = {}
      for (const it of newItems) {
        nextChecks[String(it.id)] = Boolean(checks[String(it.id)])
      }
      persistItemsAndChecks(newItems, nextChecks)
    },
    [items, checks, persistItemsAndChecks],
  )

  const saveSectionEdit = useCallback(() => {
    if (!editingSection || !sectionEditDraft) return
    const { bagKey, categoryValue } = editingSection
    const rowById = new Map(sectionEditDraft.rows.map((r) => [String(r.id), r]))
    const newItems = items.map((it) => {
      const id = String(it.id)
      const row = rowById.get(id)
      if (!row) return it
      if ((it.category ?? '_misc') !== categoryValue) return it
      if (bagKey != null && resolveBaggageSection(it) !== bagKey) return it
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
    setLocalItems(newItems)
    setSectionEditModalOpen(false)
    setEditingSection(null)
    setSectionEditDraft(null)
    onArchiveMutated?.()
  }, [editingSection, sectionEditDraft, items, tripId, entry.id, checks, onArchiveMutated])

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
      items,
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

  const dndLocked = sectionEditModalOpen || directAddModalOpen

  /** 마우스: 짧게 끌면 시작. 터치: 길게 누른 뒤(delay) 움직이면 드래그 — 스크롤·탭과 구분 */
  const dndSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 350, tolerance: 12 },
    }),
  )

  const handleGuideArchiveDragEnd = useCallback(
    (event) => {
      if (dndLocked) return
      const { active, over } = event
      if (!over) return

      const aid = String(active.id)
      const oid = String(over.id)

      if (aid === oid) return

      const activeItem = localItems.find((x) => String(x.id) === aid)
      if (!activeItem) return

      const dropParsed = parseGuideArchiveDropTarget(oid)
      const overItem = dropParsed ? null : localItems.find((x) => String(x.id) === oid)

      const activeBag = resolveBaggageSection(activeItem)
      const activeRaw = activeItem.category ?? '_misc'
      const activeCat = resolveGuideArchiveCategoryForSection(activeItem)

      if (overItem) {
        const overBag = resolveBaggageSection(overItem)
        const overRaw = overItem.category ?? '_misc'
        const overCat = resolveGuideArchiveCategoryForSection(overItem)

        const sameNormalSection =
          activeRaw !== GUIDE_USER_DIRECT_CATEGORY &&
          overRaw !== GUIDE_USER_DIRECT_CATEGORY &&
          activeBag === overBag &&
          activeCat === overCat

        const sameDirect =
          activeRaw === GUIDE_USER_DIRECT_CATEGORY &&
          overRaw === GUIDE_USER_DIRECT_CATEGORY &&
          (effectiveBaggageFilter === 'all' || activeBag === effectiveBaggageFilter) &&
          (effectiveBaggageFilter === 'all' || overBag === effectiveBaggageFilter)

        if (sameNormalSection) {
          const sectionList = localItems.filter(
            (x) =>
              resolveBaggageSection(x) === activeBag &&
              resolveGuideArchiveCategoryForSection(x) === activeCat &&
              (x.category ?? '_misc') !== GUIDE_USER_DIRECT_CATEGORY,
          )
          const oldI = sectionList.findIndex((x) => String(x.id) === aid)
          const newI = sectionList.findIndex((x) => String(x.id) === oid)
          if (oldI >= 0 && newI >= 0 && oldI !== newI) {
            setLocalItems((p) =>
              reorderGuideArchiveSectionItems(p, activeBag, activeCat, oldI, newI),
            )
          }
          return
        }

        if (sameDirect) {
          const directList = localItems.filter(
            (x) =>
              (x.category ?? '_misc') === GUIDE_USER_DIRECT_CATEGORY &&
              (effectiveBaggageFilter === 'all' || resolveBaggageSection(x) === effectiveBaggageFilter),
          )
          const oldI = directList.findIndex((x) => String(x.id) === aid)
          const newI = directList.findIndex((x) => String(x.id) === oid)
          if (oldI >= 0 && newI >= 0 && oldI !== newI) {
            setLocalItems((p) => reorderGuideArchiveDirectItems(p, effectiveBaggageFilter, oldI, newI))
          }
          return
        }

        if (overRaw === GUIDE_USER_DIRECT_CATEGORY) {
          if (activeRaw === GUIDE_USER_DIRECT_CATEGORY) return
          setLocalItems((p) => moveItemInsertIntoDirectSection(p, aid, oid, effectiveBaggageFilter))
          return
        }

        if (activeRaw === GUIDE_USER_DIRECT_CATEGORY) {
          const targetCv = resolveGuideArchiveCategoryForSection(overItem)
          const catLabel =
            targetCv === 'supplies'
              ? CATEGORIES.find((c) => c.value === 'supplies')?.label ?? '준비물'
              : overItem.categoryLabel || overItem.category || '준비물'
          setLocalItems((p) =>
            moveItemInsertIntoSection(p, aid, overBag, targetCv, catLabel, oid),
          )
          return
        }

        if (activeBag !== overBag || activeCat !== overCat) {
          const targetCv = resolveGuideArchiveCategoryForSection(overItem)
          const catLabel =
            targetCv === 'supplies'
              ? CATEGORIES.find((c) => c.value === 'supplies')?.label ?? '준비물'
              : overItem.categoryLabel || overItem.category || '준비물'
          setLocalItems((p) =>
            moveItemInsertIntoSection(p, aid, overBag, targetCv, catLabel, oid),
          )
        }
        return
      }

      if (!dropParsed) return

      if (dropParsed.kind === 'direct') {
        if (activeRaw === GUIDE_USER_DIRECT_CATEGORY) return
        setLocalItems((p) => moveItemAppendToDirectSection(p, aid))
        return
      }

      const { bagKey, categoryValue, categoryLabel } = dropParsed
      const sameAsActive =
        activeRaw !== GUIDE_USER_DIRECT_CATEGORY &&
        activeBag === bagKey &&
        activeCat === categoryValue

      if (sameAsActive) return

      setLocalItems((p) =>
        moveItemAppendToSection(p, aid, bagKey, categoryValue, categoryLabel),
      )
    },
    [dndLocked, localItems, effectiveBaggageFilter],
  )

  const handleGuideArchiveDragStart = useCallback(({ active }) => {
    const sid = String(active.id)
    setActiveDragId(sid)

    const applyMeasured = () => {
      const initial = active.rect?.current?.initial
      if (initial && initial.width > 0) {
        setActiveDragRect({
          width: Math.round(initial.width),
          height: Math.round(initial.height),
        })
        return true
      }
      const el = document.querySelector(`[data-guide-archive-dnd-item="${sid}"]`)
      if (el) {
        const cr = el.getBoundingClientRect()
        if (cr.width > 0) {
          setActiveDragRect({
            width: Math.round(cr.width),
            height: Math.round(cr.height),
          })
          return true
        }
      }
      setActiveDragRect(null)
      return false
    }

    if (!applyMeasured()) {
      requestAnimationFrame(applyMeasured)
    }
  }, [])

  const handleGuideArchiveDragCancel = useCallback(() => {
    setActiveDragId(null)
    setActiveDragRect(null)
  }, [])

  const handleGuideArchiveDragEndWithOverlay = useCallback(
    (event) => {
      handleGuideArchiveDragEnd(event)
      setActiveDragId(null)
      setActiveDragRect(null)
    },
    [handleGuideArchiveDragEnd],
  )

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
          className="min-w-0 flex-1 basis-0 rounded-2xl border-2 border-gray-100 bg-white px-4 py-3.5 text-sm font-bold text-gray-800 shadow-sm transition-colors hover:bg-gray-50"
        >
          뒤로가기
        </button>
        <button
          type="button"
          onClick={() => setSaveConfirmOpen(true)}
          className="min-w-0 flex-1 basis-0 rounded-2xl bg-amber-400 px-4 py-3.5 text-sm font-bold text-gray-900 shadow-sm transition-all hover:bg-amber-500 hover:shadow-md active:scale-[0.98]"
        >
          완료
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
          저장한 체크리스트를 확인하고 빠짐없이 준비해보세요
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

      <section
        className="mb-8 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] md:p-5"
        aria-label="카테고리 필터"
      >
        <h2 className="mb-3.5 text-lg font-extrabold tracking-tight text-gray-900">카테고리별 선택</h2>

        <p id="guide-checklist-view-basis-label" className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          보기 기준
        </p>
        <div
          className="mb-5 inline-flex w-auto max-w-full rounded-2xl border-2 border-slate-200/90 bg-slate-100/80 p-1 shadow-inner"
          role="tablist"
          aria-label="보기 기준"
          aria-labelledby="guide-checklist-view-basis-label"
        >
          {GUIDE_VIEW_BASIS_OPTIONS.map((opt) => {
            const selected = viewBasis === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setViewBasisAndReset(opt.value)}
                className={`min-h-9 min-w-[92px] rounded-lg px-2 py-1.5 text-center text-xs font-bold transition-all ${
                  selected
                    ? 'bg-white text-teal-900 shadow-sm ring-1 ring-slate-200/80'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        <p id="guide-checklist-subcategory-label" className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          {viewBasis === VIEW_BASIS_SUPPLIES ? '항목 유형' : '수하물 구간'}
        </p>
        {viewBasis === VIEW_BASIS_SUPPLIES ? (
          <div
            className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-labelledby="guide-checklist-subcategory-label"
          >
            {GUIDE_ARCHIVE_SUPPLIES_CATEGORY_TABS.map((cat) => {
              const selected = suppliesCategory === cat.value
              const tabClass = selected
                ? 'border-2 border-sky-600 bg-sky-600 text-white shadow-md shadow-sky-900/15'
                : 'border-2 border-sky-100 bg-slate-50/80 text-slate-600 shadow-sm hover:border-sky-200 hover:bg-sky-50'
              return (
                <button
                  key={cat.value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setSuppliesCategory(cat.value)}
                  className={`inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors ${tabClass}`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        ) : (
          <div
            className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin"
            role="tablist"
            aria-labelledby="guide-checklist-subcategory-label"
          >
            {GUIDE_BAGGAGE_TYPE_TABS.map((tab) => {
              const selected = baggageSection === tab.value
              const tabClass = selected
                ? 'border-2 border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-900/15'
                : 'border-2 border-teal-100 bg-teal-50/80 text-teal-900 shadow-sm hover:border-teal-300 hover:bg-teal-100/80'
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setBaggageSection(tab.value)}
                  className={`inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors ${tabClass}`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        )}
      </section>

      <div className="mb-4 flex w-full max-w-full flex-wrap items-center gap-x-3 gap-y-3">
        <p className="min-w-0 flex-1 text-sm font-semibold text-gray-700 md:text-base">
          {viewBasis === VIEW_BASIS_SUPPLIES ? (
            <>
              <span className="text-slate-700">
                {suppliesCategory === 'all'
                  ? '전체 유형'
                  : CATEGORIES.find((c) => c.value === suppliesCategory)?.label}
              </span>
              <span className="ml-1.5 tabular-nums text-gray-900">{visibleChecklistItemCount}</span>개
            </>
          ) : (
            <>
              <span className="text-teal-900">
                {baggageSection === 'all' ? '전체 구간' : BAGGAGE_SECTION_LABEL[baggageSection]}
              </span>
              <span className="ml-1.5 tabular-nums text-gray-900">{visibleChecklistItemCount}</span>개
            </>
          )}
        </p>
      </div>

      <div className="mb-6 flex w-full max-w-full flex-wrap items-center gap-x-3 gap-y-3">
        {sectionEditModalOpen ? (
          <p className="w-full text-sm text-gray-500 sm:max-w-md">
            수정 창을 닫은 뒤 다른 섹션을 선택할 수 있어요.
          </p>
        ) : directAddModalOpen ? (
          <p className="w-full text-sm text-gray-500 sm:max-w-md">
            직접 추가 창을 닫으면 다시 이 화면을 사용할 수 있어요.
          </p>
        ) : (
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 gap-y-3">
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
          </div>
        )}
      </div>

      <DndContext
        sensors={dndSensors}
        collisionDetection={closestCorners}
        onDragStart={handleGuideArchiveDragStart}
        onDragCancel={handleGuideArchiveDragCancel}
        onDragEnd={handleGuideArchiveDragEndWithOverlay}
      >
        <div className="space-y-10">
          {viewBasis === VIEW_BASIS_SUPPLIES
            ? suppliesViewSections.map(({ categoryValue, categoryLabel, carry, checked }) => {
                const showBagSublabels = carry.length > 0 && checked.length > 0
                return (
                  <div key={categoryValue} className="space-y-6">
                    <div className="flex flex-col gap-2 border-b border-teal-100/90 pb-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                      <h2 className="flex min-w-0 items-center gap-2 text-base font-extrabold tracking-tight text-[#0a3d3d]">
                        {categoryLabel}
                      </h2>
                      {categoryValue === firstSuppliesCategoryForHint && total > 0 ? (
                        <p
                          className="max-w-md shrink-0 text-left text-xs font-medium leading-relaxed text-slate-500 sm:text-right sm:text-[13px]"
                          role="note"
                        >
                          <span className="sm:hidden">
                            오른쪽 드래그 아이콘을 잡고 길게 누른 뒤 끌어 옮겨 주세요.
                          </span>
                          <span className="hidden sm:inline">
                            준비 항목을 드래그하여 순서를 변경할 수 있어요!
                          </span>
                        </p>
                      ) : null}
                    </div>
                    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition md:p-5">
                      {categoryValue === 'supplies' ? (
                        <div className="space-y-5">
                          {buildGuideSuppliesSubsections(carry, checked).map((subSection) => {
                            return (
                              <div key={subSection.key}>
                                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                                  {subSection.label}
                                </p>
                                <GuideArchiveSectionDndList
                                  droppableId={buildGuideArchiveSectionDroppableId(
                                    BAGGAGE_CARRY_ON,
                                    categoryValue,
                                    categoryLabel,
                                  )}
                                  list={subSection.items}
                                  sortableDisabled={dndLocked}
                                  checks={checks}
                                  handleToggle={handleToggle}
                                  onEditItem={openSectionEditorForSingleItem}
                                  onDeleteItem={confirmDeleteSingleItem}
                                  actionVariant="default"
                                />
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {carry.length > 0 ? (
                            <div>
                              {showBagSublabels ? (
                                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                                  {BAGGAGE_SECTION_LABEL[BAGGAGE_CARRY_ON]}
                                </p>
                              ) : null}
                              <GuideArchiveSectionDndList
                                droppableId={buildGuideArchiveSectionDroppableId(
                                  BAGGAGE_CARRY_ON,
                                  categoryValue,
                                  categoryLabel,
                                )}
                                list={carry}
                                sortableDisabled={dndLocked}
                                checks={checks}
                                handleToggle={handleToggle}
                                onEditItem={openSectionEditorForSingleItem}
                                onDeleteItem={confirmDeleteSingleItem}
                                actionVariant="default"
                              />
                            </div>
                          ) : null}
                          {checked.length > 0 ? (
                            <div className={carry.length > 0 ? 'border-t border-slate-100 pt-6' : ''}>
                              {showBagSublabels ? (
                                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                                  {BAGGAGE_SECTION_LABEL[BAGGAGE_CHECKED]}
                                </p>
                              ) : null}
                              <GuideArchiveSectionDndList
                                droppableId={buildGuideArchiveSectionDroppableId(
                                  BAGGAGE_CHECKED,
                                  categoryValue,
                                  categoryLabel,
                                )}
                                list={checked}
                                sortableDisabled={dndLocked}
                                checks={checks}
                                handleToggle={handleToggle}
                                onEditItem={openSectionEditorForSingleItem}
                                onDeleteItem={confirmDeleteSingleItem}
                                actionVariant="default"
                              />
                            </div>
                          ) : null}
                        </div>
                      )}
                    </section>
                  </div>
                )
              })
            : visibleSectionsByBaggage.map(({ bagKey, bagTitle, grouped }) => {
                const displayGrouped = filterGroupedByItemCategory(grouped, effectiveItemCategory)
                if (displayGrouped.length === 0) return null
                return (
                  <div key={bagKey} className="space-y-6">
                    <div className="flex flex-col gap-2 border-b border-teal-100/90 pb-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                      <h2 className="text-base font-extrabold tracking-tight text-[#0a3d3d]">{bagTitle}</h2>
                      {bagKey === firstVisibleBagKeyForHint && total > 0 ? (
                        <p
                          className="max-w-md shrink-0 text-left text-xs font-medium leading-relaxed text-slate-500 sm:text-right sm:text-[13px]"
                          role="note"
                        >
                          <span className="sm:hidden">
                            오른쪽 드래그 아이콘을 잡고 길게 누른 뒤 끌어 옮겨 주세요.
                          </span>
                          <span className="hidden sm:inline">
                            준비 항목을 드래그하여 순서를 변경할 수 있어요!
                          </span>
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-8">
                      {displayGrouped.map(({ categoryValue, categoryLabel, items: list }) => {
                        return (
                          <section
                            key={`${bagKey}-${categoryValue}`}
                            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition md:p-5"
                          >
                            <div className="mb-3 border-b border-teal-100/90 pb-2">
                              <h3 className="flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                                {categoryLabel}
                              </h3>
                            </div>
                            <GuideArchiveSectionDndList
                              droppableId={buildGuideArchiveSectionDroppableId(
                                bagKey,
                                categoryValue,
                                categoryLabel,
                              )}
                              list={list}
                              sortableDisabled={dndLocked}
                              checks={checks}
                              handleToggle={handleToggle}
                              onEditItem={openSectionEditorForSingleItem}
                              onDeleteItem={confirmDeleteSingleItem}
                              actionVariant="default"
                            />
                          </section>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
          {effectiveItemCategory === 'all' && directAddSectionItems.length > 0 ? (
            <div className="mt-10 space-y-6">
              <div className="flex flex-col gap-2 border-b border-teal-100/90 pb-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                <h2 className="text-base font-extrabold tracking-tight text-[#0a3d3d]">
                  {GUIDE_USER_DIRECT_SECTION_LABEL}
                </h2>
                {(viewBasis === VIEW_BASIS_BAGGAGE
                  ? visibleSectionsByBaggage.length === 0
                  : suppliesViewSections.length === 0) &&
                total > 0 ? (
                  <p
                    className="max-w-md shrink-0 text-left text-xs font-medium leading-relaxed text-slate-500 sm:text-right sm:text-[13px]"
                    role="note"
                  >
                    <span className="sm:hidden">
                      오른쪽 드래그 아이콘을 잡고 길게 누른 뒤 끌어 옮겨 주세요.
                    </span>
                    <span className="hidden sm:inline">
                      준비 항목을 드래그하여 순서를 변경할 수 있어요!
                    </span>
                  </p>
                ) : null}
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-5">
                <GuideArchiveSectionDndList
                  droppableId={buildGuideArchiveDirectDroppableId()}
                  list={directAddSectionItems}
                  sortableDisabled={dndLocked}
                  checks={checks}
                  handleToggle={handleToggle}
                  onEditItem={openSectionEditorForSingleItem}
                  onDeleteItem={confirmDeleteSingleItem}
                />
              </div>
            </div>
          ) : null}
        </div>
        <DragOverlay adjustScale={false} dropAnimation={GUIDE_ARCHIVE_DROP_ANIMATION}>
          {activeDragItem && !dndLocked ? (
            <div
              className="box-border max-w-[calc(100vw-2.5rem)]"
              style={
                activeDragRect?.width
                  ? {
                      width: activeDragRect.width,
                    }
                  : undefined
              }
            >
              <GuideArchiveChecklistDragPreview item={activeDragItem} checks={checks} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
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
              {sectionEditDraft.rows.length === 1 ? '항목 수정' : '섹션 수정'}
            </h2>
            <div className="mb-4">
              <p id="guide-archive-section-name-label" className="mb-1 text-xs font-bold text-gray-600">
                {sectionEditDraft.rows.length === 1 ? '항목 유형(카테고리)' : '섹션 이름'}
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
                {sectionEditDraft.rows.length === 1 ? '저장' : '이 섹션 저장'}
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
