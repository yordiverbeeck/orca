import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, LoaderCircle, RotateCcw } from 'lucide-react'
import { TodoistIcon } from '@/components/icons/TodoistIcon'
import { TodoistApiTokenDialog } from '@/components/todoist-api-token-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { translate } from '@/i18n/i18n'
import { useAppStore } from '@/store'
import { getLinkedWorkItemWorkspaceName } from '@/lib/new-workspace'
import { getProviderRuntimeContextKey } from '@/lib/provider-runtime-context'
import { buildTodoistWorkspaceSource } from '../../../../../shared/new-workspace/workspace-source'
import type { TodoistComment, TodoistProject, TodoistTask } from '../../../../../shared/todoist-types'
import { cn } from '@/lib/utils'

export function TaskPageTodoistContent(): React.JSX.Element {
  const settings = useAppStore((s) => s.settings)
  const todoistStatus = useAppStore((s) => s.todoistStatus)
  const todoistStatusChecked = useAppStore((s) => s.todoistStatusChecked)
  const todoistStatusContextKey = useAppStore((s) => s.todoistStatusContextKey)
  const hideTaskSource = useAppStore((s) => s.updateSettings)
  const listTodoistTasks = useAppStore((s) => s.listTodoistTasks)
  const searchTodoistTasks = useAppStore((s) => s.searchTodoistTasks)
  const listTodoistProjects = useAppStore((s) => s.listTodoistProjects)
  const fetchTodoistTask = useAppStore((s) => s.fetchTodoistTask)
  const listTodoistComments = useAppStore((s) => s.listTodoistComments)
  const addTodoistComment = useAppStore((s) => s.addTodoistComment)
  const completeTodoistTask = useAppStore((s) => s.completeTodoistTask)
  const reopenTodoistTask = useAppStore((s) => s.reopenTodoistTask)
  const openModal = useAppStore((s) => s.openModal)
  const recordFeatureInteraction = useAppStore((s) => s.recordFeatureInteraction)

  const contextMatches = todoistStatusContextKey === getProviderRuntimeContextKey(settings)
  const checking = !contextMatches || !todoistStatusChecked
  const connected = contextMatches && todoistStatus.connected

  const [connectOpen, setConnectOpen] = useState(false)
  const [projects, setProjects] = useState<TodoistProject[]>([])
  const [projectId, setProjectId] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [tasks, setTasks] = useState<TodoistTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<TodoistTask | null>(null)
  const [comments, setComments] = useState<TodoistComment[]>([])
  const [commentDraft, setCommentDraft] = useState('')
  const [mutating, setMutating] = useState(false)

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(handle)
  }, [query])

  useEffect(() => {
    if (!connected) {
      return
    }
    void listTodoistProjects()
      .then(setProjects)
      .catch(() => setProjects([]))
  }, [connected, listTodoistProjects])

  useEffect(() => {
    if (!connected) {
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const selectedProject = projectId === 'all' ? undefined : projectId
    const request = debouncedQuery
      ? searchTodoistTasks({ query: debouncedQuery, projectId: selectedProject })
      : listTodoistTasks({ projectId: selectedProject })
    void request
      .then((next) => {
        if (!cancelled) {
          setTasks(next)
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : 'Failed to load tasks.')
          setTasks([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [connected, debouncedQuery, listTodoistTasks, projectId, searchTodoistTasks])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      setComments([])
      return
    }
    let cancelled = false
    void Promise.all([fetchTodoistTask(selectedId), listTodoistComments(selectedId)])
      .then(([task, nextComments]) => {
        if (!cancelled) {
          setDetail(task)
          setComments(nextComments)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(tasks.find((task) => task.id === selectedId) ?? null)
          setComments([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [fetchTodoistTask, listTodoistComments, selectedId, tasks])

  const selected = detail ?? tasks.find((task) => task.id === selectedId) ?? null

  const startWorkspace = useCallback(
    (task: TodoistTask): void => {
      recordFeatureInteraction?.('todoist-tasks')
      const linkedWorkItem = buildTodoistWorkspaceSource(task)
      openModal('new-workspace-composer', {
        linkedWorkItem,
        prefilledName: getLinkedWorkItemWorkspaceName(linkedWorkItem)?.seedName ?? task.content,
        telemetrySource: 'sidebar'
      })
    },
    [openModal, recordFeatureInteraction]
  )

  const handleCompleteToggle = useCallback(async (): Promise<void> => {
    if (!selected || mutating) {
      return
    }
    setMutating(true)
    const result = selected.completed
      ? await reopenTodoistTask(selected.id)
      : await completeTodoistTask(selected.id)
    if (result.ok) {
      const nextCompleted = !selected.completed
      setDetail({ ...selected, completed: nextCompleted })
      setTasks((current) =>
        current
          .map((task) => (task.id === selected.id ? { ...task, completed: nextCompleted } : task))
          .filter((task) => (nextCompleted ? task.id !== selected.id : true))
      )
      if (nextCompleted) {
        setSelectedId(null)
      }
    }
    setMutating(false)
  }, [completeTodoistTask, mutating, reopenTodoistTask, selected])

  const handleAddComment = useCallback(async (): Promise<void> => {
    if (!selected || !commentDraft.trim()) {
      return
    }
    const result = await addTodoistComment(selected.id, commentDraft.trim())
    if (result.ok) {
      setCommentDraft('')
      setComments(await listTodoistComments(selected.id))
    }
  }, [addTodoistComment, commentDraft, listTodoistComments, selected])

  const visibleTasks = useMemo(
    () => tasks.filter((task) => !task.completed || task.id === selectedId),
    [selectedId, tasks]
  )

  if (checking) {
    return (
      <div className="mt-4 flex items-center justify-center py-14">
        <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center rounded-md border border-border/50 bg-muted/50 px-6 py-14 text-center shadow-sm">
        <TodoistIcon className="mb-4 size-8 text-muted-foreground/60" />
        <p className="text-base font-medium text-foreground">
          {translate('auto.components.TaskPage.todoistConnectTitle', 'Connect Todoist')}
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {translate(
            'auto.components.TaskPage.todoistConnectBody',
            'Paste a personal API token to browse incomplete tasks and start workspaces from them.'
          )}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => setConnectOpen(true)}>
            {translate('auto.components.TaskPage.todoistConnectButton', 'Connect Todoist')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const visible = (settings?.visibleTaskProviders ?? []).filter(
                (provider) => provider !== 'todoist'
              )
              void hideTaskSource({
                visibleTaskProviders: visible.length > 0 ? visible : ['github']
              })
            }}
          >
            {translate('auto.components.TaskPage.todoistHide', 'Hide Todoist')}
          </Button>
        </div>
        <TodoistApiTokenDialog open={connectOpen} onOpenChange={setConnectOpen} />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 max-h-full overflow-hidden rounded-md rounded-t-none border border-t-0 border-border/50 bg-background shadow-sm">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-10 flex-none items-center gap-2 border-b border-border/50 bg-muted/35 px-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={translate(
              'auto.components.TaskPage.todoistSearchPlaceholder',
              'Search tasks'
            )}
            className="h-7 max-w-[240px] text-xs"
          />
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="h-7 w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {translate('auto.components.TaskPage.todoistAllProjects', 'All projects')}
              </SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto text-[11px] text-muted-foreground">
            {visibleTasks.length} {translate('auto.components.TaskPage.b7bae28b6a', 'shown')}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-sleek">
          {todoistStatus.credentialError ? (
            <div className="border-b border-border px-4 py-4 text-sm text-destructive">
              {todoistStatus.credentialError}
            </div>
          ) : null}
          {error ? (
            <div className="border-b border-border px-4 py-4 text-sm text-destructive">{error}</div>
          ) : null}
          {loading && tasks.length === 0 ? (
            <div className="divide-y divide-border/50">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="px-3 py-3">
                  <div className="h-4 w-4/5 animate-pulse rounded bg-muted/70" />
                  <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-muted/60" />
                </div>
              ))}
            </div>
          ) : null}
          {!loading && visibleTasks.length === 0 && !error ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              {translate('auto.components.TaskPage.todoistEmpty', 'No incomplete Todoist tasks.')}
            </div>
          ) : null}
          <div className="divide-y divide-border/50">
            {visibleTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => setSelectedId(task.id)}
                className={cn(
                  'flex w-full flex-col gap-1 px-3 py-3 text-left hover:bg-muted/40',
                  selectedId === task.id && 'bg-muted/60'
                )}
              >
                <span className="text-sm font-medium text-foreground">{task.content}</span>
                <span className="text-[11px] text-muted-foreground">
                  {[task.projectName, task.due?.string ?? task.due?.date].filter(Boolean).join(' · ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {selected ? (
        <aside className="flex w-[320px] shrink-0 flex-col border-l border-border/50">
          <div className="space-y-3 overflow-y-auto p-4">
            <p className="text-sm font-semibold leading-snug text-foreground">{selected.content}</p>
            {selected.description ? (
              <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                {selected.description}
              </p>
            ) : null}
            <dl className="space-y-1 text-xs text-muted-foreground">
              {selected.projectName ? (
                <div>
                  {translate('auto.components.TaskPage.todoistProject', 'Project')}:{' '}
                  {selected.projectName}
                </div>
              ) : null}
              {selected.due ? (
                <div>
                  {translate('auto.components.TaskPage.todoistDue', 'Due')}:{' '}
                  {selected.due.string ?? selected.due.date}
                </div>
              ) : null}
              {selected.labels.length > 0 ? (
                <div>
                  {translate('auto.components.TaskPage.todoistLabels', 'Labels')}:{' '}
                  {selected.labels.join(', ')}
                </div>
              ) : null}
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => startWorkspace(selected)}>
                {translate('auto.components.TaskPage.todoistStartWorkspace', 'Start workspace')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleCompleteToggle()}
                disabled={mutating}
              >
                {selected.completed ? (
                  <>
                    <RotateCcw className="mr-1.5 size-3.5" />
                    {translate('auto.components.TaskPage.todoistReopen', 'Reopen')}
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 size-3.5" />
                    {translate('auto.components.TaskPage.todoistComplete', 'Complete')}
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {translate('auto.components.TaskPage.todoistComments', 'Comments')}
              </p>
              {comments.map((comment) => (
                <p key={comment.id} className="text-xs text-foreground">
                  {comment.content}
                </p>
              ))}
              <Input
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder={translate(
                  'auto.components.TaskPage.todoistCommentPlaceholder',
                  'Add a comment'
                )}
                className="h-7 text-xs"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void handleAddComment()
                  }
                }}
              />
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  )
}
