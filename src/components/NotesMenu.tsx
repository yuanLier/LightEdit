import { Plus } from 'lucide-react'
import type { Project } from '../types'

type NotesMenuProps = {
  projects: Project[]
  activeProjectId: string
  onOpenProject: (projectId: string) => void
  onNewProject: () => void
}

export default function NotesMenu({
  projects,
  activeProjectId,
  onOpenProject,
  onNewProject,
}: NotesMenuProps) {
  return (
    <div className="notesMenu" role="menu">
      <div className="notesMenuList">
        {projects.map((project) => (
          <button
            key={project.id}
            className={`notesMenuItem ${project.id === activeProjectId ? 'active' : ''}`}
            onClick={() => onOpenProject(project.id)}
            role="menuitem"
          >
            <span>{project.name}</span>
            <small>{new Date(project.lastOpenedAt).toLocaleDateString()}</small>
          </button>
        ))}
      </div>
      <button className="notesNewProject" onClick={onNewProject}>
        <Plus size={15} strokeWidth={1.8} />
        <span>New Project</span>
      </button>
    </div>
  )
}
