export type TodoistViewer = {
  id: string
  email: string
  fullName: string
}

export type TodoistConnectionStatus = {
  connected: boolean
  viewer: TodoistViewer | null
  credentialError?: string
}

export type TodoistDue = {
  date: string
  datetime?: string | null
  string?: string | null
}

export type TodoistTask = {
  id: string
  content: string
  description: string
  url: string
  projectId: string | null
  projectName: string | null
  labels: string[]
  due: TodoistDue | null
  completed: boolean
  updatedAt: string | null
}

export type TodoistProject = {
  id: string
  name: string
}

export type TodoistComment = {
  id: string
  content: string
  postedAt: string
}

export type TodoistConnectResult =
  | { ok: true; viewer: TodoistViewer }
  | { ok: false; error: string }

export type TodoistMutationResult = { ok: true } | { ok: false; error: string }

export type TodoistCommentResult = { ok: true; id: string } | { ok: false; error: string }
