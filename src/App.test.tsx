import { fireEvent, render, screen } from '@testing-library/react'
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

function renderAppWithVersion(type: TextType, content: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appStateWithVersion(type, content)))
  render(<App />)
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
