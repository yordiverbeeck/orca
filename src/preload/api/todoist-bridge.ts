import { ipcRenderer } from 'electron'
import type { TodoistApi } from './todoist-api'

export const todoistApi: TodoistApi = {
  connect: (args) => ipcRenderer.invoke('todoist:connect', args),
  disconnect: () => ipcRenderer.invoke('todoist:disconnect'),
  status: () => ipcRenderer.invoke('todoist:status'),
  testConnection: () => ipcRenderer.invoke('todoist:testConnection'),
  listTasks: (args) => ipcRenderer.invoke('todoist:listTasks', args),
  searchTasks: (args) => ipcRenderer.invoke('todoist:searchTasks', args),
  getTask: (args) => ipcRenderer.invoke('todoist:getTask', args),
  listProjects: () => ipcRenderer.invoke('todoist:listProjects'),
  listComments: (args) => ipcRenderer.invoke('todoist:listComments', args),
  addComment: (args) => ipcRenderer.invoke('todoist:addComment', args),
  completeTask: (args) => ipcRenderer.invoke('todoist:completeTask', args),
  reopenTask: (args) => ipcRenderer.invoke('todoist:reopenTask', args)
}
