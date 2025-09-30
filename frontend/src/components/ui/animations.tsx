import { cn } from "@/lib/utils"

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function FadeIn({ children, delay = 0, duration = 300, className }: FadeInProps) {
  return (
    <div 
      className={cn(
        "animate-in fade-in-0",
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  )
}

interface SlideInProps {
  children: React.ReactNode
  direction?: "up" | "down" | "left" | "right"
  delay?: number
  duration?: number
  className?: string
}

export function SlideIn({ 
  children, 
  direction = "up", 
  delay = 0, 
  duration = 300, 
  className 
}: SlideInProps) {
  const directionClasses = {
    up: "slide-in-from-bottom-2",
    down: "slide-in-from-top-2", 
    left: "slide-in-from-right-2",
    right: "slide-in-from-left-2"
  }

  return (
    <div 
      className={cn(
        "animate-in fade-in-0",
        directionClasses[direction],
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  )
}

interface StaggerProps {
  children: React.ReactNode[]
  staggerDelay?: number
  className?: string
}

export function Stagger({ children, staggerDelay = 100, className }: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </div>
  )
}

interface HoverScaleProps {
  children: React.ReactNode
  scale?: number
  className?: string
}

export function HoverScale({ children, scale = 1.05, className }: HoverScaleProps) {
  return (
    <div 
      className={cn(
        "transition-transform duration-200 hover:scale-105",
        className
      )}
      style={{ transform: `scale(${scale})` }}
    >
      {children}
    </div>
  )
}

interface PulseProps {
  children: React.ReactNode
  className?: string
}

export function Pulse({ children, className }: PulseProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      {children}
    </div>
  )
}

interface BounceProps {
  children: React.ReactNode
  className?: string
}

export function Bounce({ children, className }: BounceProps) {
  return (
    <div className={cn("animate-bounce", className)}>
      {children}
    </div>
  )
}

interface ShakeProps {
  children: React.ReactNode
  className?: string
}

export function Shake({ children, className }: ShakeProps) {
  return (
    <div className={cn("animate-shake", className)}>
      {children}
    </div>
  )
}

// Кастомные анимации для Tailwind
export const customAnimations = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes slide-in-from-bottom {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-in-from-bottom {
  animation: slide-in-from-bottom 0.3s ease-out;
}

@keyframes slide-in-from-top {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-in-from-top {
  animation: slide-in-from-top 0.3s ease-out;
}

@keyframes slide-in-from-left {
  from {
    transform: translateX(-10px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-from-left {
  animation: slide-in-from-left 0.3s ease-out;
}

@keyframes slide-in-from-right {
  from {
    transform: translateX(10px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-from-right {
  animation: slide-in-from-right 0.3s ease-out;
}
`
