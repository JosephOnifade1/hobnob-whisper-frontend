
import * as React from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useDeviceType } from "@/hooks/useDeviceType"

interface TouchButtonProps extends ButtonProps {
  haptic?: boolean
}

const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ className, haptic = false, onClick, ...props }, ref) => {
    const { hasTouch, isMobile } = useDeviceType()

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Add haptic feedback on mobile devices
      if (haptic && hasTouch && 'vibrate' in navigator) {
        navigator.vibrate(10) // Very short vibration
      }
      
      onClick?.(event)
    }

    const touchClasses = hasTouch ? "min-h-[44px] min-w-[44px]" : ""
    const mobileClasses = isMobile ? "active:scale-95 transition-transform" : ""

    return (
      <Button
        ref={ref}
        className={cn(touchClasses, mobileClasses, className)}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
TouchButton.displayName = "TouchButton"

export { TouchButton }
