/** Browser question alerts and their General-settings permission entry. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import { QuestionNotifications } from './notifications.ts'
import { NotificationRow } from './NotificationRow.tsx'
import { en, zh, type NotificationKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Browser question notifications and permission settings. */
    questionNotifications: NotificationKey
  }
}

/** Required Client services for questions, navigation, settings, and copy. */
export const inject = ['uiSession', 'sessions', 'slots', 'locale']

/**
 * Notify for answerable requests without taking ownership of their answers.
 * @param ctx - browser plugin context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('questionNotifications', { en, zh }), 'question notification copy')
  const t = ctx.locale.bind('questionNotifications')
  const notifications = new QuestionNotifications(
    ctx.uiSession.pendingInteractions,
    (sessionId) => { ctx.sessions.open(sessionId) },
    () => ({ title: t('notificationTitle'), body: t('notificationBody') }),
  )
  ctx.effect(() => notifications.start(), 'question notifications')
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'question-notifications',
    order: 30,
    locale: 'questionNotifications',
    inject: () => ({
      hooks: { notification: notifications.state },
      enable: () => notifications.enable(),
    }),
  }, NotificationRow))
}
