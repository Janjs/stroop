'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { buttonVariants } from '@/components/ui/button'
import { ModelSelectorLogo } from '@/components/ai-elements/model-selector'
import { cn } from '@/lib/utils'
import { MODELS } from '@/lib/models'

type ModelSelectProps = {
  value: string
  onChange: (value: string) => void
  canUsePaidModels: boolean
  onNeedSubscribe: () => void
}

export function ModelSelect({ value, onChange, canUsePaidModels, onNeedSubscribe }: ModelSelectProps) {
  const selected = MODELS.find((model) => model.id === value) ?? MODELS[0]

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
          'h-8 w-auto gap-1.5 border-0 bg-transparent px-2 shadow-none focus:ring-0 focus:ring-offset-0',
        )}
      >
        <ModelSelectorLogo provider={selected.provider} className="size-3.5" />
        <span>{selected.name}</span>
      </SelectTrigger>
      <SelectContent>
        {MODELS.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <span className="flex items-center gap-2">
              <ModelSelectorLogo provider={model.provider} className="size-3.5" />
              <span>{model.name}</span>
              {model.paid && !canUsePaidModels ? (
                <span className="text-muted-foreground">Pro</span>
              ) : null}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
