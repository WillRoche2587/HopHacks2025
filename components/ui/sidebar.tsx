import * as React from "react"
import { cn } from "@/lib/utils"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-screen w-64 flex-col border-r bg-background fixed left-0 top-0 z-40",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Sidebar.displayName = "Sidebar"

const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex h-screen">{children}</div>
}

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-auto py-2", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("space-y-1 px-2", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
SidebarTrigger.displayName = "SidebarTrigger"

export {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
}
