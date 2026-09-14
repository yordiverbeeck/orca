import type { StateCreator } from 'zustand'
import type { AppState } from '../types'
import { getProviderRuntimeContextKey } from '@/lib/provider-runtime-context'
import type { TodoistSlice, TodoistSliceGet, TodoistSliceSet } from './todoist-slice-contract'

export type { TodoistSlice } from './todoist-slice-contract'

const DISCONNECTED: TodoistSlice['todoistStatus'] = { connected: false, viewer: null }

function createTodoistActions(set: TodoistSliceSet, get: TodoistSliceGet): Omit<
  TodoistSlice,
  'todoistStatus' | 'todoistStatusChecked' | 'todoistStatusContextKey'
> {
  return {
    checkTodoistConnection: async () => {
      const contextKey = getProviderRuntimeContextKey(get().settings)
      if (get().todoistStatusContextKey !== contextKey) {
        set({ todoistStatusChecked: false })
      }
      try {
        const status = await window.api.todoist.status()
        set({
          todoistStatus: status,
          todoistStatusChecked: true,
          todoistStatusContextKey: contextKey
        })
      } catch {
        set({
          todoistStatus: DISCONNECTED,
          todoistStatusChecked: true,
          todoistStatusContextKey: contextKey
        })
      }
    },

    connectTodoist: async (apiKey) => {
      const result = await window.api.todoist.connect({ apiKey })
      if (result.ok) {
        await get().checkTodoistConnection()
      }
      return result
    },

    testTodoistConnection: async () => {
      const result = await window.api.todoist.testConnection()
      await get().checkTodoistConnection()
      return result
    },

    disconnectTodoist: async () => {
      await window.api.todoist.disconnect()
      await get().checkTodoistConnection()
    },

    listTodoistTasks: (args) => window.api.todoist.listTasks(args),
    searchTodoistTasks: (args) => window.api.todoist.searchTasks(args),
    fetchTodoistTask: (id) => window.api.todoist.getTask({ id }),
    listTodoistProjects: () => window.api.todoist.listProjects(),
    listTodoistComments: (taskId) => window.api.todoist.listComments({ taskId }),
    addTodoistComment: (taskId, body) => window.api.todoist.addComment({ taskId, body }),
    completeTodoistTask: (id) => window.api.todoist.completeTask({ id }),
    reopenTodoistTask: (id) => window.api.todoist.reopenTask({ id })
  }
}

export const createTodoistSlice: StateCreator<AppState, [], [], TodoistSlice> = (set, get) => ({
  todoistStatus: DISCONNECTED,
  todoistStatusChecked: false,
  todoistStatusContextKey: null,
  ...createTodoistActions(set, get)
})
