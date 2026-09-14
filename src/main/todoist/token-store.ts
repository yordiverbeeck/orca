import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  CredentialDecryptionError,
  credentialFileHasContent,
  readStoredCredentialToken,
  writeEncryptedCredential
} from '../integration-credential-file'
import type { TodoistViewer } from '../../shared/todoist-types'

const VIEWER_VERSION = 1 as const

type TodoistViewerFile = {
  version: typeof VIEWER_VERSION
  viewer: TodoistViewer | null
}

let cachedToken: string | null | undefined
let cachedViewerFile: TodoistViewerFile | null = null
let viewerFileLoaded = false
let credentialError: string | undefined

function getOrcaDir(): string {
  return join(homedir(), '.orca')
}

function getTokenPath(): string {
  return join(getOrcaDir(), 'todoist-token.enc')
}

function getViewerPath(): string {
  return join(getOrcaDir(), 'todoist-viewer.json')
}

function ensureOrcaDir(): void {
  const dir = getOrcaDir()
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function emptyViewerFile(): TodoistViewerFile {
  return { version: VIEWER_VERSION, viewer: null }
}

function normalizeViewer(input: unknown): TodoistViewer | null {
  if (!input || typeof input !== 'object') {
    return null
  }
  const record = input as Record<string, unknown>
  if (
    typeof record.id !== 'string' ||
    typeof record.email !== 'string' ||
    typeof record.fullName !== 'string'
  ) {
    return null
  }
  return { id: record.id, email: record.email, fullName: record.fullName }
}

function readViewerFileFromDisk(): TodoistViewerFile {
  const path = getViewerPath()
  if (!existsSync(path)) {
    return emptyViewerFile()
  }
  try {
    const parsed = JSON.parse(readFileSync(path, { encoding: 'utf-8' })) as Partial<TodoistViewerFile>
    return { version: VIEWER_VERSION, viewer: normalizeViewer(parsed.viewer) }
  } catch {
    return emptyViewerFile()
  }
}

export function getViewerFile(): TodoistViewerFile {
  if (!viewerFileLoaded || !cachedViewerFile) {
    cachedViewerFile = readViewerFileFromDisk()
    viewerFileLoaded = true
  }
  return cachedViewerFile
}

export function writeViewerFile(viewer: TodoistViewer | null): void {
  ensureOrcaDir()
  cachedViewerFile = { version: VIEWER_VERSION, viewer }
  viewerFileLoaded = true
  writeFileSync(getViewerPath(), JSON.stringify(cachedViewerFile, null, 2), {
    encoding: 'utf-8',
    mode: 0o600
  })
}

export function hasStoredToken(): boolean {
  return cachedToken !== undefined && cachedToken !== null
    ? true
    : credentialFileHasContent(getTokenPath())
}

export function getCredentialError(): string | undefined {
  return credentialError
}

export function readToken(options: { force?: boolean } = {}): string | null {
  if (cachedToken !== undefined) {
    return cachedToken
  }
  if (!options.force) {
    return null
  }
  const path = getTokenPath()
  if (!existsSync(path)) {
    cachedToken = null
    return null
  }
  try {
    const token = readStoredCredentialToken('Todoist', readFileSync(path))
    cachedToken = token
    credentialError = undefined
    return token
  } catch (error) {
    if (error instanceof CredentialDecryptionError) {
      credentialError = error.message
      throw error
    }
    cachedToken = null
    return null
  }
}

export function saveToken(apiToken: string, viewer: TodoistViewer): void {
  ensureOrcaDir()
  writeEncryptedCredential('Todoist', getTokenPath(), apiToken)
  cachedToken = apiToken
  credentialError = undefined
  writeViewerFile(viewer)
}

export function clearToken(): void {
  cachedToken = null
  credentialError = undefined
  try {
    unlinkSync(getTokenPath())
  } catch {
    // Token may not exist — safe to ignore.
  }
  writeViewerFile(null)
}

export function resetTodoistCredentialCaches(): void {
  cachedToken = undefined
  cachedViewerFile = null
  viewerFileLoaded = false
  credentialError = undefined
}
