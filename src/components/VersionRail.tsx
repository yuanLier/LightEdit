import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { X } from 'lucide-react'
import type { Version } from '../types'
import ContextMenu, { getContextMenuPosition } from './ContextMenu'

type VersionRailProps = {
  versions: Version[]
  activeVersionId: string
  onSelectVersion: (versionId: string) => void
  onDeleteVersion: (versionId: string) => void
}

export default function VersionRail({
  versions,
  activeVersionId,
  onSelectVersion,
  onDeleteVersion,
}: VersionRailProps) {
  const canDelete = versions.length > 1
  const activeRowRef = useRef<HTMLDivElement>(null)
  const [contextVersionId, setContextVersionId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const contextVersion = versions.find((version) => version.id === contextVersionId)

  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeVersionId])

  function openContextMenu(event: MouseEvent, versionId: string) {
    event.preventDefault()
    event.stopPropagation()
    setContextVersionId(versionId)
    setMenuPosition(getContextMenuPosition(event, { width: 164, height: 84 }))
  }

  function runMenuAction(action: () => void) {
    setMenuPosition(null)
    action()
  }

  return (
    <aside
      className="versionRail"
      aria-label="Versions"
      onContextMenu={(event) => event.preventDefault()}
    >
      {versions.map((version) => {
        const active = version.id === activeVersionId
        return (
          <div
            key={version.id}
            ref={active ? activeRowRef : undefined}
            className={`versionRow ${active ? 'active' : ''}`}
            onContextMenu={(event) => openContextMenu(event, version.id)}
          >
            <button className="versionSelect" onClick={() => onSelectVersion(version.id)}>
              <span>v{version.versionIndex}</span>
            </button>
            {canDelete && (
              <button
                className="iconButton versionDelete"
                aria-label={`Delete v${version.versionIndex}`}
                title={`Delete v${version.versionIndex}`}
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
          <button
            role="menuitem"
            onClick={() => runMenuAction(() => onSelectVersion(contextVersion.id))}
          >
            Switch to Version
          </button>
          <div className="contextMenuSeparator" />
          <button
            className="danger"
            role="menuitem"
            disabled={!canDelete}
            onClick={() => runMenuAction(() => onDeleteVersion(contextVersion.id))}
          >
            Delete Version...
          </button>
        </ContextMenu>
      )}
    </aside>
  )
}
