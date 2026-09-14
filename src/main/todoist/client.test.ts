import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import type * as Os from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { netFetchMock, resolveProxyMock, setProxyMock } = vi.hoisted(() => ({
  netFetchMock: vi.fn(),
  resolveProxyMock: vi.fn(),
  setProxyMock: vi.fn()
}))

let tempHome = ''

async function loadClient() {
  vi.resetModules()
  vi.doMock('electron', () => ({
    net: { fetch: netFetchMock },
    session: {
      defaultSession: {
        resolveProxy: resolveProxyMock,
        setProxy: setProxyMock
      }
    }
  }))
  const { setMainHttpClient } = await import('../network/http-client')
  setMainHttpClient({
    fetch: (url, init) => netFetchMock(url, init),
    proxySession: () => ({ resolveProxy: resolveProxyMock, setProxy: setProxyMock }) as never
  })
  const { setSecretStore } = await import('../../shared/secret-store')
  setSecretStore({
    isEncryptionAvailable: () => false,
    encryptString: (value) => Buffer.from(value),
    decryptString: (value) => value.toString('utf-8'),
    describeProtectionGap: () => null
  })
  vi.doMock('os', async () => {
    const actual = await vi.importActual<typeof Os>('os')
    return { ...actual, homedir: () => tempHome }
  })
  const [client, tokenStore] = await Promise.all([import('./client'), import('./token-store')])
  tokenStore.resetTodoistCredentialCaches()
  return { ...client, ...tokenStore }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

beforeEach(() => {
  tempHome = mkdtempSync(join(tmpdir(), 'orca-todoist-client-'))
  netFetchMock.mockReset()
  resolveProxyMock.mockReset()
  setProxyMock.mockReset()
  resolveProxyMock.mockResolvedValue('DIRECT')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('todoist client', () => {
  it('connects with a personal token and reports status without decrypting later', async () => {
    netFetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 'user-1', email: 'ada@example.com', full_name: 'Ada' })
    )
    const { connect, getStatus } = await loadClient()
    const result = await connect('todoist-token')
    expect(result).toEqual({
      ok: true,
      viewer: { id: 'user-1', email: 'ada@example.com', fullName: 'Ada' }
    })
    expect(netFetchMock).toHaveBeenCalledWith(
      'https://api.todoist.com/api/v1/user',
      expect.objectContaining({
        headers: expect.any(Headers)
      })
    )
    expect(getStatus()).toMatchObject({
      connected: true,
      viewer: { id: 'user-1', email: 'ada@example.com', fullName: 'Ada' }
    })
  })

  it('clears a stored token after a 401 on test', async () => {
    netFetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 'user-1', email: 'ada@example.com', full_name: 'Ada' }))
      .mockResolvedValueOnce(jsonResponse({ error: 'Unauthorized' }, 401))
    const { connect, getStatus, testConnection } = await loadClient()
    await connect('todoist-token')
    const result = await testConnection()
    expect(result.ok).toBe(false)
    expect(getStatus().connected).toBe(false)
  })
})
