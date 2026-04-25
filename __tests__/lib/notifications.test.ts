import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock must be declared before importing the module under test
vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}))

import { createNotification } from '@/lib/notifications'
import { prisma } from '@/lib/prisma'

const createMock = prisma.notification.create as ReturnType<typeof vi.fn>

beforeEach(() => {
  createMock.mockClear()
})

describe('createNotification — self-notification guard', () => {
  it('does not call prisma when actor and recipient are the same user', async () => {
    await createNotification({
      recipientUserId: 'user-1',
      actorUserId:     'user-1',
      type:            'LIKE',
      postId:          'post-abc',
    })
    expect(createMock).not.toHaveBeenCalled()
  })
})

describe('createNotification — happy path', () => {
  it('creates a notification with the correct data', async () => {
    await createNotification({
      recipientUserId: 'recipient-1',
      actorUserId:     'actor-2',
      type:            'LIKE',
      postId:          'post-xyz',
    })
    expect(createMock).toHaveBeenCalledOnce()
    expect(createMock).toHaveBeenCalledWith({
      data: {
        userId:  'recipient-1',
        actorId: 'actor-2',
        type:    'LIKE',
        postId:  'post-xyz',
      },
    })
  })

  it('creates a COMMENT notification', async () => {
    await createNotification({
      recipientUserId: 'owner',
      actorUserId:     'commenter',
      type:            'COMMENT',
      postId:          'post-1',
    })
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'COMMENT' }) }),
    )
  })

  it('creates a SHARE notification', async () => {
    await createNotification({
      recipientUserId: 'owner',
      actorUserId:     'sharer',
      type:            'SHARE',
      postId:          'post-2',
    })
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'SHARE' }) }),
    )
  })
})

describe('createNotification — silent error handling', () => {
  it('does not throw when prisma.create rejects', async () => {
    createMock.mockRejectedValueOnce(new Error('DB connection lost'))
    await expect(
      createNotification({
        recipientUserId: 'user-a',
        actorUserId:     'user-b',
        type:            'LIKE',
        postId:          'post-err',
      }),
    ).resolves.toBeUndefined()
  })

  it('does not propagate DB errors to the caller', async () => {
    createMock.mockRejectedValueOnce(new Error('Unique constraint violation'))
    let threw = false
    try {
      await createNotification({
        recipientUserId: 'user-a',
        actorUserId:     'user-b',
        type:            'COMMENT',
        postId:          'post-dup',
      })
    } catch {
      threw = true
    }
    expect(threw).toBe(false)
  })
})
