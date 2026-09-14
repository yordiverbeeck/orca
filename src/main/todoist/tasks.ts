import type {
  TodoistComment,
  TodoistCommentResult,
  TodoistMutationResult,
  TodoistProject,
  TodoistTask
} from '../../shared/todoist-types'
import { todoistRequest } from './authenticated-request'
import { withTodoistToken } from './client'
import {
  mapPaginatedResults,
  mapTodoistComment,
  mapTodoistProject,
  mapTodoistTask
} from './mappers'

function encodeQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value)
    }
  }
  const encoded = search.toString()
  return encoded ? `?${encoded}` : ''
}

async function loadProjectsById(token: string): Promise<Map<string, string>> {
  const projects = mapPaginatedResults(
    await todoistRequest(token, `/projects${encodeQuery({ limit: '200' })}`),
    mapTodoistProject
  )
  return new Map(projects.map((project) => [project.id, project.name]))
}

export async function listProjects(): Promise<TodoistProject[]> {
  return withTodoistToken(async (token) => {
    return mapPaginatedResults(
      await todoistRequest(token, `/projects${encodeQuery({ limit: '200' })}`),
      mapTodoistProject
    )
  }, [])
}

export async function listTasks(args?: {
  projectId?: string
  limit?: number
}): Promise<TodoistTask[]> {
  const limit = String(Math.min(Math.max(1, args?.limit ?? 50), 100))
  return withTodoistToken(async (token) => {
    const projectsById = await loadProjectsById(token)
    return mapPaginatedResults(
      await todoistRequest(
        token,
        `/tasks${encodeQuery({ limit, project_id: args?.projectId })}`
      ),
      (entry) => mapTodoistTask(entry, projectsById)
    )
  }, [])
}

export async function searchTasks(args: {
  query: string
  projectId?: string
  limit?: number
}): Promise<TodoistTask[]> {
  const query = args.query.trim()
  if (!query) {
    return listTasks({ projectId: args.projectId, limit: args.limit })
  }
  const limit = String(Math.min(Math.max(1, args.limit ?? 50), 100))
  return withTodoistToken(async (token) => {
    const projectsById = await loadProjectsById(token)
    const tasks = mapPaginatedResults(
      await todoistRequest(token, `/tasks/filter${encodeQuery({ query, limit })}`),
      (entry) => mapTodoistTask(entry, projectsById)
    )
    return args.projectId ? tasks.filter((task) => task.projectId === args.projectId) : tasks
  }, [])
}

export async function getTask(id: string): Promise<TodoistTask | null> {
  const taskId = id.trim()
  if (!taskId) {
    return null
  }
  return withTodoistToken(async (token) => {
    const projectsById = await loadProjectsById(token)
    return mapTodoistTask(await todoistRequest(token, `/tasks/${encodeURIComponent(taskId)}`), projectsById)
  }, null)
}

export async function listComments(taskId: string): Promise<TodoistComment[]> {
  const id = taskId.trim()
  if (!id) {
    return []
  }
  return withTodoistToken(async (token) => {
    return mapPaginatedResults(
      await todoistRequest(token, `/comments${encodeQuery({ task_id: id, limit: '50' })}`),
      mapTodoistComment
    )
  }, [])
}

export async function addComment(taskId: string, body: string): Promise<TodoistCommentResult> {
  const id = taskId.trim()
  const content = body.trim()
  if (!id) {
    return { ok: false, error: 'Task ID is required' }
  }
  if (!content) {
    return { ok: false, error: 'Comment body is required' }
  }
  try {
    const comment = await withTodoistToken(async (token) => {
      return mapTodoistComment(
        await todoistRequest(token, '/comments', {
          method: 'POST',
          body: JSON.stringify({ task_id: id, content })
        })
      )
    }, null)
    return comment ? { ok: true, id: comment.id } : { ok: false, error: 'Failed to add comment.' }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to add comment.' }
  }
}

export async function completeTask(taskId: string): Promise<TodoistMutationResult> {
  return mutateTask(taskId, 'close')
}

export async function reopenTask(taskId: string): Promise<TodoistMutationResult> {
  return mutateTask(taskId, 'reopen')
}

async function mutateTask(
  taskId: string,
  action: 'close' | 'reopen'
): Promise<TodoistMutationResult> {
  const id = taskId.trim()
  if (!id) {
    return { ok: false, error: 'Task ID is required' }
  }
  try {
    const result = await withTodoistToken(async (token) => {
      await todoistRequest(token, `/tasks/${encodeURIComponent(id)}/${action}`, { method: 'POST' })
      return { ok: true as const }
    }, { ok: false as const, error: 'Not connected to Todoist.' })
    return result
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : `Failed to ${action} task.`
    }
  }
}
