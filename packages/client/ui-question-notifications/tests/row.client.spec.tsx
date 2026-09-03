// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { NotificationRow, type NotificationRowProps } from '../src/client/NotificationRow.tsx'
import { en } from '../src/client/locales.ts'
import type { NotificationState } from '../src/client/notifications.ts'

afterEach(cleanup)

it.each([
  ['default', false, false, 'Enable notifications', false, en.description],
  ['granted', false, false, 'Enabled', true, en.grantedDescription],
  ['denied', false, false, 'Blocked in browser settings', true, en.deniedDescription],
  ['unsupported', false, false, 'Unavailable in this browser', true, en.unsupportedDescription],
  ['default', true, false, 'Waiting for permission', true, en.description],
  ['granted', false, true, 'Try again', false, en.failed],
] as const)('shows %s permission with requesting=%s and failed=%s', (permission, requesting, failed, label, disabled, description) => {
  const state: NotificationState = { permission, requesting, failed }
  const enable = vi.fn(async () => {})
  const unused = (() => { throw new Error('unused global hook') }) as never
  const props: NotificationRowProps = {
    useSessions: unused, useWorkspaces: unused, useSessionPendingInteraction: unused,
    t: key => (en as Record<string, string>)[key] ?? key,
    useNotification: selector => selector(state),
    enable,
  }
  render(<NotificationRow {...props} />)
  expect(screen.getByRole('status').textContent).toBe(description)
  const button = screen.getByRole('button', { name: label }) as HTMLButtonElement
  expect(button.disabled).toBe(disabled)
  fireEvent.click(button)
  expect(enable).toHaveBeenCalledTimes(disabled ? 0 : 1)
})
