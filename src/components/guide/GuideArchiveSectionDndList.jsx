import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import GuideArchiveSortableChecklistItem from '@/components/guide/GuideArchiveSortableChecklistItem'

/**
 * 카테고리(섹션) 단위 Sortable 목록 + 드롭 영역.
 * DndContext는 부모(GuideArchiveChecklistView) 단일 인스턴스에서 제공합니다.
 */
export default function GuideArchiveSectionDndList({
  droppableId,
  list,
  sortableDisabled,
  checks,
  handleToggle,
  onEditItem,
  onDeleteItem,
  actionVariant = 'default',
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    disabled: sortableDisabled,
  })

  const sortableIds = useMemo(() => list.map((i) => String(i.id)), [list])

  return (
    <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
      <ul
        ref={setNodeRef}
        className={`space-y-2 rounded-xl transition-[background-color,box-shadow] duration-300 ease-out md:pl-10 ${
          list.length === 0
            ? 'min-h-14 border-2 border-dashed border-sky-200/70 bg-white py-2'
            : ''
        } ${
          isOver && !sortableDisabled
            ? 'bg-white ring-2 ring-sky-400/40 ring-offset-1 ring-offset-white'
            : ''
        }`}
      >
        {list.map((it) => (
          <GuideArchiveSortableChecklistItem
            key={it.id}
            item={it}
            sortableDisabled={sortableDisabled}
            checks={checks}
            handleToggle={handleToggle}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
            actionVariant={actionVariant}
          />
        ))}
      </ul>
    </SortableContext>
  )
}
