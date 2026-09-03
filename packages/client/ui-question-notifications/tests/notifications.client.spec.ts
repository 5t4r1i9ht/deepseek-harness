// @vitest-environment jsdom
import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { SessionPendingInteractionBase } from '@deepseek-ai/dsh-client-ui-session/client'
import type { PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QuestionNotifications } from '../src/client/notifications.ts'
import * as plugin from '../src/client/index.ts'
import type { NotificationRowInjected } from '../src/client/NotificationRow.tsx'
import * as host from '../src/index.ts'

class BrowserNotification {
  static permission: NotificationPermission = 'default'
  static requestPermission = vi.fn(async (): Promise<NotificationPermission> => {
    BrowserNotification.permission = 'granted'
    return 'granted'
  })

  onclick: ((event: Event) => void) | null = null
  onerror: (() => void) | null = null
  close = vi.fn()

  constructor(readonly title: string, readonly options: NotificationOptions) {
    delivered.push(this)
  }
}

let delivered: BrowserNotification[]
const cleanups: (() => void | Promise<void>)[] = []
const sessionId = 'notification-session' as SessionId

beforeEach(() => {
  delivered = []
  BrowserNotification.permission = 'default'
  BrowserNotification.requestPermission.mockClear()
  vi.stubGlobal('Notification', BrowserNotification)
  vi.stubGlobal('isSecureContext', true)
  vi.spyOn(window, 'focus').mockImplementation(() => {})
})

afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function bench() {
  const pending = createSnapshotStore<ReadonlyMap<SessionId, SessionPendingInteractionBase>>(new Map())
  const navigate = vi.fn()
  const controller = new QuestionNotifications(pending, navigate, () => ({ title: 'Question', body: 'Open session' }))
  const stop = controller.start()
  cleanups.push(stop)
  const publish = (kind = 'question', key = 'request'): SessionPendingInteractionBase => {
    const request = { sessionId, kind, key }
    pending.set(new Map([[sessionId, request]]))
    return request
  }
  return { controller, pending, publish, navigate, stop }
}

describe('question notifications', () => {
  it('requires a user gesture and notifies a request still pending after permission is granted', async () => {
    const b = bench()
    b.publish()
    expect(delivered).toEqual([])
    expect(BrowserNotification.requestPermission).not.toHaveBeenCalled()
    await b.controller.enable()
    expect(delivered).toHaveLength(1)
    expect(delivered[0]).toMatchObject({ title: 'Question', options: { body: 'Open session' } })
    expect(b.controller.state.getSnapshot()).toEqual({ permission: 'granted', requesting: false, failed: false })
  })

  it('delivers questions and plan reviews once and closes replaced or completed requests', () => {
    BrowserNotification.permission = 'granted'
    const b = bench()
    const request = b.publish()
    b.pending.set(new Map([[sessionId, request]]))
    window.dispatchEvent(new Event('focus'))
    document.dispatchEvent(new Event('visibilitychange'))
    expect(delivered).toHaveLength(1)
    b.publish('plan-review', 'plan')
    expect(delivered).toHaveLength(2)
    expect(delivered[0]!.close).toHaveBeenCalledOnce()
    b.pending.set(new Map())
    expect(delivered[1]!.close).toHaveBeenCalledOnce()
    expect(delivered[1]!.onclick).toBeNull()
  })

  it('does not repeat a question after another interaction temporarily takes precedence', () => {
    BrowserNotification.permission = 'granted'
    const b = bench()
    const request = b.publish()
    b.publish('approval', 'approval')
    b.pending.set(new Map([[sessionId, request]]))
    expect(delivered).toHaveLength(1)
  })

  it('opens the requesting session and closes its notification on click', () => {
    BrowserNotification.permission = 'granted'
    const b = bench()
    b.publish()
    const event = new Event('click', { cancelable: true })
    delivered[0]!.onclick!(event)
    expect(event.defaultPrevented).toBe(true)
    expect(window.focus).toHaveBeenCalledOnce()
    expect(b.navigate).toHaveBeenCalledWith(sessionId)
    expect(delivered[0]!.close).toHaveBeenCalledOnce()
  })

  it.each(['denied', 'missing', 'insecure'] as const)('keeps questions usable with %s notifications', async (mode) => {
    if (mode === 'denied') BrowserNotification.permission = 'denied'
    if (mode === 'missing') vi.stubGlobal('Notification', undefined)
    if (mode === 'insecure') vi.stubGlobal('isSecureContext', false)
    const b = bench()
    b.publish()
    await b.controller.enable()
    expect(delivered).toEqual([])
    expect(b.controller.state.getSnapshot().permission).toBe(mode === 'denied' ? 'denied' : 'unsupported')
  })

  it('closes notifications after browser permission is revoked', () => {
    BrowserNotification.permission = 'granted'
    const b = bench()
    b.publish()
    BrowserNotification.permission = 'denied'
    window.dispatchEvent(new Event('focus'))
    expect(delivered[0]!.close).toHaveBeenCalledOnce()
  })

  it('does not deliver questions answered while the permission dialog is open', async () => {
    const grant = Promise.withResolvers<NotificationPermission>()
    BrowserNotification.requestPermission.mockImplementationOnce(() => grant.promise)
    const b = bench()
    b.publish()
    const request = b.controller.enable()
    await b.controller.enable()
    expect(BrowserNotification.requestPermission).toHaveBeenCalledOnce()
    expect(b.controller.state.getSnapshot().requesting).toBe(true)
    b.pending.set(new Map())
    BrowserNotification.permission = 'granted'
    grant.resolve('granted')
    await request
    expect(delivered).toEqual([])
  })

  it.each([true, false])('contains a permission rejection after disposal=%s', async (dispose) => {
    const grant = Promise.withResolvers<NotificationPermission>()
    BrowserNotification.requestPermission.mockImplementationOnce(() => grant.promise)
    const b = bench()
    const request = b.controller.enable()
    if (dispose) b.stop()
    grant.reject(new Error('browser rejected permission request'))
    await request
    expect(b.controller.state.getSnapshot().failed).toBe(!dispose)
  })

  it('stops notifications and permission continuations on disposal', async () => {
    const grant = Promise.withResolvers<NotificationPermission>()
    BrowserNotification.requestPermission.mockImplementationOnce(() => grant.promise)
    const b = bench()
    b.publish()
    const request = b.controller.enable()
    b.stop()
    BrowserNotification.permission = 'granted'
    grant.resolve('granted')
    await request
    await b.controller.enable()
    b.publish('question', 'later')
    window.dispatchEvent(new Event('focus'))
    expect(delivered).toEqual([])
  })

  it('reports constructor failures and permits an explicit retry', async () => {
    BrowserNotification.permission = 'granted'
    const constructor = vi.fn(function () { throw new Error('desktop notifications unavailable') })
    Object.assign(constructor, { permission: 'granted' })
    vi.stubGlobal('Notification', constructor)
    const b = bench()
    b.publish()
    expect(b.controller.state.getSnapshot().failed).toBe(true)
    vi.stubGlobal('Notification', BrowserNotification)
    await b.controller.enable()
    expect(delivered).toHaveLength(1)
    expect(b.controller.state.getSnapshot().failed).toBe(false)
  })

  it('reports delivery errors, retries, and closes notifications on disposal', async () => {
    BrowserNotification.permission = 'granted'
    const b = bench()
    b.publish()
    delivered[0]!.onerror!()
    expect(b.controller.state.getSnapshot().failed).toBe(true)
    expect(delivered[0]!.close).toHaveBeenCalledOnce()
    await b.controller.enable()
    expect(delivered).toHaveLength(2)
    b.stop()
    expect(delivered[1]!.close).toHaveBeenCalledOnce()
    b.publish('question', 'later')
    expect(delivered).toHaveLength(2)
  })
})

it('unloads its slot, dictionaries, notifications, and subscription with the plugin fiber', async () => {
  const ctx = new Context()
  cleanups.push(() => ctx.fiber.dispose())
  await ctx.plugin(SlotRegistry).await()
  const slots = ctx.get('slots') as SlotRegistry
  const locale = new LocaleRuntime(ctx)
  locale.setLocale('en')
  ctx.provide('locale', locale)
  const pending = createSnapshotStore<ReadonlyMap<SessionId, SessionPendingInteractionBase>>(new Map())
  const open = vi.fn()
  ctx.provide('sessions', { open } as never)
  ctx.provide('uiSession', { pendingInteractions: pending } as never)
  const fiber = ctx.plugin(plugin)
  await fiber.await()
  expect(slots.entries('settings.general.item')).toHaveLength(0)
  slots.register({
    name: 'root', children: { 'settings.general.item': { kind: 'list', scope: 'root' } },
  }, ({ renderSlot }: PropsRenderSlots<'settings.general.item'>) => renderSlot('settings.general.item', {}))
  const entry = slots.entries('settings.general.item')[0]!
  const injected = (entry.inject as unknown as () => NotificationRowInjected)()
  await injected.enable()
  pending.set(new Map([[sessionId, { sessionId, kind: 'question', key: 'live' }]]))
  expect(delivered[0]!.title).toBe('An agent needs your answer')
  delivered[0]!.onclick!(new Event('click'))
  expect(open).toHaveBeenCalledWith(sessionId)
  pending.set(new Map([[sessionId, { sessionId, kind: 'question', key: 'second' }]]))
  await fiber.dispose()
  expect(delivered[1]!.close).toHaveBeenCalledOnce()
  expect(slots.entries('settings.general.item')).toEqual([])
  expect(() => locale.register('questionNotifications', { en: {} as never, zh: {} as never })).not.toThrow()
  pending.set(new Map([[sessionId, { sessionId, kind: 'question', key: 'third' }]]))
  expect(delivered).toHaveLength(2)
  expect('default' in host).toBe(false)
  const loader = Object.create(Loader.prototype) as Loader
  expect(loader.unwrapExports(host)).toBe(host)
  expect(loader.unwrapExports(plugin)).toBe(plugin)
  host.apply()
})
