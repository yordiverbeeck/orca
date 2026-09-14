import type {
  TodoistComment,
  TodoistCommentResult,
  TodoistConnectResult,
  TodoistConnectionStatus,
  TodoistMutationResult,
  TodoistProject,
  TodoistTask
} from '../../shared/todoist-types'

export type TodoistApi = {
  connect: (args: { apiKey: string }) => Promise<TodoistConnectResult>
  disconnect: () => Promise<void>
  status: () => Promise<TodoistConnectionStatus>
  testConnection: () => Promise<TodoistConnectResult>
  listTasks: (args?: { projectId?: string; limit?: number }) => Promise<TodoistTask[]>
  searchTasks: (args: {
    query: string
    projectId?: string
    limit?: number
  }) => Promise<TodoistTask[]>
  getTask: (args: { id: string }) => Promise<TodoistTask | null>
  listProjects: () => Promise<TodoistProject[]>
  listComments: (args: { taskId: string }) => Promise<TodoistComment[]>
  addComment: (args: { taskId: string; body: string }) => Promise<TodoistCommentResult>
  completeTask: (args: { id: string }) => Promise<TodoistMutationResult>
  reopenTask: (args: { id: string }) => Promise<TodoistMutationResult>
}
