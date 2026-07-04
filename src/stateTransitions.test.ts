import { describe, expect, it } from 'vitest'
import {
  addProject,
  addVersion,
  closeProjectTab,
  deleteProject,
  deleteVersion,
  openProject,
  renameProject,
  renameVersion,
  selectVersion,
  updateActiveVersion,
} from './stateTransitions'
import type { AppState, TextType } from './types'

function project(id: string, name = id) {
  return {
    id,
    name,
    createdAt: 1,
    updatedAt: 1,
    lastOpenedAt: 1,
  }
}

function version(id: string, projectId: string, versionIndex: number, type: TextType, content = '') {
  return {
    id,
    projectId,
    versionIndex,
    type,
    content,
    isStarred: false,
    createdAt: 1,
    updatedAt: 1,
  }
}

function state(): AppState {
  return {
    projects: [
      project('project-api', 'API Test'),
      project('project-2', 'Project 2'),
      project('project-3', 'Project 3'),
    ],
    versions: [
      version('project-api-v1', 'project-api', 1, 'text', 'api'),
      version('project-2-v2', 'project-2', 2, 'json', '{"draft":true}'),
      version('project-2-v1', 'project-2', 1, 'text', 'before formatting'),
      version('project-3-v1', 'project-3', 1, 'text', 'third'),
    ],
    openProjectIds: ['project-api', 'project-2', 'project-3'],
    activeProjectId: 'project-2',
    activeVersionId: 'project-2-v2',
    isPinned: false,
  }
}

function transitionOptions(...ids: string[]) {
  const queue = [...ids]
  return {
    now: 100,
    createId: () => {
      const nextId = queue.shift()
      if (!nextId) throw new Error('Missing test id')
      return nextId
    },
  }
}

describe('state transitions', () => {
  it('opens a project and selects its latest version', () => {
    const next = openProject(
      { ...state(), openProjectIds: ['project-api'], activeProjectId: 'project-api', activeVersionId: 'project-api-v1' },
      'project-2',
      100,
    )

    expect(next.openProjectIds).toEqual(['project-api', 'project-2'])
    expect(next.activeProjectId).toBe('project-2')
    expect(next.activeVersionId).toBe('project-2-v2')
    expect(next.projects.find((item) => item.id === 'project-2')?.lastOpenedAt).toBe(100)
  })

  it('adds a new project with a blank text version and activates it', () => {
    const next = addProject(state(), transitionOptions('project-new', 'version-new'))
    const addedProject = next.projects[next.projects.length - 1]
    const addedVersion = next.versions[next.versions.length - 1]

    expect(addedProject).toMatchObject({ id: 'project-new', name: 'Project 4' })
    expect(addedVersion).toMatchObject({
      id: 'version-new',
      projectId: 'project-new',
      versionIndex: 1,
      type: 'text',
      content: '',
    })
    expect(next.openProjectIds[next.openProjectIds.length - 1]).toBe('project-new')
    expect(next.activeProjectId).toBe('project-new')
    expect(next.activeVersionId).toBe('version-new')
  })

  it('renames projects and ignores blank or unchanged names', () => {
    const current = state()
    expect(renameProject(current, 'project-2', '   ', 100)).toEqual({ state: current, renamed: false })
    expect(renameProject(current, 'project-2', 'Project 2', 100)).toEqual({
      state: current,
      renamed: false,
    })

    const result = renameProject(current, 'project-2', ' Scratch API ', 100)
    expect(result.renamed).toBe(true)
    expect(result.name).toBe('Scratch API')
    expect(result.state.projects.find((item) => item.id === 'project-2')).toMatchObject({
      name: 'Scratch API',
      updatedAt: 100,
    })
  })

  it('closes inactive and active project tabs without deleting projects', () => {
    const current = state()
    const inactiveResult = closeProjectTab(current, 'project-3')

    expect(inactiveResult.closed).toBe(true)
    expect(inactiveResult.state.projects.some((item) => item.id === 'project-3')).toBe(true)
    expect(inactiveResult.state.openProjectIds).toEqual(['project-api', 'project-2'])
    expect(inactiveResult.state.activeProjectId).toBe('project-2')

    const activeResult = closeProjectTab(current, 'project-2')
    expect(activeResult.closed).toBe(true)
    expect(activeResult.state.openProjectIds).toEqual(['project-api', 'project-3'])
    expect(activeResult.state.activeProjectId).toBe('project-3')
    expect(activeResult.state.activeVersionId).toBe('project-3-v1')
  })

  it('refuses to close the final visible project tab', () => {
    const current = { ...state(), openProjectIds: ['project-2'] }
    const result = closeProjectTab(current, 'project-2')

    expect(result).toEqual({ state: current, closed: false, reason: 'keep-one' })
  })

  it('deletes projects, chooses a neighbor, and creates fallback content for the final project', () => {
    const current = state()
    const next = deleteProject(current, 'project-2', transitionOptions('unused-project', 'unused-version'))

    expect(next.projects.map((item) => item.id)).toEqual(['project-api', 'project-3'])
    expect(next.versions.some((item) => item.projectId === 'project-2')).toBe(false)
    expect(next.openProjectIds).toEqual(['project-api', 'project-3'])
    expect(next.activeProjectId).toBe('project-api')
    expect(next.activeVersionId).toBe('project-api-v1')

    const solo: AppState = {
      ...current,
      projects: [project('solo', 'Solo')],
      versions: [version('solo-v1', 'solo', 1, 'text', 'solo')],
      openProjectIds: ['solo'],
      activeProjectId: 'solo',
      activeVersionId: 'solo-v1',
    }
    const fallback = deleteProject(solo, 'solo', transitionOptions('fallback-project', 'fallback-version'))
    expect(fallback.projects).toMatchObject([{ id: 'fallback-project', name: 'LightEdit' }])
    expect(fallback.versions).toMatchObject([
      { id: 'fallback-version', projectId: 'fallback-project', type: 'text', content: '' },
    ])
    expect(fallback.activeProjectId).toBe('fallback-project')
    expect(fallback.activeVersionId).toBe('fallback-version')
  })

  it('adds a version by copying the active version content and type', () => {
    const next = addVersion(state(), transitionOptions('project-2-v3'))
    const addedVersion = next.versions[next.versions.length - 1]

    expect(addedVersion).toMatchObject({
      id: 'project-2-v3',
      projectId: 'project-2',
      versionIndex: 3,
      type: 'json',
      content: '{"draft":true}',
      isStarred: false,
    })
    expect(next.activeVersionId).toBe('project-2-v3')
  })

  it('deletes inactive and active versions while preserving a project floor of one version', () => {
    const current = state()
    const inactiveResult = deleteVersion(current, 'project-2-v1')
    expect(inactiveResult.deleted).toBe(true)
    expect(inactiveResult.state.versions.some((item) => item.id === 'project-2-v1')).toBe(false)
    expect(inactiveResult.state.activeVersionId).toBe('project-2-v2')

    const activeResult = deleteVersion(current, 'project-2-v2')
    expect(activeResult.deleted).toBe(true)
    expect(activeResult.state.versions.some((item) => item.id === 'project-2-v2')).toBe(false)
    expect(activeResult.state.activeVersionId).toBe('project-2-v1')

    const singleResult = deleteVersion(current, 'project-api-v1')
    expect(singleResult).toEqual({ state: current, deleted: false, reason: 'keep-one' })
  })

  it('renames versions and ignores blank, unchanged, or system-label names', () => {
    const current = state()
    expect(renameVersion(current, 'project-2-v1', '', 100)).toEqual({ state: current, renamed: false })
    expect(renameVersion(current, 'project-2-v1', 'v1', 100)).toEqual({
      state: current,
      renamed: false,
    })

    const result = renameVersion(current, 'project-2-v1', ' Draft copy ', 100)
    expect(result.renamed).toBe(true)
    expect(result.name).toBe('Draft copy')
    expect(result.state.versions.find((item) => item.id === 'project-2-v1')).toMatchObject({
      name: 'Draft copy',
      updatedAt: 100,
    })
  })

  it('preserves the window pin preference across content transitions', () => {
    const current = { ...state(), isPinned: true }
    const nextStates = [
      updateActiveVersion(current, { content: 'updated' }, 100),
      openProject(current, 'project-api', 100),
      addProject(current, transitionOptions('project-new', 'version-new')),
      renameProject(current, 'project-2', 'Renamed Project', 100).state,
      closeProjectTab(current, 'project-3').state,
      deleteProject(current, 'project-3', transitionOptions('unused-project', 'unused-version')),
      addVersion(current, transitionOptions('project-2-v3')),
      selectVersion(current, 'project-2-v1'),
      deleteVersion(current, 'project-2-v1').state,
      renameVersion(current, 'project-2-v1', 'Draft Copy', 100).state,
    ]

    expect(nextStates.every((next) => next.isPinned)).toBe(true)
  })
})
