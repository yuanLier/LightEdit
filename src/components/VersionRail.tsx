import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent } from 'react'
import { X } from 'lucide-react'
import type { Version } from '../types'
import { versionLabel } from '../versionLabel'
import ContextMenu, { getContextMenuPosition } from './ContextMenu'

type VersionRailProps = {
  versions: Version[]
  activeVersionId: string
  onSelectVersion: (versionId: string) => void
  onRenameVersion: (versionId: string, name: string) => void
  onDeleteVersion: (versionId: string) => void
}

export default function VersionRail({
  versions,
  activeVersionId,
  onSelectVersion,
  onRenameVersion,
  onDeleteVersion,
}: VersionRailProps) {
  const canDelete = versions.length > 1
  const activeRowRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [contextVersionId, setContextVersionId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [renamingVersionId, setRenamingVersionId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const contextVersion = versions.find((version) => version.id === contextVersionId)

  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeVersionId])

  useEffect(() => {
    if (!renamingVersionId) return
    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [renamingVersionId])

  function openContextMenu(event: MouseEvent, versionId: string) {
    event.preventDefault()
    event.stopPropagation()
    setContextVersionId(versionId)
    setMenuPosition(getContextMenuPosition(event, { width: 164, height: 44 }))
  }

  function runMenuAction(action: () => void) {
    setMenuPosition(null)
    action()
  }

  function startRename(version: Version) {
    setDraftName(versionLabel(version))
    setRenamingVersionId(version.id)
  }

  function commitRename(version: Version) {
    const nextName = draftName.trim()
    setRenamingVersionId(null)
    if (nextName && nextName !== versionLabel(version)) {
      onRenameVersion(version.id, nextName)
    }
  }

  function handleRenameKeyDown(event: ReactKeyboardEvent<HTMLInputElement>, version: Version) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitRename(version)
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setRenamingVersionId(null)
      setDraftName('')
    }
  }

  return (
    <aside
      className="versionRail"
      aria-label="Versions"
      onContextMenu={(event) => event.preventDefault()}
    >
      {versions.map((version) => {
        const active = version.id === activeVersionId
        const label = versionLabel(version)
        const renaming = version.id === renamingVersionId
        return (
          <div
            key={version.id}
            ref={active ? activeRowRef : undefined}
            className={`versionRow ${active ? 'active' : ''}`}
            onContextMenu={(event) => openContextMenu(event, version.id)}
          >
            {renaming ? (
              <div className="versionRenameWrap">
                <input
                  ref={inputRef}
                  className="versionRename"
                  aria-label={`Rename ${label}`}
                  value={draftName}
                  onBlur={() => commitRename(version)}
                  onChange={(event) => setDraftName(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => handleRenameKeyDown(event, version)}
                />
              </div>
            ) : (
              <button className="versionSelect" onClick={() => onSelectVersion(version.id)}>
                <span>{label}</span>
              </button>
            )}
            {canDelete && (
              <button
                className="iconButton versionDelete"
                aria-label={`Delete ${label}`}
                title={`Delete ${label}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onDeleteVersion(version.id)
                }}
              >
                <X size={16} strokeWidth={1.7} />
              </button>
            )}
          </div>
        )
      })}
      {menuPosition && contextVersion && (
        <ContextMenu position={menuPosition} onClose={() => setMenuPosition(null)}>
          <button role="menuitem" onClick={() => runMenuAction(() => startRename(contextVersion))}>
            Rename Version
          </button>
        </ContextMenu>
      )}
    </aside>
  )
}
