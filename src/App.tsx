import { useEffect, useMemo, useState } from 'react'
import EditorPane from './components/EditorPane'
import EditorToolbar from './components/EditorToolbar'
import Toast from './components/Toast'
import TopBar from './components/TopBar'
import VersionRail from './components/VersionRail'
import { listenForEditorFocusRequest, setMainWindowAlwaysOnTop } from './desktop'
import { formatContent } from './formatters'
import { createDefaultState, createId, loadState, saveState } from './storage'
import {
  addProject as addProjectTransition,
  addVersion as addVersionTransition,
  closeProjectTab as closeProjectTabTransition,
  deleteProject as deleteProjectTransition,
  deleteVersion as deleteVersionTransition,
  openProject as openProjectTransition,
  renameProject as renameProjectTransition,
  renameVersion as renameVersionTransition,
  selectVersion,
  sortVersions,
  updateActiveVersion as updateActiveVersionTransition,
} from './stateTransitions'
import type { AppState, Project, TextType, ToastState, Version } from './types'
import { ACTION_TOAST_DURATION_MS, NORMAL_TOAST_DURATION_MS } from './uiTimings'
import { versionLabel } from './versionLabel'

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState() ?? createDefaultState())
  const [notesOpen, setNotesOpen] = useState(false)
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null)
  const [renameSuggestionProjectId, setRenameSuggestionProjectId] = useState<string | null>(null)
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
    const duration = toast.action ? ACTION_TOAST_DURATION_MS : NORMAL_TOAST_DURATION_MS
    const timer = window.setTimeout(() => setToast(null), duration)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    let canceled = false
    let unlisten: (() => void) | undefined

    listenForEditorFocusRequest(() => {
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLTextAreaElement>('.codeInput')?.focus()
      })
    }).then((cleanup) => {
      if (canceled) {
        cleanup?.()
        return
      }
      unlisten = cleanup
    })

    return () => {
      canceled = true
      unlisten?.()
    }
  }, [])

  useEffect(() => {
    let canceled = false

    setMainWindowAlwaysOnTop(state.isPinned).catch(() => {
      if (!canceled) showToast('Pin unavailable')
    })

    return () => {
      canceled = true
    }
  }, [state.isPinned])

  function showToast(message: string, action?: ToastState['action']) {
    setToast({ id: Date.now(), message, action })
  }

  function transitionOptions() {
    return { now: Date.now(), createId }
  }

  function updateActiveVersion(patch: Partial<Version>) {
    setState((current) => updateActiveVersionTransition(current, patch, Date.now()))
  }

  function openProject(projectId: string) {
    setState((current) => openProjectTransition(current, projectId, Date.now()))
    setNotesOpen(false)
  }

  function addProject() {
    const nextState = addProjectTransition(state, transitionOptions())
    setState(nextState)
    setRenamingProjectId(nextState.activeProjectId)
    setRenameSuggestionProjectId(nextState.activeProjectId)
    setNotesOpen(false)
  }

  function renameProject(projectId: string, name: string) {
    const project = state.projects.find((candidate) => candidate.id === projectId)
    const nextName = name.trim()
    setRenamingProjectId(null)
    setRenameSuggestionProjectId(null)
    if (!project || !nextName || nextName === project.name) return

    setState((current) => renameProjectTransition(current, projectId, nextName, Date.now()).state)
    showToast(`Renamed to ${nextName}`)
  }

  function closeProjectTab(projectId: string) {
    const result = closeProjectTabTransition(state, projectId)
    if (result.reason === 'keep-one') {
      showToast('Keep one tab open')
      return
    }
    if (!result.closed) return

    setState((current) => closeProjectTabTransition(current, projectId).state)
    setRenamingProjectId((current) => (current === projectId ? null : current))
    setRenameSuggestionProjectId((current) => (current === projectId ? null : current))
  }

  function deleteProject(projectId: string) {
    const project = state.projects.find((candidate) => candidate.id === projectId)
    if (!project) return
    const previousState = state

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

    setState((current) => deleteProjectTransition(current, projectId, transitionOptions()))
    setNotesOpen(false)
    setRenamingProjectId((current) => (current === projectId ? null : current))
    setRenameSuggestionProjectId((current) => (current === projectId ? null : current))
    showToast(`Deleted ${project.name}`, {
      label: 'Undo',
      onSelect: () => {
        setState((current) => ({ ...previousState, isPinned: current.isPinned }))
        setRenamingProjectId(null)
        setRenameSuggestionProjectId(null)
        setNotesOpen(false)
        showToast(`Restored ${project.name}`)
      },
    })
  }

  function addVersion() {
    if (!activeVersion) return
    setState((current) => addVersionTransition(current, transitionOptions()))
  }

  function deleteVersion(versionId: string) {
    const versionToDelete = state.versions.find((version) => version.id === versionId)
    if (!versionToDelete) return
    const label = versionLabel(versionToDelete)
    const previousState = state
    const deleteResult = deleteVersionTransition(state, versionId)

    if (deleteResult.reason === 'keep-one') {
      showToast('Keep at least one version')
      return
    }

    if (
      versionToDelete.isStarred &&
      !window.confirm(`${label} is starred. Delete this version?`)
    ) {
      showToast('Delete canceled')
      return
    }

    setState((current) => deleteVersionTransition(current, versionId).state)
    showToast(`Deleted ${label}`, {
      label: 'Undo',
      onSelect: () => {
        setState((current) => ({ ...previousState, isPinned: current.isPinned }))
        showToast(`Restored ${label}`)
      },
    })
  }

  function renameVersion(versionId: string, name: string) {
    const version = state.versions.find((candidate) => candidate.id === versionId)
    const nextName = name.trim()
    const currentName = version?.name?.trim() ?? ''
    if (!version || !nextName || nextName === currentName || nextName === versionLabel(version)) return

    setState((current) => renameVersionTransition(current, versionId, nextName, Date.now()).state)
    showToast(`Renamed to ${nextName}`)
  }

  function formatCurrent() {
    if (!activeVersion) return
    const result = formatContent(activeVersion.type, activeVersion.content)
    if (result.status === 'formatted') {
      updateActiveVersion({ content: result.content })
    }
    showToast(result.message)
  }

  function togglePin() {
    const nextPinned = !state.isPinned
    setState((current) => ({ ...current, isPinned: nextPinned }))
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
          renamingProjectId={renamingProjectId}
          renameSuggestionProjectId={renameSuggestionProjectId}
          isPinned={state.isPinned}
          notesOpen={notesOpen}
          onToggleNotes={() => setNotesOpen((open) => !open)}
          onCloseNotes={() => setNotesOpen(false)}
          onOpenProject={openProject}
          onAddProject={addProject}
          onStartRenameProject={(projectId) => {
            setRenamingProjectId(projectId)
            setRenameSuggestionProjectId(null)
          }}
          onRenameProject={renameProject}
          onCancelRenameProject={() => {
            setRenamingProjectId(null)
            setRenameSuggestionProjectId(null)
          }}
          onCloseProject={closeProjectTab}
          onDeleteProject={deleteProject}
          onTogglePin={togglePin}
        />
        <div className="workbench">
          <VersionRail
            versions={projectVersions}
            activeVersionId={state.activeVersionId}
            onSelectVersion={(versionId) => setState((current) => selectVersion(current, versionId))}
            onRenameVersion={renameVersion}
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
