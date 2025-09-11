'use client'

import { useDroppable } from '@dnd-kit/core'

interface DroppableColumnProps {
  id: string
  children: React.ReactNode
}

export default function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: {
      type: 'column'
    }
  })

  return (
    <div
      ref={setNodeRef}
      className={`bg-surface rounded-lg p-4 min-h-[400px] transition-colors ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-400' : ''
      }`}
    >
      {children}
    </div>
  )
}