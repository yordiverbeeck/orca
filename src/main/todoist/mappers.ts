import { buildTodoistTaskUrl } from '../../shared/todoist/links'
import type {
  TodoistComment,
  TodoistDue,
  TodoistProject,
  TodoistTask,
  TodoistViewer
} from '../../shared/todoist-types'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function asString(value: unknown): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed ? trimmed : null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '')
}

export function mapTodoistViewer(value: unknown): TodoistViewer | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }
  const id = asString(record.id)
  if (!id) {
    return null
  }
  return {
    id,
    email: asString(record.email) ?? '',
    fullName: asString(record.full_name) ?? asString(record.name) ?? asString(record.email) ?? id
  }
}

export function mapTodoistDue(value: unknown): TodoistDue | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }
  const date = asString(record.date) ?? asString(record.datetime)
  if (!date) {
    return null
  }
  return {
    date,
    datetime: asString(record.datetime),
    string: asString(record.string)
  }
}

export function mapTodoistTask(
  value: unknown,
  projectsById?: ReadonlyMap<string, string>
): TodoistTask | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }
  const id = asString(record.id)
  const content = asString(record.content)
  if (!id || !content) {
    return null
  }
  const projectId = asString(record.project_id)
  const completed = record.checked === true || record.is_completed === true
  return {
    id,
    content,
    description: typeof record.description === 'string' ? record.description : '',
    url: asString(record.url) ?? buildTodoistTaskUrl(id),
    projectId,
    projectName: projectId ? (projectsById?.get(projectId) ?? null) : null,
    labels: asStringArray(record.labels),
    due: mapTodoistDue(record.due),
    completed,
    updatedAt: asString(record.updated_at) ?? asString(record.added_at)
  }
}

export function mapTodoistProject(value: unknown): TodoistProject | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }
  const id = asString(record.id)
  const name = asString(record.name)
  if (!id || !name) {
    return null
  }
  return { id, name }
}

export function mapTodoistComment(value: unknown): TodoistComment | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }
  const id = asString(record.id)
  const content = asString(record.content)
  if (!id || !content) {
    return null
  }
  return {
    id,
    content,
    postedAt: asString(record.posted_at) ?? asString(record.posted) ?? ''
  }
}

export function mapPaginatedResults<T>(
  value: unknown,
  mapper: (entry: unknown) => T | null
): T[] {
  if (Array.isArray(value)) {
    return value.map(mapper).filter((entry): entry is T => entry !== null)
  }
  const record = asRecord(value)
  const results = record && Array.isArray(record.results) ? record.results : []
  return results.map(mapper).filter((entry): entry is T => entry !== null)
}
