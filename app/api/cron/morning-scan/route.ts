export { GET } from '../market-scan/route'

// Next.js exige que los campos de configuración de ruta se declaren
// estáticamente en cada archivo — no pueden re-exportarse.
// Valores copiados de ../market-scan/route.ts
export const runtime = 'nodejs'
export const maxDuration = 90
