import { useEffect, useRef } from 'react'
import { ChevronDown, Pin, Plus } from 'lucide-react'
import type { Project } from '../types'
import NotesMenu from './NotesMenu'
import ProjectTab from './ProjectTab'

type TopBarProps = {
  projects: Project[]
  openProjects: Project[]
  activeProjectId: string
  renamingProjectId: string | null
  isPinned: boolean
  notesOpen: boolean
  onToggleNotes: () => void
  onCloseNotes: () => void
  onOpenProject: (projectId: string) => void
  onAddProject: () => void
  onStartRenameProject: (projectId: string) => void
  onRenameProject: (projectId: string, name: string) => void
  onCancelRenameProject: () => void
  onCloseProject: (projectId: string) => void
  onDeleteProject: (projectId: string) => void
  onTogglePin: () => void
}

export default function TopBar({
  projects,
  openProjects,
  activeProjectId,
  renamingProjectId,
  isPinned,
  notesOpen,
  onToggleNotes,
  onCloseNotes,
  onOpenProject,
  onAddProject,
  onStartRenameProject,
  onRenameProject,
  onCancelRenameProject,
  onCloseProject,
  onDeleteProject,
  onTogglePin,
}: TopBarProps) {
  const notesMenuSlotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!notesOpen) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (notesMenuSlotRef.current?.contains(target)) return
      onCloseNotes()
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [notesOpen, onCloseNotes])

  return (
    <header
      className="topBar"
      data-tauri-drag-region
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="notesSlot" aria-hidden="true" />
      <div className="tabsViewport" data-tauri-drag-region>
        <div className="tabsTrack" data-tauri-drag-region>
          {openProjects.map((project) => (
            <ProjectTab
              key={project.id}
              project={project}
              active={project.id === activeProjectId}
              renaming={project.id === renamingProjectId}
              onSelect={() => onOpenProject(project.id)}
              onStartRename={() => onStartRenameProject(project.id)}
              onRename={(name) => onRenameProject(project.id, name)}
              onCancelRename={onCancelRenameProject}
              onClose={() => onCloseProject(project.id)}
              onDelete={() => onDeleteProject(project.id)}
            />
          ))}
        </div>
      </div>
      <button
        className="addProjectButton"
        data-window-control
        aria-label="New project"
        title="New project"
        onClick={onAddProject}
      >
        <Plus size={22} strokeWidth={1.7} />
      </button>
      <div className="notesMenuSlot" ref={notesMenuSlotRef}>
        <button
          className={`notesMenuButton ${notesOpen ? 'active' : ''}`}
          data-window-control
          aria-label="Open notes menu"
          title="All projects"
          onClick={onToggleNotes}
        >
          <span>Notes</span>
          <ChevronDown size={14} strokeWidth={1.8} />
        </button>
        {notesOpen && (
          <NotesMenu
            projects={projects}
            activeProjectId={activeProjectId}
            onOpenProject={onOpenProject}
            onRenameProject={onRenameProject}
            onDeleteProject={onDeleteProject}
            onNewProject={onAddProject}
          />
        )}
      </div>
      <button
        className={`pinButton ${isPinned ? 'active' : ''}`}
        data-window-control
        aria-label="Pin window on top"
        title="Pin window on top"
        onClick={onTogglePin}
      >
        <Pin className="pinIcon" size={20} strokeWidth={1.7} />
      </button>
    </header>
  )
}
