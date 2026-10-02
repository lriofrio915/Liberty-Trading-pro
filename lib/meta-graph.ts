/**
 * Publicación en Instagram y Facebook con la Graph API de Meta.
 *
 * Cada cuenta publica con su propio token de página (sin caducidad, derivado del token de usuario
 * de Luis vía la app Nexus_Solution) y sus ids. Variables de entorno (Vercel):
 *   liberty → META_ACCESS_TOKEN, META_PAGE_ID, META_IG_USER_ID (página Liberty Trading Club + @liberty_trading_club)
 *   luis    → META_LUIS_ACCESS_TOKEN, META_LUIS_PAGE_ID, META_LUIS_IG_USER_ID
 *             (página Luis Riofrío Trader Cuantitativo + @luisriofrioec)
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

export type Cuenta = 'liberty' | 'luis'

/** Nombres visibles de cada cuenta (para la página de confirmación y los avisos). */
export const CUENTAS: Record<Cuenta, { etiqueta: string; prefijo: string }> = {
  liberty: { etiqueta: '@liberty_trading_club y la página Liberty Trading Club', prefijo: 'META_' },
  luis: { etiqueta: '@luisriofrioec y la página Luis Riofrío Trader Cuantitativo', prefijo: 'META_LUIS_' },
}

export const esCuenta = (c: unknown): c is Cuenta => c === 'liberty' || c === 'luis'

function config(cuenta: Cuenta) {
  const p = CUENTAS[cuenta].prefijo
  return { token: env(`${p}ACCESS_TOKEN`), pageId: env(`${p}PAGE_ID`), igUserId: env(`${p}IG_USER_ID`) }
}

async function graph<T = any>(path: string, params: Record<string, string>, method: 'GET' | 'POST', token: string): Promise<T> {
  const body = new URLSearchParams({ ...params, access_token: token })
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
async function esperarContenedor(id: string, token: string) {
  for (let i = 0; i < 20; i++) {
    const { status_code } = await graph<{ status_code: string }>(id, { fields: 'status_code' }, 'GET', token)
    if (status_code === 'FINISHED') return
    if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`Contenedor de Instagram ${id}: ${status_code}`)
    await sleep(3000)
  }
  throw new Error(`Contenedor de Instagram ${id}: tiempo de espera agotado`)
}

/** Publica una imagen o un carrusel (2–10) en Instagram. Devuelve el id y el enlace del post. */
export async function publicarInstagram(cuenta: Cuenta, urls: string[], caption: string) {
  const { token, igUserId: ig } = config(cuenta)
  let creation: string
  if (urls.length === 1) {
    creation = (await graph<{ id: string }>(`${ig}/media`, { image_url: urls[0], caption }, 'POST', token)).id
  } else {
    const hijos: string[] = []
    for (const image_url of urls) {
      hijos.push((await graph<{ id: string }>(`${ig}/media`, { image_url, is_carousel_item: 'true' }, 'POST', token)).id)
    }
    for (const h of hijos) await esperarContenedor(h, token)
    creation = (await graph<{ id: string }>(`${ig}/media`, { media_type: 'CAROUSEL', children: hijos.join(','), caption }, 'POST', token)).id
  }
  await esperarContenedor(creation, token)
  const { id } = await graph<{ id: string }>(`${ig}/media_publish`, { creation_id: creation }, 'POST', token)
  const { permalink } = await graph<{ permalink: string }>(id, { fields: 'permalink' }, 'GET', token)
  return { id, permalink }
}

/** Publica en la página de Facebook las fotos (sin publicar por separado) y un post que las agrupa.
 *  El token configurado ya es de página, así que se usa directamente. */
export async function publicarFacebook(cuenta: Cuenta, urls: string[], mensaje: string) {
  const { token, pageId: page } = config(cuenta)
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
export async function verificarCuenta(cuenta: Cuenta) {
  const { token, igUserId, pageId } = config(cuenta)
  const ig = await graph<{ username: string }>(igUserId, { fields: 'username' }, 'GET', token)
  const page = await graph<{ name: string }>(pageId, { fields: 'name' }, 'GET', token)
  return { instagram: ig.username, facebook: page.name }
}
