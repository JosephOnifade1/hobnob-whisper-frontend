
import * as React from "react"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useDeviceType } from "@/hooks/useDeviceType"

interface ResponsiveDrawerProps {
  children: React.ReactNode
  trigger: React.ReactNode
  side?: "left" | "right" | "top" | "bottom"
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ResponsiveDrawer({ 
  children, 
  trigger, 
  side = "left", 
  className,
  open,
  onOpenChange 
}: ResponsiveDrawerProps) {
  const { isMobile } = useDeviceType()

  if (isMobile && (side === "bottom" || side === "top")) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className={className}>
          {children}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side={side} className={className}>
        {children}
      </SheetContent>
    </Sheet>
  )
}
