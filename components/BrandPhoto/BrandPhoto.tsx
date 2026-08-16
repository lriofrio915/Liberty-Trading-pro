import Image from 'next/image'

interface BrandPhotoProps {
  /** Ruta de la imagen. Normalmente viene de `BRAND.photos.*`. */
  src: string
  alt: string
  width: number
  height: number
  className?: string
  /** Marcar solo la foto del hero — precarga la imagen visible al entrar. */
  priority?: boolean
  sizes?: string
}

/**
 * Envoltorio de next/image para las fotos de marca.
 *
 * Mientras no existan las fotos reales, `BRAND.photos` apunta a placeholders
 * SVG. El optimizador de imágenes de Next rechaza SVG salvo que se active
 * `dangerouslyAllowSVG`, así que aquí se sirven sin optimizar. Cuando lleguen
 * los JPG/WebP reales el componente pasa a optimizarlos solo — basta con
 * cambiar las rutas en lib/brand.ts, sin tocar ningún componente.
 */
export default function BrandPhoto({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes,
}: BrandPhotoProps) {
  const isVector = src.endsWith('.svg')

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes={sizes}
      unoptimized={isVector}
    />
  )
}
