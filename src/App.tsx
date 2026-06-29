import { useEffect, useMemo, useState } from 'react'
import EditorPane from './components/EditorPane'
import EditorToolbar from './components/EditorToolbar'
import Toast from './components/Toast'
import TopBar from './components/TopBar'
import VersionRail from './components/VersionRail'
import { formatContent } from './formatters'
import { createDefaultState, createId, loadState, saveState } from './storage'
import type { AppState, Project, TextType, ToastState, Version } from './types'

function sortVersions(versions: Version[]) {
  return [...versions].sort((a, b) => b.versionIndex - a.versionIndex)
}

function firstVersionForProject(state: AppState, projectId: string) {
  return sortVersions(state.versions.filter((version) => version.projectId === projectId))[0]
}

function createProjectWithVersion(name: string): { project: Project; version: Version } {
  const now = Date.now()
  const project: Project = {
    id: createId(),
    name,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  }
  const version: Version = {
    id: createId(),
    projectId: project.id,
    versionIndex: 1,
    type: 'text',
    content: '',
    isStarred: false,
    createdAt: now,
    updatedAt: now,
  }
  return { project, version }
}

function nextProjectName(projects: Project[]) {
  const maxNumber = projects.reduce((max, project) => {
    const match = /^Project (\d+)$/.exec(project.name)
    return match ? Math.max(max, Number(match[1])) : max
  }, projects.length)
  return `Project ${maxNumber + 1}`
}

function projectExists(projects: Project[], projectId: string) {
  return projects.some((project) => project.id === projectId)
}

function neighborProjectId(state: AppState, deletedProjectId: string, remainingProjects: Project[]) {
  const openOrder = state.openProjectIds.filter((projectId) => projectExists(state.projects, projectId))
  const allOrder = state.projects.map((project) => project.id)
  const order = openOrder.includes(deletedProjectId) ? openOrder : allOrder
  const deletedIndex = order.indexOf(deletedProjectId)

  if (deletedIndex >= 0) {
    const left = order
      .slice(0, deletedIndex)
      .reverse()
      .find((projectId) => projectExists(remainingProjects, projectId))
    const right = order
      .slice(deletedIndex + 1)
      .find((projectId) => projectExists(remainingProjects, projectId))
    return left ?? right ?? remainingProjects[0]?.id
  }

  return remainingProjects[0]?.id
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState() ?? createDefaultState())
  const [notesOpen, setNotesOpen] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const activeProject = state.projects.find((project) => project.id === state.activeProjectId)
  const activeVersion = state.versions.find((version) => version.id === state.activeVersionId)
  const projectVersions = useMemo(
    () => sortVersions(state.versions.filter((version) => version.projectId === state.activeProjectId)),
    [state.activeProjectId, state.versions],
  )
  const openProjects = state.openProjectIds
    .map((projectId) => state.projects.find((project) => project.id === projectId))
    .filter((project): project is Project => Boolean(project))

  useEffect(() => {
    const timer = window.setTimeout(() => saveState(state), 300)
    return () => window.clearTimeout(timer)
  }, [state])

  useEffect(() => {
    const handleBeforeUnload = () => saveState(state)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [state])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  function showToast(message: string) {
    setToast({ id: Date.now(), message })
  }

  function updateActiveVersion(patch: Partial<Version>) {
    setState((current) => ({
      ...current,
      versions: current.versions.map((version) =>
        version.id === current.activeVersionId
          ? { ...version, ...patch, updatedAt: Date.now() }
          : version,
      ),
    }))
  }

  function openProject(projectId: string) {
    setState((current) => {
      const version = firstVersionForProject(current, projectId)
      if (!version) return current
      const now = Date.now()
      return {
        ...current,
        projects: current.projects.map((project) =>
          project.id === projectId ? { ...project, lastOpenedAt: now, updatedAt: now } : project,
        ),
        openProjectIds: current.openProjectIds.includes(projectId)
          ? current.openProjectIds
          : [...current.openProjectIds, projectId],
        activeProjectId: projectId,
        activeVersionId: version.id,
      }
    })
    setNotesOpen(false)
  }

  function addProject() {
    setState((current) => {
      const { project, version } = createProjectWithVersion(nextProjectName(current.projects))
      return {
        ...current,
        projects: [...current.projects, project],
        versions: [...current.versions, version],
        openProjectIds: [...current.openProjectIds, project.id],
        activeProjectId: project.id,
        activeVersionId: version.id,
      }
    })
    setNotesOpen(false)
  }

  function deleteProject(projectId: string) {
    const project = state.projects.find((candidate) => candidate.id === projectId)
    if (!project) return

    const hasStarredVersion = state.versions.some(
      (version) => version.projectId === projectId && version.isStarred,
    )
    if (
      hasStarredVersion &&
      !window.confirm(`"${project.name}" has starred versions. Delete this project?`)
    ) {
      showToast('Delete canceled')
      return
    }

    setState((current) => {
      const remainingProjects = current.projects.filter((candidate) => candidate.id !== projectId)
      const remainingVersions = current.versions.filter((version) => version.projectId !== projectId)

      if (remainingProjects.length === 0) {
        const { project: fallbackProject, version: fallbackVersion } = createProjectWithVersion('LightEdit')
        return {
          ...current,
          projects: [fallbackProject],
          versions: [fallbackVersion],
          openProjectIds: [fallbackProject.id],
          activeProjectId: fallbackProject.id,
          activeVersionId: fallbackVersion.id,
        }
      }

      const nextActiveProjectId =
        current.activeProjectId === projectId
          ? neighborProjectId(current, projectId, remainingProjects)
          : current.activeProjectId
      const safeActiveProjectId = nextActiveProjectId ?? remainingProjects[0].id
      const nextState = {
        ...current,
        projects: remainingProjects,
        versions: remainingVersions,
      }
      const nextVersion = firstVersionForProject(nextState, safeActiveProjectId)
      const remainingOpen = current.openProjectIds.filter(
        (id) => id !== projectId && projectExists(remainingProjects, id),
      )
      const nextOpenProjectIds = remainingOpen.includes(safeActiveProjectId)
        ? remainingOpen
        : [...remainingOpen, safeActiveProjectId]

      return {
        ...nextState,
        openProjectIds: nextOpenProjectIds,
        activeProjectId: safeActiveProjectId,
        activeVersionId: nextVersion?.id ?? remainingVersions[0]?.id ?? current.activeVersionId,
      }
    })
    setNotesOpen(false)
    showToast(`Deleted ${project.name}`)
  }

  function addVersion() {
    if (!activeVersion) return
    setState((current) => {
      const currentVersion = current.versions.find((version) => version.id === current.activeVersionId)
      if (!currentVersion) return current
      const now = Date.now()
      const versionsForProject = current.versions.filter(
        (version) => version.projectId === current.activeProjectId,
      )
      const maxIndex = Math.max(...versionsForProject.map((version) => version.versionIndex))
      const newVersion: Version = {
        id: createId(),
        projectId: current.activeProjectId,
        versionIndex: maxIndex + 1,
        type: currentVersion.type,
        content: currentVersion.content,
        isStarred: false,
        createdAt: now,
        updatedAt: now,
      }
      return {
        ...current,
        versions: [...current.versions, newVersion],
        activeVersionId: newVersion.id,
      }
    })
  }

  function deleteVersion(versionId: string) {
    const versionToDelete = state.versions.find((version) => version.id === versionId)
    if (!versionToDelete) return

    const versionsForActiveProject = state.versions.filter(
      (version) => version.projectId === state.activeProjectId,
    )
    if (versionsForActiveProject.length <= 1) {
      showToast('Keep at least one version')
      return
    }

    if (
      versionToDelete.isStarred &&
      !window.confirm(`v${versionToDelete.versionIndex} is starred. Delete this version?`)
    ) {
      showToast('Delete canceled')
      return
    }

    setState((current) => {
      const versionsForProject = sortVersions(
        current.versions.filter((version) => version.projectId === current.activeProjectId),
      )

      if (current.activeVersionId !== versionId) {
        return {
          ...current,
          versions: current.versions.filter((version) => version.id !== versionId),
        }
      }

      const deletedIndex = versionsForProject.findIndex((version) => version.id === versionId)
      const nextVersion = versionsForProject[deletedIndex + 1] ?? versionsForProject[deletedIndex - 1]
      return {
        ...current,
        versions: current.versions.filter((version) => version.id !== versionId),
        activeVersionId: nextVersion.id,
      }
    })
    showToast(`Deleted v${versionToDelete.versionIndex}`)
  }

  function formatCurrent() {
    if (!activeVersion) return
    if (activeVersion.type === 'text') {
      showToast('Text has no formatter')
      return
    }

    try {
      updateActiveVersion({ content: formatContent(activeVersion.type, activeVersion.content) })
      showToast(activeVersion.type === 'json' ? 'JSON formatted' : 'SQL formatted')
    } catch {
      showToast(activeVersion.type === 'json' ? 'Invalid JSON' : 'Format failed')
    }
  }

  if (!activeProject || !activeVersion) {
    return null
  }

  return (
    <main className="appFrame">
      <section className="windowShell" aria-label="LightEdit">
        <TopBar
          projects={state.projects}
          openProjects={openProjects}
          activeProjectId={state.activeProjectId}
          isPinned={state.isPinned}
          notesOpen={notesOpen}
          onToggleNotes={() => setNotesOpen((open) => !open)}
          onCloseNotes={() => setNotesOpen(false)}
          onOpenProject={openProject}
          onAddProject={addProject}
          onDeleteProject={deleteProject}
          onTogglePin={() => setState((current) => ({ ...current, isPinned: !current.isPinned }))}
        />
        <div className="workbench">
          <VersionRail
            versions={projectVersions}
            activeVersionId={state.activeVersionId}
            onSelectVersion={(versionId) => setState((current) => ({ ...current, activeVersionId: versionId }))}
            onDeleteVersion={deleteVersion}
          />
          <section className="editorColumn" aria-label={`${activeProject.name} editor`}>
            <EditorToolbar
              version={activeVersion}
              onTypeChange={(type: TextType) => updateActiveVersion({ type })}
              onAddVersion={addVersion}
              onFormat={formatCurrent}
              onToggleStar={() => updateActiveVersion({ isStarred: !activeVersion.isStarred })}
            />
            <EditorPane
              type={activeVersion.type}
              content={activeVersion.content}
              onChange={(content) => updateActiveVersion({ content })}
            />
          </section>
        </div>
      </section>
      <Toast toast={toast} />
    </main>
  )
}
