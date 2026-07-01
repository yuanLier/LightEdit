import type { Version } from './types'

export function versionLabel(version: Version) {
  const name = version.name?.trim()
  return name || `v${version.versionIndex}`
}
