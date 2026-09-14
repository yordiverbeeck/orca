import { useId, useState } from 'react'
import { ExternalLink, LoaderCircle } from 'lucide-react'
import { buildTodoistDeveloperSettingsUrl } from '../../../shared/todoist/links'
import { useAppStore } from '@/store'
import { useMountedRef } from '@/hooks/useMountedRef'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  createTodoistApiTokenDialogState,
  resolveTodoistApiTokenDialogState
} from './todoist-api-token-dialog-state'
import { translate } from '@/i18n/i18n'

type TodoistApiTokenDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected?: () => void
  overlayClassName?: string
  contentClassName?: string
}

export function TodoistApiTokenDialog({
  open,
  onOpenChange,
  onConnected,
  overlayClassName,
  contentClassName
}: TodoistApiTokenDialogProps): React.JSX.Element {
  const connectTodoist = useAppStore((s) => s.connectTodoist)
  const mountedRef = useMountedRef()
  const apiKeyInputId = useId()
  const apiKeyErrorId = useId()
  const [dialogState, setDialogState] = useState(createTodoistApiTokenDialogState)
  const resolvedDialogState = resolveTodoistApiTokenDialogState(dialogState, open)
  if (resolvedDialogState !== dialogState) {
    setDialogState(resolvedDialogState)
  }
  const { apiKeyDraft, connectState, connectError } = resolvedDialogState

  const handleOpenChange = (nextOpen: boolean): void => {
    if (connectState !== 'connecting') {
      onOpenChange(nextOpen)
    }
  }

  const handleConnect = async (): Promise<void> => {
    const apiKey = apiKeyDraft.trim()
    if (!apiKey || connectState === 'connecting') {
      return
    }
    setDialogState((current) => ({ ...current, connectState: 'connecting', connectError: null }))
    try {
      const result = await connectTodoist(apiKey)
      if (!mountedRef.current) {
        return
      }
      if (result.ok) {
        setDialogState(createTodoistApiTokenDialogState())
        onOpenChange(false)
        onConnected?.()
        return
      }
      setDialogState((current) => ({
        ...current,
        connectState: 'error',
        connectError: result.error
      }))
    } catch (error) {
      if (mountedRef.current) {
        setDialogState((current) => ({
          ...current,
          connectState: 'error',
          connectError: error instanceof Error ? error.message : 'Connection failed'
        }))
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName={overlayClassName}
        className={cn('sm:max-w-lg', contentClassName)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && apiKeyDraft.trim() && connectState !== 'connecting') {
            event.preventDefault()
            void handleConnect()
          }
        }}
      >
        <DialogHeader className="gap-3">
          <DialogTitle className="leading-tight">
            {translate('auto.components.todoist.api.token.dialog.title', 'Add Todoist access')}
          </DialogTitle>
          <DialogDescription>
            {translate(
              'auto.components.todoist.api.token.dialog.description',
              'Paste a personal API token from Todoist Settings → Integrations → Developer.'
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={apiKeyInputId} className="text-xs">
              {translate('auto.components.todoist.api.token.dialog.tokenLabel', 'API token')}
            </Label>
            <Input
              id={apiKeyInputId}
              autoFocus
              type="password"
              placeholder={translate(
                'auto.components.todoist.api.token.dialog.placeholder',
                'Paste your Todoist API token'
              )}
              value={apiKeyDraft}
              onChange={(event) => {
                const nextDraft = event.target.value
                setDialogState((current) => ({
                  apiKeyDraft: nextDraft,
                  connectState: current.connectState === 'error' ? 'idle' : current.connectState,
                  connectError: current.connectState === 'error' ? null : current.connectError
                }))
              }}
              disabled={connectState === 'connecting'}
              aria-invalid={connectState === 'error'}
              aria-describedby={connectState === 'error' ? apiKeyErrorId : undefined}
            />
          </div>
          {connectState === 'error' && connectError ? (
            <p id={apiKeyErrorId} className="text-xs text-destructive">
              {connectError}
            </p>
          ) : null}
          <p className="text-xs leading-relaxed text-muted-foreground">
            {translate(
              'auto.components.todoist.api.token.dialog.help',
              'Orca stores this token locally and encrypts it when the OS keychain is available.'
            )}
          </p>
          <a
            href={buildTodoistDeveloperSettingsUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {translate(
              'auto.components.todoist.api.token.dialog.openSettings',
              'Open Todoist developer settings'
            )}
            <ExternalLink className="size-3" />
          </a>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => void handleConnect()}
            disabled={!apiKeyDraft.trim() || connectState === 'connecting'}
          >
            {connectState === 'connecting' ? (
              <>
                <LoaderCircle className="mr-1.5 size-3.5 animate-spin" />
                {translate('auto.components.todoist.api.token.dialog.connecting', 'Connecting...')}
              </>
            ) : (
              translate('auto.components.todoist.api.token.dialog.connect', 'Connect')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
