import { describe, expect, it } from 'vitest'
import {
  isBlockingTodoistUrlIntent,
  parseBoundedSmartWorkspaceTodoistTaskInput
} from './smart-workspace-todoist-intent'

describe('smart workspace Todoist intent', () => {
  it('parses a pasted task URL', () => {
    expect(
      parseBoundedSmartWorkspaceTodoistTaskInput('https://app.todoist.com/app/task/6XGgmFVcrG5RRjVr')
    ).toEqual({ taskId: '6XGgmFVcrG5RRjVr' })
  })

  it('treats a Todoist URL as blocking in smart mode', () => {
    expect(
      isBlockingTodoistUrlIntent('smart', 'https://todoist.com/showTask?id=6XGgmFVcrG5RRjVr')
    ).toBe(true)
    expect(isBlockingTodoistUrlIntent('github', 'https://app.todoist.com/app/task/abc')).toBe(false)
  })
})
