'use client'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { Icons } from '@/components/icons'
import { AppearanceSettings } from '@/components/appearance-settings'

export default function ModeToggle({ variant = 'header' }: { variant?: 'header' | 'sidebar' }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {variant === 'sidebar' ? (
          <SidebarMenuButton tooltip="Settings">
            <Icons.settings className="size-3.5" />
            <span>Settings</span>
          </SidebarMenuButton>
        ) : (
          <Button variant="ghost" size="icon">
            <Icons.settings />
            <span className="sr-only">Appearance settings</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={variant === 'sidebar' ? 'start' : 'end'}
        side={variant === 'sidebar' ? 'right' : 'bottom'}
        className="w-72 p-0"
      >
        <AppearanceSettings />
      </PopoverContent>
    </Popover>
  )
}
