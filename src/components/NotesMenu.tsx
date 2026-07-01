import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent } from 'react'
import { Plus } from 'lucide-react'
import type { Project } from '../types'
import ContextMenu, { getContextMenuPosition } from './ContextMenu'

type NotesMenuProps = {
  projects: Project[]
  activeProjectId: string
  onOpenProject: (projectId: string) => void
  onRenameProject: (projectId: string, name: string) => void
  onDeleteProject: (projectId: string) => void
  onNewProject: () => void
}

export default function NotesMenu({
  projects,
  activeProjectId,
  onOpenProject,
  onRenameProject,
  onDeleteProject,
  onNewProject,
}: NotesMenuProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [contextProjectId, setContextProjectId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')

  const contextProject = projects.find((project) => project.id === contextProjectId)

  useEffect(() => {
    if (!renamingProjectId) return
    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [renamingProjectId])

  function openContextMenu(event: MouseEvent, projectId: string) {
    event.preventDefault()
    event.stopPropagation()
    setContextProjectId(projectId)
    setMenuPosition(getContextMenuPosition(event, { width: 164, height: 126 }))
  }

  function runMenuAction(action: () => void) {
    setMenuPosition(null)
    action()
  }

  function startRename(project: Project) {
    setDraftName(project.name)
    setRenamingProjectId(project.id)
  }

  function commitRename(project: Project) {
    const nextName = draftName.trim()
    setRenamingProjectId(null)
    if (nextName && nextName !== project.name) {
      onRenameProject(project.id, nextName)
    }
  }

  function handleRenameKeyDown(event: ReactKeyboardEvent<HTMLInputElement>, project: Project) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitRename(project)
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setRenamingProjectId(null)
      setDraftName('')
    }
  }

  return (
    <div className="notesMenu" role="menu" onContextMenu={(event) => event.preventDefault()}>
      <div className="notesMenuList">
        {projects.map((project) => {
          const active = project.id === activeProjectId
          const renaming = project.id === renamingProjectId

          if (renaming) {
            return (
              <div
                key={project.id}
                className={`notesMenuItem notesMenuItemEditing ${active ? 'active' : ''}`}
                role="menuitem"
                onContextMenu={(event) => openContextMenu(event, project.id)}
              >
                <input
                  ref={inputRef}
                  className="notesMenuRename"
                  aria-label={`Rename ${project.name}`}
                  value={draftName}
                  onBlur={() => commitRename(project)}
                  onChange={(event) => setDraftName(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => handleRenameKeyDown(event, project)}
                />
                <small>{new Date(project.lastOpenedAt).toLocaleDateString()}</small>
              </div>
            )
          }

          return (
            <button
              key={project.id}
              className={`notesMenuItem ${active ? 'active' : ''}`}
              onClick={() => onOpenProject(project.id)}
              onContextMenu={(event) => openContextMenu(event, project.id)}
              role="menuitem"
            >
              <span>{project.name}</span>
              <small>{new Date(project.lastOpenedAt).toLocaleDateString()}</small>
            </button>
          )
        })}
      </div>
      <button
        className="notesNewProject"
        onClick={onNewProject}
        onContextMenu={(event) => event.preventDefault()}
      >
        <Plus size={15} strokeWidth={1.8} />
        <span>New Project</span>
      </button>
      {menuPosition && contextProject && (
        <ContextMenu position={menuPosition} onClose={() => setMenuPosition(null)}>
          <button role="menuitem" onClick={() => runMenuAction(() => onOpenProject(contextProject.id))}>
            Open Project
          </button>
          <button role="menuitem" onClick={() => runMenuAction(() => startRename(contextProject))}>
            Rename Project
          </button>
          <div className="contextMenuSeparator" />
          <button
            className="danger"
            role="menuitem"
            onClick={() => runMenuAction(() => onDeleteProject(contextProject.id))}
          >
            Delete Project...
          </button>
        </ContextMenu>
      )}
    </div>
  )
}
