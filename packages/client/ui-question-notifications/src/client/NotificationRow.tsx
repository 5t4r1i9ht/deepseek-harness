/** General-settings entry for this browser's notification permission. */
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { NotificationState } from './notifications.ts'
import css from './NotificationRow.module.css'

/** Permission source and the user-gesture callback bound by the plugin. */
export interface NotificationRowInjected {
  hooks: { notification: HostObservable<NotificationState> }
  enable: () => Promise<void>
}

/** Framework-derived settings row props. */
export type NotificationRowProps = PropsRuntime<'settings.general.item'>
  & PropsLocale<'questionNotifications'> & InjectFace<NotificationRowInjected>

/**
 * Render permission status and its available action.
 * @param props - settings slot props.
 * @returns the notification permission row.
 */
export function NotificationRow({ t, useNotification, enable }: NotificationRowProps) {
  const { permission, requesting, failed } = useNotification(state => state)
  const description = failed ? t('failed')
    : permission === 'granted' ? t('grantedDescription')
      : permission === 'denied' ? t('deniedDescription')
        : permission === 'unsupported' ? t('unsupportedDescription') : t('description')
  const label = requesting ? t('requesting')
    : permission === 'unsupported' ? t('unsupported')
      : permission === 'denied' ? t('denied')
        : failed ? t('retry') : permission === 'granted' ? t('enabled') : t('enable')
  return (
    <div className={css.row}>
      <div className={css.text}>
        <div>{t('title')}</div>
        <div className={css.description} role="status">{description}</div>
      </div>
      <button
        type="button"
        className={css.button}
        disabled={requesting || permission === 'unsupported' || permission === 'denied'
          || (permission === 'granted' && !failed)}
        onClick={() => { void enable() }}
      >
        {label}
      </button>
    </div>
  )
}
