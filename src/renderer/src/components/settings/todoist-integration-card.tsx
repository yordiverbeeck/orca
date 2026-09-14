import { useState } from 'react'
import { AlertCircle, CheckCircle2, LoaderCircle, Unlink } from 'lucide-react'
import { TodoistIcon } from '@/components/icons/TodoistIcon'
import { TodoistApiTokenDialog } from '@/components/todoist-api-token-dialog'
import { Button } from '@/components/ui/button'
import { useMountedRef } from '@/hooks/useMountedRef'
import { getProviderRuntimeContextKey } from '@/lib/provider-runtime-context'
import { useAppStore } from '@/store'
import { IntegrationCardDetails, IntegrationCardShell } from './integration-card-shell'
import { useIntegrationSubordinateRowClass } from './integration-card-presentation'
import { getProviderAccountScope } from './provider-account-scope'
import { ProviderHostScopeControl } from './ProviderHostScopeControl'
import { TODOIST_INTEGRATION_SECTION_ID } from './task-provider-integration-section-ids'
import { translate } from '@/i18n/i18n'

type VerificationResult = { state: 'ok' | 'error'; error?: string }

export function TodoistIntegrationCard(): React.JSX.Element {
  const todoistStatus = useAppStore((s) => s.todoistStatus)
  const todoistStatusChecked = useAppStore((s) => s.todoistStatusChecked)
  const todoistStatusContextKey = useAppStore((s) => s.todoistStatusContextKey)
  const disconnectTodoist = useAppStore((s) => s.disconnectTodoist)
  const checkTodoistConnection = useAppStore((s) => s.checkTodoistConnection)
  const testTodoistConnection = useAppStore((s) => s.testTodoistConnection)
  const settings = useAppStore((s) => s.settings)
  const mountedRef = useMountedRef()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<VerificationResult | null>(null)
  const contextMatches = todoistStatusContextKey === getProviderRuntimeContextKey(settings)
  const checking = !contextMatches || !todoistStatusChecked
  const connected = contextMatches && todoistStatus.connected
  const viewer = todoistStatus.viewer
  const accountScope = getProviderAccountScope(settings)
  const subordinateRowClass = useIntegrationSubordinateRowClass('flex items-center gap-3')

  const handleTest = async (): Promise<void> => {
    setTesting(true)
    setTestResult(null)
    const result = await testTodoistConnection()
    if (!mountedRef.current) {
      return
    }
    setTestResult(result.ok ? { state: 'ok' } : { state: 'error', error: result.error })
    setTesting(false)
  }

  return (
    <IntegrationCardShell
      settingsSectionId={TODOIST_INTEGRATION_SECTION_ID}
      icon={<TodoistIcon className="size-5" />}
      name="Todoist"
      description={
        connected
          ? translate(
              'auto.components.settings.todoist.integration.card.connectedDescription',
              'Todoist is connected. Browse tasks and start workspaces from them.'
            )
          : checking
            ? translate(
                'auto.components.settings.todoist.integration.card.checking',
                'Checking Todoist access before showing setup actions.'
              )
            : translate(
                'auto.components.settings.todoist.integration.card.disconnected',
                'Add a personal API token to browse and link Todoist tasks.'
              )
      }
      checking={checking}
      statusTone={connected ? 'connected' : 'attention'}
      statusLabel={
        connected
          ? translate(
              'auto.components.settings.task.tracker.integration.cards.statusConnected',
              'Connected'
            )
          : translate(
              'auto.components.settings.task.tracker.integration.cards.statusNotConnected',
              'Not connected'
            )
      }
      actions={
        !checking ? (
          <Button
            variant={connected ? 'outline' : 'default'}
            size="sm"
            onClick={() => setDialogOpen(true)}
          >
            {connected
              ? translate(
                  'auto.components.settings.todoist.integration.card.updateAccess',
                  'Update token'
                )
              : translate(
                  'auto.components.settings.todoist.integration.card.addAccess',
                  'Add Todoist access'
                )}
          </Button>
        ) : null
      }
    >
      <IntegrationCardDetails>
        <ProviderHostScopeControl
          labelPrefix={translate(
            'auto.components.settings.task.tracker.integration.cards.account_scope_prefix',
            'Account scope'
          )}
          scope={accountScope}
          className={useIntegrationSubordinateRowClass('text-xs')}
        />
        {connected && viewer ? (
          <div className={subordinateRowClass}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{viewer.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{viewer.email}</p>
            </div>
            {testResult?.state === 'ok' ? (
              <span className="flex shrink-0 items-center gap-1 text-xs text-status-success">
                <CheckCircle2 className="size-3.5" />
                {translate(
                  'auto.components.settings.task.tracker.integration.cards.a2c0015fb8',
                  'Verified'
                )}
              </span>
            ) : null}
            {testResult?.state === 'error' ? (
              <span className="flex min-w-0 max-w-[220px] shrink items-center gap-1 truncate text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                <span className="truncate">{testResult.error}</span>
              </span>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => void handleTest()} disabled={testing}>
              {testing ? (
                <>
                  <LoaderCircle className="size-3.5 mr-1.5 animate-spin" />
                  {translate(
                    'auto.components.settings.task.tracker.integration.cards.3e7c10d286',
                    'Testing...'
                  )}
                </>
              ) : (
                translate(
                  'auto.components.settings.task.tracker.integration.cards.c24e56c532',
                  'Test'
                )
              )}
            </Button>
            <button
              onClick={() => void disconnectTodoist()}
              aria-label={translate(
                'auto.components.settings.todoist.integration.card.disconnect',
                'Disconnect Todoist'
              )}
              className="rounded-md p-1 text-muted-foreground/50 transition-colors hover:text-destructive"
            >
              <Unlink className="size-3.5" />
            </button>
          </div>
        ) : !checking ? (
          <Button variant="ghost" size="sm" onClick={() => void checkTodoistConnection()}>
            {translate(
              'auto.components.settings.task.tracker.integration.cards.c90f2ef419',
              'Re-check'
            )}
          </Button>
        ) : null}
      </IntegrationCardDetails>
      <TodoistApiTokenDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConnected={() => setTestResult(null)}
        overlayClassName="z-[110]"
        contentClassName="z-[120]"
      />
    </IntegrationCardShell>
  )
}
