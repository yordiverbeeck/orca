import { CredentialDecryptionError } from '../integration-credential-file'
import type { TodoistConnectResult, TodoistConnectionStatus } from '../../shared/todoist-types'
import { isTodoistAuthError, todoistRequest } from './authenticated-request'
import { mapTodoistViewer } from './mappers'
import {
  clearToken,
  getCredentialError,
  getViewerFile,
  hasStoredToken,
  readToken,
  saveToken
} from './token-store'

export function getStatus(): TodoistConnectionStatus {
  const viewer = getViewerFile().viewer
  const credentialError = getCredentialError()
  return {
    connected: hasStoredToken(),
    viewer: hasStoredToken() ? viewer : null,
    ...(credentialError ? { credentialError } : {})
  }
}

export async function connect(apiKey: string): Promise<TodoistConnectResult> {
  const token = apiKey.trim()
  if (!token) {
    return { ok: false, error: 'API token is required.' }
  }
  try {
    const viewer = mapTodoistViewer(await todoistRequest(token, '/user'))
    if (!viewer) {
      return { ok: false, error: 'Could not read the Todoist account for this token.' }
    }
    saveToken(token, viewer)
    return { ok: true, viewer }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Connection failed.' }
  }
}

export function disconnect(): void {
  clearToken()
}

export async function testConnection(): Promise<TodoistConnectResult> {
  let token: string | null
  try {
    token = readToken({ force: true })
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not read the saved Todoist token.'
    }
  }
  if (!token) {
    return { ok: false, error: 'No API token stored.' }
  }
  try {
    const viewer = mapTodoistViewer(await todoistRequest(token, '/user'))
    if (!viewer) {
      return { ok: false, error: 'Could not read the Todoist account for this token.' }
    }
    saveToken(token, viewer)
    return { ok: true, viewer }
  } catch (error) {
    if (isTodoistAuthError(error)) {
      clearToken()
    }
    return { ok: false, error: error instanceof Error ? error.message : 'Connection failed.' }
  }
}

export function getTokenForRequest(): string | null {
  const token = readToken({ force: true })
  return token
}

export async function withTodoistToken<T>(
  action: (token: string) => Promise<T>,
  fallback: T
): Promise<T> {
  let token: string | null
  try {
    token = readToken({ force: true })
  } catch (error) {
    if (error instanceof CredentialDecryptionError) {
      throw error
    }
    return fallback
  }
  if (!token) {
    return fallback
  }
  try {
    return await action(token)
  } catch (error) {
    if (isTodoistAuthError(error)) {
      clearToken()
    }
    throw error
  }
}
