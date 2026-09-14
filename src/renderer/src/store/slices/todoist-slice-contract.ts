import type { StateCreator } from 'zustand'
import type { AppState } from '../types'
import type {
  TodoistComment,
  TodoistCommentResult,
  TodoistConnectResult,
  TodoistConnectionStatus,
  TodoistMutationResult,
  TodoistProject,
  TodoistTask
} from '../../../../shared/todoist-types'

export type TodoistSlice = {
  todoistStatus: TodoistConnectionStatus
  todoistStatusChecked: boolean
  todoistStatusContextKey: string | null
  checkTodoistConnection: () => Promise<void>
  connectTodoist: (apiKey: string) => Promise<TodoistConnectResult>
  testTodoistConnection: () => Promise<TodoistConnectResult>
  disconnectTodoist: () => Promise<void>
  listTodoistTasks: (args?: { projectId?: string; limit?: number }) => Promise<TodoistTask[]>
  searchTodoistTasks: (args: {
    query: string
    projectId?: string
    limit?: number
  }) => Promise<TodoistTask[]>
  fetchTodoistTask: (id: string) => Promise<TodoistTask | null>
  listTodoistProjects: () => Promise<TodoistProject[]>
  listTodoistComments: (taskId: string) => Promise<TodoistComment[]>
  addTodoistComment: (taskId: string, body: string) => Promise<TodoistCommentResult>
  completeTodoistTask: (id: string) => Promise<TodoistMutationResult>
  reopenTodoistTask: (id: string) => Promise<TodoistMutationResult>
}

type TodoistStateCreator = StateCreator<AppState, [], [], TodoistSlice>

export type TodoistSliceSet = Parameters<TodoistStateCreator>[0]
export type TodoistSliceGet = Parameters<TodoistStateCreator>[1]
