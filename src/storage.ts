import type { AppState, Project, TextType, Version } from './types'

export const STORAGE_KEY = 'lightedit:v0.4:reference'
const TEXT_TYPES = new Set<TextType>(['text', 'sql', 'json'])

const sampleJson = `{
  "project": "LightEdit",
  "type": "note",
  "createdAt": "2025-05-29T09:41:00Z",
  "content": {
    "title": "LightEdit",
    "body": "A minimal editor for quick thoughts",
    "tags": ["idea", "product", "minimal"],
    "pinned": true
  },
  "meta": {
    "version": 3,
    "author": "you",
    "updatedAt": "2025-05-29T09:41:00Z"
  }
}`

const apiJson = `{"endpoint":"/api/lightedit","method":"POST","payload":{"type":"json","draft":true}}`

function createId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
}

function createProject(name: string, now: number): Project {
  return {
    id: createId(),
    name,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  }
}

function createVersion(
  projectId: string,
  versionIndex: number,
  now: number,
  content = '',
): Version {
  return {
    id: createId(),
    projectId,
    versionIndex,
    type: 'json',
    content,
    isStarred: false,
    createdAt: now,
    updatedAt: now,
  }
}

export function createDefaultState(): AppState {
  const now = Date.now()
  const lightEdit = createProject('LightEdit', now)
  const apiTest = createProject('API Test', now)
  const versions = [
    createVersion(lightEdit.id, 1, now, ''),
    createVersion(lightEdit.id, 2, now, '{ "draft": true }'),
    createVersion(lightEdit.id, 3, now, sampleJson),
    createVersion(apiTest.id, 1, now, apiJson),
  ]

  return {
    projects: [lightEdit, apiTest],
    versions,
    openProjectIds: [lightEdit.id, apiTest.id],
    activeProjectId: lightEdit.id,
    activeVersionId: versions[2].id,
    isPinned: false,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isProject(value: unknown): value is Project {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isFiniteNumber(value.createdAt) &&
    isFiniteNumber(value.updatedAt) &&
    isFiniteNumber(value.lastOpenedAt)
  )
}

function isVersion(value: unknown): value is Version {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.projectId === 'string' &&
    isPositiveInteger(value.versionIndex) &&
    TEXT_TYPES.has(value.type as TextType) &&
    typeof value.content === 'string' &&
    typeof value.isStarred === 'boolean' &&
    isFiniteNumber(value.createdAt) &&
    isFiniteNumber(value.updatedAt)
  )
}

function hasUniqueIds(items: Array<{ id: string }>) {
  return new Set(items.map((item) => item.id)).size === items.length
}

function uniqueValidProjectIds(projectIds: unknown[], validProjectIds: Set<string>) {
  const uniqueIds: string[] = []
  for (const projectId of projectIds) {
    if (
      typeof projectId === 'string' &&
      validProjectIds.has(projectId) &&
      !uniqueIds.includes(projectId)
    ) {
      uniqueIds.push(projectId)
    }
  }
  return uniqueIds
}

function latestVersionForProject(versions: Version[], projectId: string) {
  return [...versions]
    .filter((version) => version.projectId === projectId)
    .sort((a, b) => b.versionIndex - a.versionIndex)[0]
}

export function normalizeStoredState(value: unknown): AppState | null {
  if (!isRecord(value)) return null
  if (!Array.isArray(value.projects) || !Array.isArray(value.versions)) return null

  const projects = value.projects
  const versions = value.versions
  if (!projects.every(isProject) || !versions.every(isVersion)) return null
  if (projects.length === 0 || versions.length === 0) return null
  if (!hasUniqueIds(projects) || !hasUniqueIds(versions)) return null

  const projectIds = new Set(projects.map((project) => project.id))
  if (!versions.every((version) => projectIds.has(version.projectId))) return null
  if (!projects.every((project) => latestVersionForProject(versions, project.id))) return null

  const activeProjectId =
    typeof value.activeProjectId === 'string' &&
    projectIds.has(value.activeProjectId) &&
    latestVersionForProject(versions, value.activeProjectId)
      ? value.activeProjectId
      : projects[0].id

  const storedActiveVersion =
    typeof value.activeVersionId === 'string'
      ? versions.find(
          (version) => version.id === value.activeVersionId && version.projectId === activeProjectId,
        )
      : undefined
  const activeVersion = storedActiveVersion ?? latestVersionForProject(versions, activeProjectId)
  if (!activeVersion) return null

  const openProjectIds = uniqueValidProjectIds(
    Array.isArray(value.openProjectIds) ? value.openProjectIds : [],
    projectIds,
  )
  if (!openProjectIds.includes(activeProjectId)) {
    openProjectIds.push(activeProjectId)
  }

  return {
    projects,
    versions,
    openProjectIds,
    activeProjectId,
    activeVersionId: activeVersion.id,
    isPinned: typeof value.isPinned === 'boolean' ? value.isPinned : false,
  }
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return normalizeStoredState(parsed)
  } catch {
    return null
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetStoredState() {
  localStorage.removeItem(STORAGE_KEY)
}

export { createId }
