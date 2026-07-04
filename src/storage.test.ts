import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from './types'
import {
  STORAGE_KEY,
  createDefaultState,
  loadState,
  normalizeStoredState,
  resetStoredState,
  saveState,
} from './storage'

function createStorageMock(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

function project(id: string, name = id) {
  return {
    id,
    name,
    createdAt: 1,
    updatedAt: 1,
    lastOpenedAt: 1,
  }
}

function version(id: string, projectId: string, versionIndex: number, content = '') {
  return {
    id,
    projectId,
    versionIndex,
    type: 'json' as const,
    content,
    isStarred: false,
    createdAt: 1,
    updatedAt: 1,
  }
}

function appState(): AppState {
  const firstProject = project('project-1', 'API Test')
  const secondProject = project('project-2', 'Project 2')
  const firstVersion = version('version-1', firstProject.id, 1, '{"endpoint":"/api"}')
  const secondVersion = version('version-2', secondProject.id, 1, 'select * from notes')
  const thirdVersion = {
    ...version('version-3', secondProject.id, 2, '{"draft":true}'),
    isStarred: true,
  }

  return {
    projects: [firstProject, secondProject],
    versions: [firstVersion, secondVersion, thirdVersion],
    openProjectIds: [firstProject.id, secondProject.id],
    activeProjectId: secondProject.id,
    activeVersionId: thirdVersion.id,
    isPinned: true,
  }
}

describe('storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
    vi.useRealTimers()
  })

  it('creates a default state with valid project and version references', () => {
    const state = createDefaultState()
    const projectIds = new Set(state.projects.map((item) => item.id))
    const activeVersion = state.versions.find((item) => item.id === state.activeVersionId)

    expect(projectIds.has(state.activeProjectId)).toBe(true)
    expect(activeVersion?.projectId).toBe(state.activeProjectId)
    expect(state.openProjectIds).toContain(state.activeProjectId)
    expect(state.projects.every((item) => state.versions.some((v) => v.projectId === item.id))).toBe(true)
  })

  it('round-trips project, version, active selection, and content without persisting pin', () => {
    const state = appState()

    saveState(state)

    expect(loadState()).toEqual({ ...state, isPinned: false })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
      activeProjectId: 'project-2',
      activeVersionId: 'version-3',
      isPinned: false,
    })
  })

  it('clears the persisted state', () => {
    saveState(appState())

    resetStoredState()

    expect(loadState()).toBeNull()
  })

  it('ignores invalid JSON and malformed state payloads', () => {
    localStorage.setItem(STORAGE_KEY, '{')
    expect(loadState()).toBeNull()

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        projects: [],
        versions: [],
        openProjectIds: [],
        activeProjectId: 'missing',
        activeVersionId: 'missing',
      }),
    )
    expect(loadState()).toBeNull()
  })

  it('repairs stale active and open project references without losing valid content', () => {
    const state = appState()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        activeProjectId: 'missing-project',
        activeVersionId: 'missing-version',
        openProjectIds: ['missing-project', 'project-1', 'project-1'],
        isPinned: true,
      }),
    )

    expect(loadState()).toEqual({
      ...state,
      openProjectIds: ['project-1'],
      activeProjectId: 'project-1',
      activeVersionId: 'version-1',
      isPinned: false,
    })
  })

  it('accepts optional version names and rejects invalid version names', () => {
    const state = appState()
    const namedState = {
      ...state,
      versions: state.versions.map((item) =>
        item.id === 'version-3' ? { ...item, name: 'Draft payload' } : item,
      ),
    }

    expect(normalizeStoredState(namedState)?.versions[2].name).toBe('Draft payload')
    expect(
      normalizeStoredState({
        ...state,
        versions: [{ ...state.versions[0], name: 12 }],
      }),
    ).toBeNull()
  })

  it('rejects states with duplicate ids or orphan versions', () => {
    const state = appState()

    expect(normalizeStoredState({ ...state, projects: [state.projects[0], state.projects[0]] })).toBeNull()
    expect(
      normalizeStoredState({
        ...state,
        versions: [{ ...state.versions[0], projectId: 'missing-project' }],
      }),
    ).toBeNull()
  })
})
