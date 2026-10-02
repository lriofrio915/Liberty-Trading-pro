// /api/social/aprobar y /api/social/descartar — enlaces firmados que Luis recibe por WhatsApp.
//
// GET  → página de confirmación (con la portada y el copy). No cambia nada: WhatsApp visita
//        los enlaces para generar la vista previa, así que un GET nunca puede publicar.
// POST → ejecuta la acción. Aprobar publica primero en Instagram y luego en Facebook; si
//        Instagram falla no se toca Facebook, y el post queda en "error" con el motivo.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CADUCIDAD_MS, firmaValida, type AccionSocial } from '@/lib/social-approval'
import { publicarFacebook, publicarInstagram } from '@/lib/meta-graph'
import { notifyNexus } from '@/lib/notify-nexus'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

type Ctx = { params: Promise<{ accion: string }> }

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

function pagina(titulo: string, cuerpo: string, status = 200) {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(titulo)}</title>
<style>body{margin:0;background:#080808;color:#f0ece4;font-family:system-ui,sans-serif;display:flex;justify-content:center}
main{max-width:520px;padding:28px 20px}h1{font-family:Georgia,serif;font-style:italic;font-weight:400;color:#C9A84C;font-size:30px}
img{width:100%;border-radius:12px;border:1px solid #1e1e1e}pre{white-space:pre-wrap;font:15px/1.5 system-ui;color:#8a8480}
button{width:100%;padding:16px;border:0;border-radius:10px;font:600 16px system-ui;cursor:pointer;margin-top:8px}
.si{background:linear-gradient(135deg,#9A7A30,#C9A84C,#E8C96A);color:#080808}.no{background:#1a1a1a;color:#f0ece4}
a{color:#C9A84C}</style></head><body><main>${cuerpo}</main></body></html>`
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

async function cargar(req: NextRequest, ctx: Ctx) {
  const { accion } = await ctx.params
  if (accion !== 'aprobar' && accion !== 'descartar') return { error: pagina('No encontrado', '<h1>No encontrado</h1>', 404) }
  const url = new URL(req.url)
  const id = url.searchParams.get('id') ?? ''
  if (!firmaValida(id, accion, url.searchParams.get('sig'))) return { error: pagina('Enlace inválido', '<h1>Enlace inválido</h1>', 401) }
  const post = await prisma.socialPost.findUnique({ where: { id } })
  if (!post) return { error: pagina('No encontrado', '<h1>Este post ya no existe</h1>', 404) }
  return { accion: accion as AccionSocial, post, url }
}

function yaDecidido(post: { estado: string; igPermalink: string | null; error: string | null }) {
  const extra = post.igPermalink ? `<p><a href="${esc(post.igPermalink)}">Ver en Instagram</a></p>` : post.error ? `<pre>${esc(post.error)}</pre>` : ''
  return pagina('Ya decidido', `<h1>Este post ya está: ${esc(post.estado)}</h1>${extra}`)
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const r = await cargar(req, ctx)
  if ('error' in r) return r.error
  const { accion, post, url } = r
  if (post.estado !== 'pendiente') return yaDecidido(post)
  if (Date.now() - post.createdAt.getTime() > CADUCIDAD_MS) return pagina('Caducado', '<h1>Este borrador caducó (24 h)</h1>')
  const boton = accion === 'aprobar'
    ? '<button class="si" type="submit">Publicar ahora en Instagram y Facebook</button>'
    : '<button class="no" type="submit">Descartar este post</button>'
  return pagina(post.tema, `<h1>${esc(post.tema)}</h1><img src="${esc(post.slides[0])}" alt="">
<p>${post.slides.length} slides · ${esc(post.pilar)}</p><pre>${esc(post.caption)}\n\n${esc(post.hashtags.join(' '))}</pre>
<form method="post" action="${esc(url.pathname + url.search)}">${boton}</form>`)
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const r = await cargar(req, ctx)
  if ('error' in r) return r.error
  const { accion, post } = r
  if (Date.now() - post.createdAt.getTime() > CADUCIDAD_MS && post.estado === 'pendiente') {
    await prisma.socialPost.update({ where: { id: post.id }, data: { estado: 'caducado' } })
    return pagina('Caducado', '<h1>Este borrador caducó (24 h)</h1>')
  }
  // Paso atómico pendiente → siguiente estado: dos clics seguidos no publican dos veces.
  const destino = accion === 'aprobar' ? 'publicando' : 'descartado'
  const { count } = await prisma.socialPost.updateMany({ where: { id: post.id, estado: 'pendiente' }, data: { estado: destino, decididoAt: new Date() } })
  if (count === 0) return yaDecidido(await prisma.socialPost.findUniqueOrThrow({ where: { id: post.id } }))
  if (accion === 'descartar') return pagina('Descartado', '<h1>Descartado</h1><p>No se publicará.</p>')

  const caption = `${post.caption}\n\n${post.hashtags.join(' ')}`
  try {
    const ig = await publicarInstagram(post.slides, caption)
    await prisma.socialPost.update({ where: { id: post.id }, data: { igMediaId: ig.id, igPermalink: ig.permalink } })
    const fb = await publicarFacebook(post.slides, caption)
    await prisma.socialPost.update({ where: { id: post.id }, data: { estado: 'publicado', fbPostId: fb.id } })
    await notifyNexus('social_publicado', { resumen: `✅ Publicado: ${post.tema}\nInstagram: ${ig.permalink}\nFacebook: ${fb.permalink}` })
    return pagina('Publicado', `<h1>Publicado ✅</h1><p><a href="${esc(ig.permalink)}">Ver en Instagram</a> · <a href="${esc(fb.permalink)}">Ver en Facebook</a></p>`)
  } catch (e: any) {
    const msg = String(e?.message ?? e).slice(0, 500)
    await prisma.socialPost.update({ where: { id: post.id }, data: { estado: 'error', error: msg } })
    await notifyNexus('social_error', { resumen: `⚠️ No se pudo publicar "${post.tema}": ${msg}` })
    return pagina('Error', `<h1>No se pudo publicar</h1><pre>${esc(msg)}</pre>`, 502)
  }
}
