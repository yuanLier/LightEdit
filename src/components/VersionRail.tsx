import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import type { Version } from '../types'
import { LIGHT_TOOLTIP_DELAY_MS } from '../uiTimings'
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
  const tooltipTimerRef = useRef<number | null>(null)
  const [contextVersionId, setContextVersionId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [renamingVersionId, setRenamingVersionId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null)
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

  useEffect(() => {
    return () => clearTooltipTimer()
  }, [])

  function clearTooltipTimer() {
    if (tooltipTimerRef.current === null) return
    window.clearTimeout(tooltipTimerRef.current)
    tooltipTimerRef.current = null
  }

  function openContextMenu(event: MouseEvent, versionId: string) {
    event.preventDefault()
    event.stopPropagation()
    hideTooltip()
    setContextVersionId(versionId)
    setMenuPosition(getContextMenuPosition(event, { width: 164, height: 84 }))
  }

  function runMenuAction(action: () => void) {
    setMenuPosition(null)
    action()
  }

  function startRename(version: Version) {
    setDraftName(versionLabel(version))
    setRenamingVersionId(version.id)
  }

  function shouldShowTooltip(label: string, target: HTMLElement) {
    const textNode = target.querySelector('span')
    if (label.length > 8) return true
    return textNode instanceof HTMLElement && textNode.scrollWidth > textNode.clientWidth + 1
  }

  function scheduleTooltip(target: HTMLElement, label: string) {
    clearTooltipTimer()
    setTooltip(null)
    if (!shouldShowTooltip(label, target)) return

    tooltipTimerRef.current = window.setTimeout(() => {
      if (!target.isConnected) return
      const rect = target.getBoundingClientRect()
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 7,
        label,
      })
    }, LIGHT_TOOLTIP_DELAY_MS)
  }

  function hideTooltip() {
    clearTooltipTimer()
    setTooltip(null)
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
              <button
                className="versionSelect"
                onBlur={hideTooltip}
                onClick={() => {
                  hideTooltip()
                  onSelectVersion(version.id)
                }}
                onFocus={(event) => scheduleTooltip(event.currentTarget, label)}
                onMouseEnter={(event) => scheduleTooltip(event.currentTarget, label)}
                onMouseLeave={hideTooltip}
              >
                <span>{label}</span>
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
      {tooltip &&
        createPortal(
          <div className="lightTooltip" role="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
            {tooltip.label}
          </div>,
          document.body,
        )}
    </aside>
  )
}
