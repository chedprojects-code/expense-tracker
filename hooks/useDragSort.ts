import { useRef } from 'react'

export function useDragSort<T extends { id: string }>(
  items: T[],
  onReorder: (reordered: T[]) => void,
) {
  const dragId = useRef<string | null>(null)
  const overId = useRef<string | null>(null)

  const onDragStart = (id: string) => { dragId.current = id }

  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    overId.current = id
  }

  const onDrop = () => {
    if (!dragId.current || !overId.current || dragId.current === overId.current) return
    const from = items.findIndex((i) => i.id === dragId.current)
    const to = items.findIndex((i) => i.id === overId.current)
    if (from === -1 || to === -1) return
    const reordered = [...items]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    onReorder(reordered)
    dragId.current = null
    overId.current = null
  }

  const onDragEnd = () => { dragId.current = null; overId.current = null }

  return { onDragStart, onDragOver, onDrop, onDragEnd, dragId }
}
