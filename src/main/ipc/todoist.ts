import { ipcMain } from 'electron'
import { connect, disconnect, getStatus, testConnection } from '../todoist/client'
import {
  addComment,
  completeTask,
  getTask,
  listComments,
  listProjects,
  listTasks,
  reopenTask,
  searchTasks
} from '../todoist/tasks'
import { _resetPreflightCache } from './preflight'

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function clampLimit(value: unknown, fallback = 50): number {
  const limit = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(1, limit), 100)
}

export function registerTodoistHandlers(): void {
  ipcMain.handle('todoist:connect', async (_event, args: { apiKey: string }) => {
    const apiKey = normalizeString(args?.apiKey)
    if (!apiKey) {
      return { ok: false, error: 'Invalid API token' }
    }
    const result = await connect(apiKey)
    if (result.ok) {
      _resetPreflightCache()
    }
    return result
  })

  ipcMain.handle('todoist:disconnect', async () => {
    disconnect()
    _resetPreflightCache()
  })

  ipcMain.handle('todoist:status', async () => getStatus())

  ipcMain.handle('todoist:testConnection', async () => testConnection())

  ipcMain.handle(
    'todoist:listTasks',
    async (_event, args?: { projectId?: string; limit?: number }) => {
      return listTasks({
        projectId: normalizeString(args?.projectId) || undefined,
        limit: clampLimit(args?.limit)
      })
    }
  )

  ipcMain.handle(
    'todoist:searchTasks',
    async (_event, args: { query: string; projectId?: string; limit?: number }) => {
      return searchTasks({
        query: normalizeString(args?.query),
        projectId: normalizeString(args?.projectId) || undefined,
        limit: clampLimit(args?.limit)
      })
    }
  )

  ipcMain.handle('todoist:getTask', async (_event, args: { id: string }) => {
    return getTask(normalizeString(args?.id))
  })

  ipcMain.handle('todoist:listProjects', async () => listProjects())

  ipcMain.handle('todoist:listComments', async (_event, args: { taskId: string }) => {
    return listComments(normalizeString(args?.taskId))
  })

  ipcMain.handle(
    'todoist:addComment',
    async (_event, args: { taskId: string; body: string }) => {
      return addComment(normalizeString(args?.taskId), normalizeString(args?.body))
    }
  )

  ipcMain.handle('todoist:completeTask', async (_event, args: { id: string }) => {
    return completeTask(normalizeString(args?.id))
  })

  ipcMain.handle('todoist:reopenTask', async (_event, args: { id: string }) => {
    return reopenTask(normalizeString(args?.id))
  })
}
