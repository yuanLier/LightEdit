import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './storage'
import type { AppState, TextType } from './types'

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

describe('App project tabs', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
  })

  it('closes a tab without deleting the project from Notes', () => {
    render(<App />)

    fireEvent.click(screen.getByLabelText('Close LightEdit'))

    expect(screen.queryByRole('button', { name: 'LightEdit' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Open notes menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /LightEdit/ }))

    expect(screen.getByRole('button', { name: 'LightEdit' })).toBeInTheDocument()
  })

  it('prevents the browser context menu on the Notes chrome button', () => {
    render(<App />)

    expect(
      fireEvent.contextMenu(screen.getByRole('button', { name: 'Open notes menu' }), {
        clientX: 640,
        clientY: 28,
      }),
    ).toBe(false)
  })
})

function appStateWithVersion(type: TextType, content: string): AppState {
  return {
    projects: [
      {
        id: 'project-1',
        name: 'API Test',
        createdAt: 1,
        updatedAt: 1,
        lastOpenedAt: 1,
      },
    ],
    versions: [
      {
        id: 'version-1',
        projectId: 'project-1',
        versionIndex: 1,
        type,
        content,
        isStarred: false,
        createdAt: 1,
        updatedAt: 1,
      },
    ],
    openProjectIds: ['project-1'],
    activeProjectId: 'project-1',
    activeVersionId: 'version-1',
    isPinned: false,
  }
}

function appStateWithProjects(): AppState {
  return {
    projects: [
      {
        id: 'project-1',
        name: 'API Test',
        createdAt: 1,
        updatedAt: 1,
        lastOpenedAt: 1,
      },
      {
        id: 'project-2',
        name: 'Project 2',
        createdAt: 2,
        updatedAt: 2,
        lastOpenedAt: 2,
      },
    ],
    versions: [
      {
        id: 'project-1-v1',
        projectId: 'project-1',
        versionIndex: 1,
        type: 'text',
        content: 'api notes',
        isStarred: false,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'project-2-v2',
        projectId: 'project-2',
        versionIndex: 2,
        type: 'json',
        content: '{"draft":true}',
        isStarred: false,
        createdAt: 2,
        updatedAt: 2,
      },
      {
        id: 'project-2-v1',
        projectId: 'project-2',
        versionIndex: 1,
        type: 'text',
        content: 'before formatting',
        isStarred: false,
        createdAt: 1,
        updatedAt: 1,
      },
    ],
    openProjectIds: ['project-1', 'project-2'],
    activeProjectId: 'project-2',
    activeVersionId: 'project-2-v2',
    isPinned: false,
  }
}

function appStateWithSingleProject(): AppState {
  return {
    projects: [
      {
        id: 'project-solo',
        name: 'Only Project',
        createdAt: 1,
        updatedAt: 1,
        lastOpenedAt: 1,
      },
    ],
    versions: [
      {
        id: 'project-solo-v1',
        projectId: 'project-solo',
        versionIndex: 1,
        type: 'text',
        content: 'keep me',
        isStarred: false,
        createdAt: 1,
        updatedAt: 1,
      },
    ],
    openProjectIds: ['project-solo'],
    activeProjectId: 'project-solo',
    activeVersionId: 'project-solo-v1',
    isPinned: false,
  }
}

function renderAppWithState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  render(<App />)
}

function renderAppWithVersion(type: TextType, content: string) {
  renderAppWithState(appStateWithVersion(type, content))
}

describe('App formatting', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
  })

  it('formats JSON from the toolbar and confirms the action', () => {
    renderAppWithVersion('json', '{"draft":true}')

    fireEvent.click(screen.getByRole('button', { name: /format/i }))

    expect(screen.getByLabelText('Editor')).toHaveValue('{\n  "draft": true\n}')
    expect(screen.getByRole('status')).toHaveTextContent('JSON formatted')
  })

  it('keeps invalid JSON unchanged and shows an error', () => {
    renderAppWithVersion('json', '{"draft":')

    fireEvent.click(screen.getByRole('button', { name: /format/i }))

    expect(screen.getByLabelText('Editor')).toHaveValue('{"draft":')
    expect(screen.getByRole('status')).toHaveTextContent('Invalid JSON')
  })

  it('formats SQL from the toolbar', () => {
    renderAppWithVersion('sql', 'select id, title from notes where draft = true')

    fireEvent.click(screen.getByRole('button', { name: /format/i }))

    expect(screen.getByLabelText('Editor')).toHaveValue(
      'select id,\n  title\nfrom notes\nwhere draft = true',
    )
    expect(screen.getByRole('status')).toHaveTextContent('SQL formatted')
  })

  it('treats Text format as a no-op with a lightweight hint', () => {
    renderAppWithVersion('text', 'quick thought')

    fireEvent.click(screen.getByRole('button', { name: /format/i }))

    expect(screen.getByLabelText('Editor')).toHaveValue('quick thought')
    expect(screen.getByRole('status')).toHaveTextContent('Text has no formatter')
  })
})

describe('App delete undo', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
    vi.useRealTimers()
  })

  it('restores a deleted project from the undo toast', () => {
    renderAppWithState(appStateWithProjects())

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Project 2' }), {
      clientX: 240,
      clientY: 32,
    })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete Project...' }))

    expect(screen.queryByRole('button', { name: 'Project 2' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Deleted Project 2')

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))

    expect(screen.getByRole('button', { name: 'Project 2' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Restored Project 2')
  })

  it('restores a deleted version from the undo toast', () => {
    renderAppWithState(appStateWithProjects())

    fireEvent.contextMenu(screen.getByRole('button', { name: 'v1' }), {
      clientX: 34,
      clientY: 150,
    })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete Version...' }))

    expect(screen.queryByRole('button', { name: 'v1' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Deleted v1')

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))

    expect(screen.getByRole('button', { name: 'v1' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Restored v1')
  })

  it('restores the original project when undoing deletion of the last project', () => {
    renderAppWithState(appStateWithSingleProject())

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Only Project' }), {
      clientX: 160,
      clientY: 32,
    })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete Project...' }))

    expect(screen.queryByRole('button', { name: 'Only Project' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'LightEdit' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))

    expect(screen.getByRole('button', { name: 'Only Project' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'LightEdit' })).not.toBeInTheDocument()
  })

  it('keeps undo toasts visible longer than ordinary toasts', () => {
    vi.useFakeTimers()
    renderAppWithState(appStateWithProjects())

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Project 2' }), {
      clientX: 240,
      clientY: 32,
    })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete Project...' }))

    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2200)
    })

    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1199)
    })

    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})
