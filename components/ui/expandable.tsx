"use client"

import React, { useState, createContext, useContext, ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"

// Context for expandable state
interface ExpandableContextType {
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
  expandDirection: "horizontal" | "vertical" | "both"
  expandBehavior: "push" | "replace"
  initialDelay: number
  onExpandStart?: () => void
  onExpandEnd?: () => void
}

const ExpandableContext = createContext<ExpandableContextType | null>(null)

const useExpandable = () => {
  const context = useContext(ExpandableContext)
  if (!context) {
    throw new Error("useExpandable must be used within an Expandable component")
  }
  return context
}

// Main Expandable component
interface ExpandableProps {
  children: (props: { isExpanded: boolean }) => ReactNode
  expanded?: boolean
  onToggle?: (expanded: boolean) => void
  expandDirection?: "horizontal" | "vertical" | "both"
  expandBehavior?: "push" | "replace"
  initialDelay?: number
  onExpandStart?: () => void
  onExpandEnd?: () => void
}

export function Expandable({
  children,
  expanded: controlledExpanded,
  onToggle,
  expandDirection = "both",
  expandBehavior = "replace",
  initialDelay = 0,
  onExpandStart,
  onExpandEnd,
}: ExpandableProps) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded
  
  const setIsExpanded = (expanded: boolean) => {
    if (controlledExpanded === undefined) {
      setInternalExpanded(expanded)
    }
    onToggle?.(expanded)
  }

  return (
    <ExpandableContext.Provider
      value={{
        isExpanded,
        setIsExpanded,
        expandDirection,
        expandBehavior,
        initialDelay,
        onExpandStart,
        onExpandEnd,
      }}
    >
      {children({ isExpanded })}
    </ExpandableContext.Provider>
  )
}

// Expandable Trigger
interface ExpandableTriggerProps {
  children: ReactNode
  className?: string
}

export function ExpandableTrigger({ children, className }: ExpandableTriggerProps) {
  const { setIsExpanded, isExpanded, onExpandStart, onExpandEnd } = useExpandable()

  const handleClick = () => {
    onExpandStart?.()
    setIsExpanded(!isExpanded)
    setTimeout(() => {
      onExpandEnd?.()
    }, 300)
  }

  return (
    <div
      className={cn("cursor-pointer", className)}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

// Expandable Card
interface ExpandableCardProps {
  children: ReactNode
  className?: string
  collapsedSize: { width: number; height: number }
  expandedSize: { width: number; height: number }
  hoverToExpand?: boolean
  expandDelay?: number
  collapseDelay?: number
  expandDirection?: "horizontal" | "vertical" | "both"
  expandBehavior?: "push" | "replace"
}

export function ExpandableCard({
  children,
  className,
  collapsedSize,
  expandedSize,
  hoverToExpand = false,
  expandDelay = 0,
  collapseDelay = 0,
  expandDirection: cardExpandDirection,
  expandBehavior: cardExpandBehavior,
}: ExpandableCardProps) {
  const { isExpanded, expandDirection, expandBehavior } = useExpandable()

  // Use card-specific props if provided, otherwise fall back to context
  const finalExpandDirection = cardExpandDirection || expandDirection
  const finalExpandBehavior = cardExpandBehavior || expandBehavior

  const getSize = () => {
    if (isExpanded) {
      return expandedSize
    }
    return collapsedSize
  }

  const size = getSize()

  return (
    <motion.div
      className={cn("relative overflow-hidden", className)}
      initial={{
        width: collapsedSize.width,
        height: collapsedSize.height,
      }}
      animate={{
        width: finalExpandDirection === "vertical" ? collapsedSize.width : size.width,
        height: finalExpandDirection === "horizontal" ? collapsedSize.height : size.height,
      }}
      transition={{
        duration: 0.4,
        delay: isExpanded ? expandDelay : collapseDelay,
        ease: [0.4, 0, 0.2, 1],
      }}
      onMouseEnter={hoverToExpand ? () => {
        setTimeout(() => {
          // Handle hover expansion if needed
        }, 100)
      } : undefined}
    >
      {children}
    </motion.div>
  )
}

// Expandable Card Header
interface ExpandableCardHeaderProps {
  children: ReactNode
  className?: string
}

export function ExpandableCardHeader({ children, className }: ExpandableCardHeaderProps) {
  return (
    <div className={cn("p-4", className)}>
      {children}
    </div>
  )
}

// Expandable Card Content
interface ExpandableCardContentProps {
  children: ReactNode
  className?: string
}

export function ExpandableCardContent({ children, className }: ExpandableCardContentProps) {
  return (
    <div className={cn("p-4", className)}>
      {children}
    </div>
  )
}

// Expandable Card Footer
interface ExpandableCardFooterProps {
  children: ReactNode
  className?: string
}

export function ExpandableCardFooter({ children, className }: ExpandableCardFooterProps) {
  return (
    <div className={cn("p-4 border-t", className)}>
      {children}
    </div>
  )
}

// Expandable Content with animations
interface ExpandableContentProps {
  children: ReactNode
  className?: string
  preset?: "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "blur-sm" | "blur-md"
  stagger?: boolean
  staggerChildren?: number
  keepMounted?: boolean
  animateIn?: {
    initial: any
    animate: any
    exit?: any
    transition: any
  }
}

export function ExpandableContent({
  children,
  className,
  preset = "fade",
  stagger = false,
  staggerChildren = 0.1,
  keepMounted = false,
  animateIn,
}: ExpandableContentProps) {
  const { isExpanded } = useExpandable()

  const getAnimationProps = () => {
    if (animateIn) {
      return animateIn
    }

    const presets = {
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
      },
      "slide-up": {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 30 },
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
      },
      "slide-down": {
        initial: { opacity: 0, y: -30 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -30 },
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
      },
      "slide-left": {
        initial: { opacity: 0, x: 30 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 30 },
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
      },
      "slide-right": {
        initial: { opacity: 0, x: -30 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -30 },
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
      },
      "blur-sm": {
        initial: { opacity: 0, filter: "blur(4px)" },
        animate: { opacity: 1, filter: "blur(0px)" },
        exit: { opacity: 0, filter: "blur(4px)" },
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
      },
      "blur-md": {
        initial: { opacity: 0, filter: "blur(8px)" },
        animate: { opacity: 1, filter: "blur(0px)" },
        exit: { opacity: 0, filter: "blur(8px)" },
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
      }
    }

    return presets[preset]
  }

  const animationProps = getAnimationProps()

  if (keepMounted) {
    return (
      <motion.div
        className={className}
        initial={animationProps.initial}
        animate={isExpanded ? animationProps.animate : animationProps.initial}
        transition={animationProps.transition}
      >
        {stagger ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isExpanded ? { opacity: 1 } : { opacity: 0 }}
            transition={{ staggerChildren: staggerChildren }}
          >
            {children}
          </motion.div>
        ) : (
          children
        )}
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          className={className}
          initial={animationProps.initial}
          animate={animationProps.animate}
          exit={animationProps.exit || animationProps.initial}
          transition={{
            ...animationProps.transition,
            delay: 0.1, // Small delay to let the card expand first
          }}
        >
          {stagger ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ 
                staggerChildren: staggerChildren,
                delayChildren: 0.1,
              }}
            >
              {children}
            </motion.div>
          ) : (
            children
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
