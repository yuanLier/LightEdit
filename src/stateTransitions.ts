import type { AppState, Project, TextType, Version } from './types'
import { versionLabel } from './versionLabel'

export type TransitionOptions = {
  now: number
  createId: () => string
}

export type RenameResult = {
  state: AppState
  renamed: boolean
  name?: string
}

export type CloseProjectTabResult = {
  state: AppState
  closed: boolean
  reason?: 'missing' | 'keep-one'
}

export type DeleteVersionResult = {
  state: AppState
  deleted: boolean
  reason?: 'missing' | 'keep-one'
}

export function sortVersions(versions: Version[]) {
  return [...versions].sort((a, b) => b.versionIndex - a.versionIndex)
}

export function firstVersionForProject(state: AppState, projectId: string) {
  return sortVersions(state.versions.filter((version) => version.projectId === projectId))[0]
}

export function nextProjectName(projects: Project[]) {
  const maxNumber = projects.reduce((max, project) => {
    const match = /^Project (\d+)$/.exec(project.name)
    return match ? Math.max(max, Number(match[1])) : max
  }, projects.length)
  return `Project ${maxNumber + 1}`
}

export function projectExists(projects: Project[], projectId: string) {
  return projects.some((project) => project.id === projectId)
}

function createProjectWithVersion(
  name: string,
  options: TransitionOptions,
  type: TextType = 'text',
  content = '',
) {
  const project: Project = {
    id: options.createId(),
    name,
    createdAt: options.now,
    updatedAt: options.now,
    lastOpenedAt: options.now,
  }
  const version: Version = {
    id: options.createId(),
    projectId: project.id,
    versionIndex: 1,
    type,
    content,
    isStarred: false,
    createdAt: options.now,
    updatedAt: options.now,
  }
  return { project, version }
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

export function updateActiveVersion(state: AppState, patch: Partial<Version>, now: number) {
  return {
    ...state,
    versions: state.versions.map((version) =>
      version.id === state.activeVersionId ? { ...version, ...patch, updatedAt: now } : version,
    ),
  }
}

export function openProject(state: AppState, projectId: string, now: number) {
  const version = firstVersionForProject(state, projectId)
  if (!version) return state
  return {
    ...state,
    projects: state.projects.map((project) =>
      project.id === projectId ? { ...project, lastOpenedAt: now, updatedAt: now } : project,
    ),
    openProjectIds: state.openProjectIds.includes(projectId)
      ? state.openProjectIds
      : [...state.openProjectIds, projectId],
    activeProjectId: projectId,
    activeVersionId: version.id,
  }
}

export function addProject(state: AppState, options: TransitionOptions) {
  const { project, version } = createProjectWithVersion(nextProjectName(state.projects), options)
  return {
    ...state,
    projects: [...state.projects, project],
    versions: [...state.versions, version],
    openProjectIds: [...state.openProjectIds, project.id],
    activeProjectId: project.id,
    activeVersionId: version.id,
  }
}

export function renameProject(
  state: AppState,
  projectId: string,
  name: string,
  now: number,
): RenameResult {
  const project = state.projects.find((candidate) => candidate.id === projectId)
  const nextName = name.trim()
  if (!project || !nextName || nextName === project.name) {
    return { state, renamed: false }
  }

  return {
    state: {
      ...state,
      projects: state.projects.map((candidate) =>
        candidate.id === projectId ? { ...candidate, name: nextName, updatedAt: now } : candidate,
      ),
    },
    renamed: true,
    name: nextName,
  }
}

export function closeProjectTab(state: AppState, projectId: string): CloseProjectTabResult {
  const visibleOpenProjectIds = state.openProjectIds.filter((id) => projectExists(state.projects, id))
  if (!visibleOpenProjectIds.includes(projectId)) {
    return { state, closed: false, reason: 'missing' }
  }
  if (visibleOpenProjectIds.length <= 1) {
    return { state, closed: false, reason: 'keep-one' }
  }

  const closedIndex = visibleOpenProjectIds.indexOf(projectId)
  const nextOpenProjectIds = visibleOpenProjectIds.filter((id) => id !== projectId)

  if (state.activeProjectId !== projectId) {
    return {
      state: { ...state, openProjectIds: nextOpenProjectIds },
      closed: true,
    }
  }

  const nextActiveProjectId =
    nextOpenProjectIds[closedIndex] ?? nextOpenProjectIds[closedIndex - 1] ?? nextOpenProjectIds[0]
  const nextVersion = firstVersionForProject(state, nextActiveProjectId)
  if (!nextVersion) return { state, closed: false, reason: 'missing' }

  return {
    state: {
      ...state,
      openProjectIds: nextOpenProjectIds,
      activeProjectId: nextActiveProjectId,
      activeVersionId: nextVersion.id,
    },
    closed: true,
  }
}

export function deleteProject(state: AppState, projectId: string, options: TransitionOptions) {
  const remainingProjects = state.projects.filter((candidate) => candidate.id !== projectId)
  const remainingVersions = state.versions.filter((version) => version.projectId !== projectId)

  if (remainingProjects.length === 0) {
    const { project: fallbackProject, version: fallbackVersion } = createProjectWithVersion(
      'LightEdit',
      options,
    )
    return {
      ...state,
      projects: [fallbackProject],
      versions: [fallbackVersion],
      openProjectIds: [fallbackProject.id],
      activeProjectId: fallbackProject.id,
      activeVersionId: fallbackVersion.id,
    }
  }

  const nextActiveProjectId =
    state.activeProjectId === projectId
      ? neighborProjectId(state, projectId, remainingProjects)
      : state.activeProjectId
  const safeActiveProjectId = nextActiveProjectId ?? remainingProjects[0].id
  const nextState = {
    ...state,
    projects: remainingProjects,
    versions: remainingVersions,
  }
  const nextVersion = firstVersionForProject(nextState, safeActiveProjectId)
  const remainingOpen = state.openProjectIds.filter(
    (id) => id !== projectId && projectExists(remainingProjects, id),
  )
  const nextOpenProjectIds = remainingOpen.includes(safeActiveProjectId)
    ? remainingOpen
    : [...remainingOpen, safeActiveProjectId]

  return {
    ...nextState,
    openProjectIds: nextOpenProjectIds,
    activeProjectId: safeActiveProjectId,
    activeVersionId: nextVersion?.id ?? remainingVersions[0]?.id ?? state.activeVersionId,
  }
}

export function addVersion(state: AppState, options: TransitionOptions) {
  const currentVersion = state.versions.find((version) => version.id === state.activeVersionId)
  if (!currentVersion) return state

  const versionsForProject = state.versions.filter((version) => version.projectId === state.activeProjectId)
  const maxIndex = Math.max(...versionsForProject.map((version) => version.versionIndex))
  const newVersion: Version = {
    id: options.createId(),
    projectId: state.activeProjectId,
    versionIndex: maxIndex + 1,
    type: currentVersion.type,
    content: currentVersion.content,
    isStarred: false,
    createdAt: options.now,
    updatedAt: options.now,
  }
  return {
    ...state,
    versions: [...state.versions, newVersion],
    activeVersionId: newVersion.id,
  }
}

export function selectVersion(state: AppState, versionId: string) {
  const version = state.versions.find((candidate) => candidate.id === versionId)
  if (!version || version.projectId !== state.activeProjectId) return state
  return { ...state, activeVersionId: versionId }
}

export function deleteVersion(state: AppState, versionId: string): DeleteVersionResult {
  const versionToDelete = state.versions.find((version) => version.id === versionId)
  if (!versionToDelete) return { state, deleted: false, reason: 'missing' }

  const versionsForProject = sortVersions(
    state.versions.filter((version) => version.projectId === versionToDelete.projectId),
  )
  if (versionsForProject.length <= 1) {
    return { state, deleted: false, reason: 'keep-one' }
  }

  if (state.activeVersionId !== versionId) {
    return {
      state: {
        ...state,
        versions: state.versions.filter((version) => version.id !== versionId),
      },
      deleted: true,
    }
  }

  const deletedIndex = versionsForProject.findIndex((version) => version.id === versionId)
  const nextVersion = versionsForProject[deletedIndex + 1] ?? versionsForProject[deletedIndex - 1]
  if (!nextVersion) return { state, deleted: false, reason: 'missing' }

  return {
    state: {
      ...state,
      versions: state.versions.filter((version) => version.id !== versionId),
      activeVersionId: nextVersion.id,
    },
    deleted: true,
  }
}

export function renameVersion(
  state: AppState,
  versionId: string,
  name: string,
  now: number,
): RenameResult {
  const version = state.versions.find((candidate) => candidate.id === versionId)
  const nextName = name.trim()
  if (!version || !nextName) return { state, renamed: false }

  const currentName = version.name?.trim() ?? ''
  if (nextName === currentName || nextName === versionLabel(version)) {
    return { state, renamed: false }
  }

  return {
    state: {
      ...state,
      versions: state.versions.map((candidate) =>
        candidate.id === versionId ? { ...candidate, name: nextName, updatedAt: now } : candidate,
      ),
    },
    renamed: true,
    name: nextName,
  }
}
