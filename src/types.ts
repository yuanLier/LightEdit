export type TextType = 'text' | 'sql' | 'json'

export type Project = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  lastOpenedAt: number
}

export type Version = {
  id: string
  projectId: string
  versionIndex: number
  type: TextType
  content: string
  isStarred: boolean
  createdAt: number
  updatedAt: number
}

export type AppState = {
  projects: Project[]
  versions: Version[]
  openProjectIds: string[]
  activeProjectId: string
  activeVersionId: string
  isPinned: boolean
}

export type ToastState = {
  id: number
  message: string
}
