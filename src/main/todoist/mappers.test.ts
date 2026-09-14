import { describe, expect, it } from 'vitest'
import { mapPaginatedResults, mapTodoistTask, mapTodoistViewer } from './mappers'

describe('todoist mappers', () => {
  it('maps a REST task onto the shared TodoistTask shape', () => {
    expect(
      mapTodoistTask(
        {
          id: '6XGgmFVcrG5RRjVr',
          content: 'Ship provider',
          description: 'Markdown body',
          project_id: 'proj-1',
          labels: ['work'],
          due: { date: '2026-09-14', string: 'today' },
          checked: false,
          updated_at: '2026-09-14T12:00:00Z'
        },
        new Map([['proj-1', 'Inbox']])
      )
    ).toEqual({
      id: '6XGgmFVcrG5RRjVr',
      content: 'Ship provider',
      description: 'Markdown body',
      url: 'https://app.todoist.com/app/task/6XGgmFVcrG5RRjVr',
      projectId: 'proj-1',
      projectName: 'Inbox',
      labels: ['work'],
      due: { date: '2026-09-14', datetime: null, string: 'today' },
      completed: false,
      updatedAt: '2026-09-14T12:00:00Z'
    })
  })

  it('maps a viewer and paginated results', () => {
    expect(mapTodoistViewer({ id: '1', email: 'ada@example.com', full_name: 'Ada' })).toEqual({
      id: '1',
      email: 'ada@example.com',
      fullName: 'Ada'
    })
    expect(
      mapPaginatedResults({ results: [{ id: 'a', content: 'One' }, { id: 'b' }] }, mapTodoistTask)
    ).toEqual([
      expect.objectContaining({ id: 'a', content: 'One' })
    ])
  })
})
