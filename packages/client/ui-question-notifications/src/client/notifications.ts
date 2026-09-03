/** Notification lifetime follows the Client's answerable pending interactions. */
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionPendingInteractionBase } from '@deepseek-ai/dsh-client-ui-session/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** Browser-owned permission and the latest delivery/permission attempt. */
export interface NotificationState {
  permission: NotificationPermission | 'unsupported'
  requesting: boolean
  failed: boolean
}

type Pending = ReadonlyMap<SessionId, SessionPendingInteractionBase>

/** Own notifications and browser listeners for one plugin lifetime. */
export class QuestionNotifications {
  /** Permission and delivery status consumed by the settings row. */
  readonly state = createSnapshotStore<NotificationState>({
    permission: permission(), requesting: false, failed: false,
  })

  private readonly seen = new WeakSet<SessionPendingInteractionBase>()
  private readonly open = new Map<SessionPendingInteractionBase, Notification>()
  private disposed = false

  /**
   * @param pending - effective answerable interactions from uiSession.
   * @param navigate - open the owning Session.
   * @param copy - notification text in the active locale.
   */
  constructor(
    private readonly pending: HostObservable<Pending>,
    private readonly navigate: (sessionId: SessionId) => void,
    private readonly copy: () => { title: string; body: string },
  ) {}

  /**
   * Subscribe to pending requests and browser permission refreshes.
   * @returns disposer closing every notification and detaching every listener.
   */
  start(): () => void {
    const refresh = (): void => { this.sync() }
    const unsubscribe = this.pending.subscribe(refresh)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    this.sync()
    return () => {
      this.disposed = true
      unsubscribe()
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
      for (const [request, notification] of this.open) this.close(request, notification)
    }
  }

  /** Request permission from a user gesture; a late grant cannot outlive disposal. */
  async enable(): Promise<void> {
    if (this.disposed || this.state.getSnapshot().requesting) return
    const current = permission()
    if (current === 'unsupported' || current === 'denied') {
      this.sync()
      return
    }
    this.state.update((state) => { state.requesting = true; state.failed = false })
    let failed = false
    try {
      if (current === 'default') await Notification.requestPermission()
    } catch {
      // Browser permission failures are shown in the settings row.
      failed = true
    } finally {
      this.finishPermission(failed)
    }
  }

  private finishPermission(failed: boolean): void {
    if (this.disposed) return
    this.state.update((state) => { state.requesting = false; state.failed = failed })
    this.sync()
  }

  private sync(): void {
    const current = permission()
    this.state.update((state) => { state.permission = current })
    const pending = this.pending.getSnapshot()
    for (const [request, notification] of this.open) {
      if (current !== 'granted' || pending.get(request.sessionId) !== request) {
        this.close(request, notification)
      }
    }
    if (current !== 'granted') return
    for (const request of pending.values()) {
      if ((request.kind !== 'question' && request.kind !== 'plan-review') || this.seen.has(request)) continue
      const copy = this.copy()
      let notification: Notification
      try {
        notification = new Notification(copy.title, { body: copy.body })
      } catch {
        // Some browsers expose permission but cannot construct desktop notifications.
        this.state.update((state) => { state.failed = true })
        continue
      }
      this.seen.add(request)
      this.open.set(request, notification)
      notification.onerror = () => {
        this.seen.delete(request)
        this.state.update((state) => { state.failed = true })
        this.close(request, notification)
      }
      notification.onclick = (event) => {
        event.preventDefault()
        this.close(request, notification)
        window.focus()
        this.navigate(request.sessionId)
      }
    }
  }

  private close(request: SessionPendingInteractionBase, notification: Notification): void {
    notification.onclick = null
    notification.onerror = null
    notification.close()
    this.open.delete(request)
  }
}

function permission(): NotificationState['permission'] {
  return typeof Notification === 'undefined' || !window.isSecureContext
    ? 'unsupported'
    : Notification.permission
}
