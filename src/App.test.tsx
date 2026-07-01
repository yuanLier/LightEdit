import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

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
