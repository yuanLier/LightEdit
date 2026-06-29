import type { AppState, Project, Version } from './types'

const STORAGE_KEY = 'lightedit:v0.4:reference'

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

function isState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false
  const state = value as AppState
  return (
    Array.isArray(state.projects) &&
    Array.isArray(state.versions) &&
    Array.isArray(state.openProjectIds) &&
    typeof state.activeProjectId === 'string' &&
    typeof state.activeVersionId === 'string' &&
    typeof state.isPinned === 'boolean'
  )
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isState(parsed) ? parsed : null
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
