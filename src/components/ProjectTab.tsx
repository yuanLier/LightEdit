import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent } from 'react'
import { X } from 'lucide-react'
import type { Project } from '../types'
import ContextMenu, { getContextMenuPosition } from './ContextMenu'

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

  function runMenuAction(action: () => void) {
    setMenuPosition(null)
    action()
  }

  function openContextMenu(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    setMenuPosition(getContextMenuPosition(event, { width: 164, height: 126 }))
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
        <ContextMenu position={menuPosition} onClose={() => setMenuPosition(null)}>
          <button role="menuitem" onClick={() => runMenuAction(onStartRename)}>
            Rename Project
          </button>
          <button role="menuitem" onClick={() => runMenuAction(onClose)}>
            Close Tab
          </button>
          <div className="contextMenuSeparator" />
          <button
            className="danger"
            role="menuitem"
            onClick={() => runMenuAction(onDelete)}
          >
            Delete Project...
          </button>
        </ContextMenu>
      )}
    </div>
  )
}
