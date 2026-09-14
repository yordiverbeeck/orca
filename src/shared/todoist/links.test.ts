import { describe, expect, it } from 'vitest'
import { buildTodoistTaskUrl, parseTodoistTaskInput } from './links'

describe('parseTodoistTaskInput', () => {
  it('parses app.todoist.com task URLs', () => {
    expect(parseTodoistTaskInput('https://app.todoist.com/app/task/6XGgmFVcrG5RRjVr')).toEqual({
      taskId: '6XGgmFVcrG5RRjVr'
    })
  })

  it('parses legacy showTask URLs', () => {
    expect(parseTodoistTaskInput('https://todoist.com/showTask?id=6XGgmFVcrG5RRjVr')).toEqual({
      taskId: '6XGgmFVcrG5RRjVr'
    })
  })

  it('accepts a bare task id', () => {
    expect(parseTodoistTaskInput('6XGgmFVcrG5RRjVr')).toEqual({ taskId: '6XGgmFVcrG5RRjVr' })
  })

  it('rejects non-http URLs and unknown hosts', () => {
    expect(parseTodoistTaskInput('file://app.todoist.com/app/task/abc')).toBeNull()
    expect(parseTodoistTaskInput('https://linear.app/eng/issue/ENG-1')).toBeNull()
    expect(parseTodoistTaskInput('https://app.todoist.com/app/project/123')).toBeNull()
  })

  it('builds the canonical task URL', () => {
    expect(buildTodoistTaskUrl('6XGgmFVcrG5RRjVr')).toBe(
      'https://app.todoist.com/app/task/6XGgmFVcrG5RRjVr'
    )
  })
})
