import { ensureElectronProxyFromEnvironment } from '../network/proxy-settings'
import { getMainHttpClient } from '../network/http-client'

export const TODOIST_API_BASE = 'https://api.todoist.com/api/v1'

export class TodoistApiError extends Error {
  status: number | null

  constructor(message: string, status: number | null = null) {
    super(message)
    this.status = status
  }
}

export function isTodoistAuthError(error: unknown): boolean {
  return error instanceof TodoistApiError && error.status === 401
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown; message?: unknown }
    if (typeof body.error === 'string' && body.error.trim()) {
      return body.error
    }
    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message
    }
  } catch {
    // Fall through to status text.
  }
  return response.statusText || `Todoist request failed (${response.status})`
}

export async function todoistRequest(
  token: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  if (init?.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Authorization', `Bearer ${token}`)
  const httpClient = getMainHttpClient()
  const proxySession = httpClient.proxySession()
  const url = `${TODOIST_API_BASE}${path}`
  await ensureElectronProxyFromEnvironment({
    ...(proxySession ? { proxySession } : {}),
    probeUrl: url
  }).catch(() => {
    // Proxy setup is best-effort; the request still proceeds.
  })
  const response = await httpClient.fetch(url, { ...init, headers })
  if (!response.ok) {
    throw new TodoistApiError(await readError(response), response.status)
  }
  if (response.status === 204) {
    return null
  }
  const text = await response.text()
  if (!text) {
    return null
  }
  return JSON.parse(text) as unknown
}
