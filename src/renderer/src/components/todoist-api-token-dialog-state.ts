export type TodoistApiTokenDialogConnectState = 'idle' | 'connecting' | 'error'

export type TodoistApiTokenDialogState = {
  apiKeyDraft: string
  connectState: TodoistApiTokenDialogConnectState
  connectError: string | null
}

export const CLOSED_TODOIST_API_TOKEN_DIALOG_STATE: TodoistApiTokenDialogState = Object.freeze({
  apiKeyDraft: '',
  connectState: 'idle',
  connectError: null
})

export function createTodoistApiTokenDialogState(): TodoistApiTokenDialogState {
  return CLOSED_TODOIST_API_TOKEN_DIALOG_STATE
}

export function resolveTodoistApiTokenDialogState(
  state: TodoistApiTokenDialogState,
  open: boolean
): TodoistApiTokenDialogState {
  if (open) {
    return state
  }
  if (state.apiKeyDraft === '' && state.connectState === 'idle' && state.connectError === null) {
    return state
  }
  return CLOSED_TODOIST_API_TOKEN_DIALOG_STATE
}
