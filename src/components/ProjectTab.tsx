import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent } from 'react'
import { X } from 'lucide-react'
import type { Project } from '../types'

type ProjectTabProps = {
  project: Project
  active: boolean
  renaming: boolean
  onSelect: () => void
  onStartRename: () => void
  onRename: (name: string) => void
  onCancelRename: () => void
  onClose: () => void
  onDelete: () => void
}

export default function ProjectTab({
  project,
  active,
  renaming,
  onSelect,
  onStartRename,
  onRename,
  onCancelRename,
  onClose,
  onDelete,
}: ProjectTabProps) {
  const tabRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [draftName, setDraftName] = useState(project.name)
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!active) return
    tabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [active])

  useEffect(() => {
    if (!renaming) return
    setDraftName(project.name)
    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [project.name, renaming])

  useEffect(() => {
    if (!menuPosition) return

    function closeMenu(event: PointerEvent) {
      const target = event.target
      if (target instanceof Node && menuRef.current?.contains(target)) return
      setMenuPosition(null)
    }

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setMenuPosition(null)
    }

    document.addEventListener('pointerdown', closeMenu, true)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeMenu, true)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuPosition])

  function runMenuAction(action: () => void) {
    setMenuPosition(null)
    action()
  }

  function openContextMenu(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    const menuWidth = 164
    const menuHeight = 126
    setMenuPosition({
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight - 8)),
    })
  }

  function commitRename() {
    const nextName = draftName.trim()
    if (nextName && nextName !== project.name) {
      onRename(nextName)
      return
    }
    onCancelRename()
  }

  function handleRenameKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitRename()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancelRename()
    }
  }

  return (
    <div
      ref={tabRef}
      className={`projectTab ${active ? 'active' : ''}`}
      data-tauri-drag-region
      onContextMenu={openContextMenu}
    >
      {renaming ? (
        <input
          ref={inputRef}
          className="projectTabRename"
          data-window-control
          aria-label={`Rename ${project.name}`}
          value={draftName}
          onBlur={commitRename}
          onChange={(event) => setDraftName(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={handleRenameKeyDown}
        />
      ) : (
        <button className="projectTabButton" data-window-control title={project.name} onClick={onSelect}>
          <span>{project.name}</span>
        </button>
      )}
      <button
        className="iconButton tabClose"
        data-window-control
        aria-label={`Close ${project.name}`}
        title={`Close ${project.name}`}
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
      >
        <X size={15} strokeWidth={1.7} />
      </button>
      {menuPosition && (
        <div
          ref={menuRef}
          className="tabContextMenu"
          role="menu"
          style={{ left: menuPosition.x, top: menuPosition.y }}
          data-window-control
          onContextMenu={(event) => event.preventDefault()}
        >
          <button role="menuitem" onClick={() => runMenuAction(onStartRename)}>
            Rename Project
          </button>
          <button role="menuitem" onClick={() => runMenuAction(onClose)}>
            Close Tab
          </button>
          <div className="tabContextSeparator" />
          <button
            className="danger"
            role="menuitem"
            onClick={() => runMenuAction(onDelete)}
          >
            Delete Project...
          </button>
        </div>
      )}
    </div>
  )
}
