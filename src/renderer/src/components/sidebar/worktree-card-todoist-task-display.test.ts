import { describe, expect, it } from 'vitest'
import { getConfiguredWorktreeCardTodoistTaskDisplay } from './worktree-card-todoist-task-display'

describe('getWorktreeCardTodoistTaskDisplay', () => {
  it('reads a linked Todoist task from the worktree', () => {
    expect(
      getConfiguredWorktreeCardTodoistTaskDisplay(
        {
          linkedWorkItem: {
            provider: 'todoist',
            type: 'issue',
            number: 0,
            title: 'Ship provider',
            url: 'https://app.todoist.com/app/task/abc',
            todoistIdentifier: 'abc'
          }
        },
        ['todoist-task']
      )
    ).toEqual({
      identifier: 'abc',
      title: 'Ship provider',
      url: 'https://app.todoist.com/app/task/abc'
    })
  })

  it('hides the card property when it is not configured', () => {
    expect(
      getConfiguredWorktreeCardTodoistTaskDisplay(
        {
          linkedWorkItem: {
            provider: 'todoist',
            type: 'issue',
            number: 0,
            title: 'Ship provider',
            url: 'https://app.todoist.com/app/task/abc',
            todoistIdentifier: 'abc'
          }
        },
        ['jira-issue']
      )
    ).toBeNull()
  })
})
