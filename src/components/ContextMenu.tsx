import { useEffect, useRef } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type ContextMenuPosition = {
  x: number
  y: number
}

type ContextMenuSize = {
  width: number
  height: number
}

type ContextMenuProps = {
  position: ContextMenuPosition
  onClose: () => void
  children: ReactNode
  className?: string
}

export function getContextMenuPosition(
  event: MouseEvent,
  { width, height }: ContextMenuSize,
): ContextMenuPosition {
  return {
    x: Math.max(8, Math.min(event.clientX, window.innerWidth - width - 8)),
    y: Math.max(8, Math.min(event.clientY, window.innerHeight - height - 8)),
  }
}

export default function ContextMenu({ position, onClose, children, className }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function closeMenu(event: PointerEvent) {
      const target = event.target
      if (target instanceof Node && menuRef.current?.contains(target)) return
      onClose()
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('pointerdown', closeMenu, true)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeMenu, true)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return createPortal(
    <div
      ref={menuRef}
      className={className ? `contextMenu ${className}` : 'contextMenu'}
      role="menu"
      style={{ left: position.x, top: position.y }}
      data-lightedit-floating-menu
      data-window-control
      onContextMenu={(event) => event.preventDefault()}
    >
      {children}
    </div>,
    document.body,
  )
}
