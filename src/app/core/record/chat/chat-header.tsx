"use client"

import { BotMessageSquare, Drama, LayoutGrid } from "lucide-react"
import usePromptStore from "@/stores/prompt"
import useSettingStore from "@/stores/setting"
import { TooltipButton } from "@/components/tooltip-button"

export function ChatHeader() {
  const { currentPrompt } = usePromptStore()
  const { aiType, model } = useSettingStore()
  return (
    <header className="h-12 w-full flex justify-between items-center border-b gap-2 px-4 text-sm">
      <div className="flex items-center gap-4 text-muted-foreground">
        <div className="flex items-center gap-1">
          <BotMessageSquare className="size-4" />
          {`${model}(${aiType})`}
        </div>
        <div className="flex items-center gap-1">
          <Drama className="size-4" />
          {currentPrompt?.title}
        </div>
      </div>
      <div className="flex items-center h-6 gap-1">
        <TooltipButton icon={<LayoutGrid />} tooltipText="Apps" />
      </div>
    </header>
  )
}
