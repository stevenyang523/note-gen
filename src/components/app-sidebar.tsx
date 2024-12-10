'use client'

import { ImageUp, Search, ScanFace, Settings, Highlighter, SquarePen, PencilRuler } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from 'next/navigation'
import { ModeToggle } from "./mode-toggle"
import Link from "next/link"
 
// Menu items.
const items = [
  {
    title: "记录",
    url: "/core/note",
    icon: Highlighter,
    isActive: true,
  },
  {
    title: "写作",
    url: "/core/article",
    icon: SquarePen,
  },
  {
    title: "绘图",
    url: "#",
    icon: PencilRuler,
  },
  {
    title: "搜索",
    url: "/core/search",
    icon: Search,
  },
  {
    title: "图床",
    url: "/core/image",
    icon: ImageUp,
  },
]
 
export function AppSidebar() {
  // 获取当前的路由
  const pathname = usePathname()

  return (
    <Sidebar 
      collapsible="none"
      className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r h-screen"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ScanFace className="size-5" />
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    disabled={item.url === '#'}
                    isActive={pathname === item.url}
                    tooltip={{
                      children: item.title,
                      hidden: false,
                    }}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ModeToggle />
        <SidebarMenuButton isActive={pathname === '/core/setting'} asChild className="md:h-8 md:p-0"
          tooltip={{
            children: '设置',
            hidden: false,
          }}
        >
          <Link href="/core/setting">
            <div className="flex size-8 items-center justify-center rounded-lg">
              <Settings className="size-4" />
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  )
}