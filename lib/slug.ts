/** Genera un slug URL-amigable a partir de un nombre.
 *  "Luis Riofrío" → "luis-riofrio"
 */
export function generateSlug(name: string): string {
  return name
    .normalize('NFD')                    // descompone caracteres con tilde
    .replace(/[\u0300-\u036f]/g, '')     // elimina los diacríticos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')       // elimina caracteres especiales
    .replace(/\s+/g, '-')               // espacios → guiones
    .replace(/-+/g, '-')                // múltiples guiones → uno
}
