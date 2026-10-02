/**
 * Publicación en Instagram y Facebook con la Graph API de Meta.
 *
 * Variables de entorno (Vercel):
 *   META_ACCESS_TOKEN — token de un usuario del sistema del portafolio de Liberty, sin caducidad,
 *                       con pages_manage_posts, pages_read_engagement, instagram_basic,
 *                       instagram_content_publish y business_management.
 *   META_PAGE_ID      — id de la página de Facebook "Liberty Trading Club".
 *   META_IG_USER_ID   — id de la cuenta profesional @liberty_trading_club.
 *
 * Las imágenes tienen que ser URLs públicas (Cloudinary): Meta las descarga.
 */
const VERSION = 'v23.0'
const GRAPH = `https://graph.facebook.com/${VERSION}`

function env(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Falta la variable de entorno ${name}`)
  return v
}

async function graph<T = any>(path: string, params: Record<string, string>, method: 'GET' | 'POST' = 'POST', token?: string): Promise<T> {
  const body = new URLSearchParams({ ...params, access_token: token ?? env('META_ACCESS_TOKEN') })
  const url = method === 'GET' ? `${GRAPH}/${path}?${body}` : `${GRAPH}/${path}`
  const res = await fetch(url, {
    method,
    ...(method === 'POST' ? { body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } } : {}),
    signal: AbortSignal.timeout(30_000),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.error) {
    const e = json.error ?? {}
    throw new Error(`Meta ${path}: ${e.message ?? res.status}${e.error_subcode ? ` (subcode ${e.error_subcode})` : ''}`)
  }
  return json as T
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/** Espera a que Meta termine de procesar un contenedor de Instagram (las imágenes tardan unos segundos). */
async function esperarContenedor(id: string) {
  for (let i = 0; i < 20; i++) {
    const { status_code } = await graph<{ status_code: string }>(id, { fields: 'status_code' }, 'GET')
    if (status_code === 'FINISHED') return
    if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`Contenedor de Instagram ${id}: ${status_code}`)
    await sleep(3000)
  }
  throw new Error(`Contenedor de Instagram ${id}: tiempo de espera agotado`)
}

/** Publica una imagen o un carrusel (2–10) en Instagram. Devuelve el id y el enlace del post. */
export async function publicarInstagram(urls: string[], caption: string) {
  const ig = env('META_IG_USER_ID')
  let creation: string
  if (urls.length === 1) {
    creation = (await graph<{ id: string }>(`${ig}/media`, { image_url: urls[0], caption })).id
  } else {
    const hijos: string[] = []
    for (const image_url of urls) {
      hijos.push((await graph<{ id: string }>(`${ig}/media`, { image_url, is_carousel_item: 'true' })).id)
    }
    for (const h of hijos) await esperarContenedor(h)
    creation = (await graph<{ id: string }>(`${ig}/media`, { media_type: 'CAROUSEL', children: hijos.join(','), caption })).id
  }
  await esperarContenedor(creation)
  const { id } = await graph<{ id: string }>(`${ig}/media_publish`, { creation_id: creation })
  const { permalink } = await graph<{ permalink: string }>(id, { fields: 'permalink' }, 'GET')
  return { id, permalink }
}

/** Token de página: el del usuario del sistema sirve para pedirlo y no caduca. */
async function tokenDePagina(page: string) {
  const { access_token } = await graph<{ access_token: string }>(page, { fields: 'access_token' }, 'GET')
  return access_token
}

/** Publica en la página de Facebook las fotos (sin publicar por separado) y un post que las agrupa. */
export async function publicarFacebook(urls: string[], mensaje: string) {
  const page = env('META_PAGE_ID')
  const token = await tokenDePagina(page)
  const fotos: string[] = []
  for (const url of urls) {
    fotos.push((await graph<{ id: string }>(`${page}/photos`, { url, published: 'false' }, 'POST', token)).id)
  }
  const params: Record<string, string> = { message: mensaje }
  fotos.forEach((id, i) => { params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id }) })
  const { id } = await graph<{ id: string }>(`${page}/feed`, params, 'POST', token)
  return { id, permalink: `https://www.facebook.com/${id}` }
}

/** Comprobación de configuración: nombre de usuario de IG y nombre de la página. */
export async function verificarCuentas() {
  const ig = await graph<{ username: string }>(env('META_IG_USER_ID'), { fields: 'username' }, 'GET')
  const page = await graph<{ name: string }>(env('META_PAGE_ID'), { fields: 'name' }, 'GET')
  return { instagram: ig.username, facebook: page.name }
}
