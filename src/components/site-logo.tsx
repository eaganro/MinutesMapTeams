// The MinutesMap mark, shared with the main site.
export function SiteLogo({ size }: { size: number }) {
  return (
    <picture>
      <source type="image/avif" srcSet="/logo-70.avif 1x, /logo-140.avif 2x" />
      <source type="image/webp" srcSet="/logo-70.webp 1x, /logo-140.webp 2x" />
      <img
        src="/logo-70.png"
        srcSet="/logo-70.png 1x, /logo-140.png 2x"
        width={size}
        height={size}
        alt=""
        className="object-contain"
        style={{ width: size * 0.9, height: size }}
      />
    </picture>
  );
}
