'use client'

import { type BuyListItem } from '@/lib/supabase/db'
import { BuyListItems } from './BuyListItems'

export function WantsTab({
  items,
  onToggle,
  onEdit,
  onDelete,
  onReorder,
}: {
  items: BuyListItem[]
  onToggle: (id: string, bought: boolean) => Promise<void>
  onEdit: (item: BuyListItem) => void
  onDelete: (id: string) => Promise<void>
  onReorder: (reordered: BuyListItem[]) => void
}) {
  return (
    <BuyListItems
      items={items.filter((i) => i.category === 'want')}
      category="want"
      onToggle={onToggle}
      onEdit={onEdit}
      onDelete={onDelete}
      onReorder={onReorder}
    />
  )
}
