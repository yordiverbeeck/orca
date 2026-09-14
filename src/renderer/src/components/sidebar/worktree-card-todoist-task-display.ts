import type { WorktreeCardProperty } from '../../../../shared/ui-chrome-types'
import type { Worktree } from '../../../../shared/worktree/types'

export type WorktreeCardTodoistTaskDisplay = {
  identifier: string
  title: string
  url: string
}

export function getWorktreeCardTodoistTaskDisplay(
  worktree: Pick<Worktree, 'linkedWorkItem'>
): WorktreeCardTodoistTaskDisplay | null {
  const item = worktree.linkedWorkItem
  if (item?.provider !== 'todoist' || item.type !== 'issue') {
    return null
  }
  const identifier = item.todoistIdentifier ?? item.url
  return {
    identifier,
    title: item.title,
    url: item.url
  }
}

export function getConfiguredWorktreeCardTodoistTaskDisplay(
  worktree: Pick<Worktree, 'linkedWorkItem'>,
  properties: readonly WorktreeCardProperty[]
): WorktreeCardTodoistTaskDisplay | null {
  return properties.includes('todoist-task') ? getWorktreeCardTodoistTaskDisplay(worktree) : null
}
