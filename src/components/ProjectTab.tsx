import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { Project } from '../types'

type ProjectTabProps = {
  project: Project
  active: boolean
  onSelect: () => void
  onDelete: () => void
}

export default function ProjectTab({
  project,
  active,
  onSelect,
  onDelete,
}: ProjectTabProps) {
  const tabRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    tabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [active])

  return (
    <div ref={tabRef} className={`projectTab ${active ? 'active' : ''}`}>
      <button className="projectTabButton" data-window-control title={project.name} onClick={onSelect}>
        <span>{project.name}</span>
      </button>
      <button
        className="iconButton tabClose"
        data-window-control
        aria-label={`Delete ${project.name}`}
        title={`Delete ${project.name}`}
        onClick={(event) => {
          event.stopPropagation()
          onDelete()
        }}
      >
        <X size={15} strokeWidth={1.7} />
      </button>
    </div>
  )
}
