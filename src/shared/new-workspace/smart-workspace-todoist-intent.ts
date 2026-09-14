import type { TodoistTask } from '../todoist-types'
import { parseTodoistTaskInput, type ParsedTodoistTaskInput } from '../todoist/links'
import { isSmartWorkspaceSourceQueryWithinLimit } from './smart-workspace-source-query'

type SmartWorkspaceTodoistMode = 'smart' | 'todoist' | (string & {})

export function parseBoundedSmartWorkspaceTodoistTaskInput(
  value: string
): ParsedTodoistTaskInput | null {
  if (!isSmartWorkspaceSourceQueryWithinLimit(value)) {
    return null
  }
  return parseTodoistTaskInput(value)
}

export function getSmartWorkspaceTodoistSearchQuery(value: string): string {
  const trimmed = value.trim()
  return parseBoundedSmartWorkspaceTodoistTaskInput(trimmed)?.taskId ?? trimmed
}

export function isBlockingTodoistUrlIntent(mode: SmartWorkspaceTodoistMode, value: string): boolean {
  if (mode !== 'smart' && mode !== 'todoist') {
    return false
  }
  const parsed = parseBoundedSmartWorkspaceTodoistTaskInput(value)
  return parsed !== null && /^https?:\/\//i.test(value.trim())
}

export function prioritizeSmartWorkspaceTodoistTaskResults(
  value: string,
  tasks: readonly TodoistTask[]
): TodoistTask[] {
  const intent = parseBoundedSmartWorkspaceTodoistTaskInput(value)
  if (!intent) {
    return tasks.slice()
  }
  return [
    ...tasks.filter((task) => task.id === intent.taskId),
    ...tasks.filter((task) => task.id !== intent.taskId)
  ]
}
