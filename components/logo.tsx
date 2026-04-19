import Image from "next/image"
import Link from "next/link"

type LogoProps = {
  /** Height in pixels. Width is auto-proportional. */
  height?: number
  /** Wrap in a Link to the given href. Pass null to render without a link. */
  href?: string | null
  className?: string
  priority?: boolean
}

/**
 * AnesthesiApp brand logo.
 * Uses the combined mark + wordmark. Width scales to match the source aspect ratio.
 */
export function Logo({
  height = 32,
  href = "/",
  className,
  priority = false,
}: LogoProps) {
  // Source image is 870x182 → aspect ratio ~4.78
  const aspectRatio = 870 / 182
  const width = Math.round(height * aspectRatio)

  const img = (
    <Image
      src="/anesthesiapp-logo.png"
      alt="AnesthesiApp"
      width={width}
      height={height}
      priority={priority}
      className={className}
      style={{ width: "auto", height }}
    />
  )

  if (href === null) return img
  return (
    <Link href={href} className="inline-flex items-center" aria-label="AnesthesiApp home">
      {img}
    </Link>
  )
}
