import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { Version } from '../types'

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

  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeVersionId])

  return (
    <aside className="versionRail" aria-label="Versions">
      {versions.map((version) => {
        const active = version.id === activeVersionId
        return (
          <div
            key={version.id}
            ref={active ? activeRowRef : undefined}
            className={`versionRow ${active ? 'active' : ''}`}
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
    </aside>
  )
}
