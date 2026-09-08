'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MODELS } from '@/lib/models'

type ModelSelectProps = {
  value: string
  onChange: (value: string) => void
  canUsePaidModels: boolean
  onNeedSubscribe: () => void
}

export function ModelSelect({ value, onChange, canUsePaidModels, onNeedSubscribe }: ModelSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const model = MODELS.find((item) => item.id === next)
        if (model?.paid && !canUsePaidModels) {
          onNeedSubscribe()
          return
        }
        onChange(next)
      }}
    >
      <SelectTrigger
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'h-8 w-auto gap-1 border-0 bg-transparent px-2 shadow-none focus:ring-0 focus:ring-offset-0',
        )}
      >
        <span>{MODELS.find((model) => model.id === value)?.name}</span>
      </SelectTrigger>
      <SelectContent>
        {MODELS.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <span>{model.name}</span>
            {model.paid && !canUsePaidModels ? (
              <span className="ml-2 text-muted-foreground">Pro</span>
            ) : (
              <span className="ml-2 text-muted-foreground">{model.hint.split('·')[0].trim()}</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
