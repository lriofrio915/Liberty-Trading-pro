// lib/notifications.ts
// Helper para crear notificaciones de comunidad.
// Nunca lanza error — un fallo aquí nunca debe romper la request padre.

import { prisma } from './prisma'

export async function createNotification(opts: {
  recipientUserId: string  // dueño del post
  actorUserId: string      // quien hizo la acción
  type: 'LIKE' | 'COMMENT' | 'SHARE'
  postId: string
}): Promise<void> {
  // No notificar al propio usuario
  if (opts.recipientUserId === opts.actorUserId) return

  try {
    await prisma.notification.create({
      data: {
        userId:  opts.recipientUserId,
        actorId: opts.actorUserId,
        type:    opts.type,
        postId:  opts.postId,
      },
    })
  } catch {
    // silent — nunca fallar la request padre
  }
}
