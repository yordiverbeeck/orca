export const TODOIST_TASK_APP_HOST = 'app.todoist.com'
export const TODOIST_LEGACY_HOST = 'todoist.com'

export type ParsedTodoistTaskInput = {
  taskId: string
}

const TASK_ID_PATTERN = /^[A-Za-z0-9_-]+$/

export function buildTodoistTaskUrl(taskId: string): string {
  return `https://${TODOIST_TASK_APP_HOST}/app/task/${encodeURIComponent(taskId.trim())}`
}

export function buildTodoistDeveloperSettingsUrl(): string {
  return 'https://app.todoist.com/app/settings/integrations/developer'
}

export function parseTodoistTaskInput(input: string): ParsedTodoistTaskInput | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return TASK_ID_PATTERN.test(trimmed) ? { taskId: trimmed } : null
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null
    }
    if (parsed.username !== '' || parsed.password !== '') {
      return null
    }

    const hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase()
    if (hostname === TODOIST_TASK_APP_HOST) {
      const parts = parsed.pathname.split('/').filter(Boolean)
      const taskIndex = parts.findIndex((part) => part.toLowerCase() === 'task')
      const rawId = taskIndex >= 0 ? parts[taskIndex + 1] : undefined
      if (!rawId) {
        return null
      }
      const taskId = decodeURIComponent(rawId.split(/[/?#]/)[0] ?? '')
      return TASK_ID_PATTERN.test(taskId) ? { taskId } : null
    }

    if (hostname === TODOIST_LEGACY_HOST) {
      const taskId = parsed.searchParams.get('id')?.trim() ?? ''
      if (
        parsed.pathname.replace(/\/+$/, '').toLowerCase() === '/showtask' &&
        TASK_ID_PATTERN.test(taskId)
      ) {
        return { taskId }
      }
    }

    return null
  } catch {
    return null
  }
}
