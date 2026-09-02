import type { JSX } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCurrentUser } from '@/entities/session/server'
import { Header } from './Header'

vi.mock('@/entities/session/server', () => ({
  getCurrentUser: vi.fn(),
}))

const mockedGetCurrentUser = vi.mocked(getCurrentUser)

function getHeaderActionsElement(header: JSX.Element): JSX.Element {
  const headerElement = header.props.children as JSX.Element
  const navigation = headerElement.props.children[1] as JSX.Element
  return navigation.props.children[1] as JSX.Element
}

describe('Header', () => {
  beforeEach(() => {
    mockedGetCurrentUser.mockReset()
  })

  it('uses the server session user name as the only auth value for actions', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: '루퍼스',
      email: 'member@loopers.dev',
    })

    const header = await Header()

    expect(mockedGetCurrentUser).toHaveBeenCalledOnce()
    expect(getHeaderActionsElement(header).props).toEqual({
      userName: '루퍼스',
    })
  })

  it('passes null to actions when the server session has no user', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const header = await Header()

    expect(getHeaderActionsElement(header).props).toEqual({ userName: null })
  })
})
