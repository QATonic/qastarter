interface QAStarterLogoProps {
  className?: string;
}

/**
 * <picture> lets modern browsers pick the 21 KB WebP and old browsers fall
 * back to the 153 KB PNG. ~86% smaller on the happy path, zero regression on
 * the fallback path — and no JS feature detection needed.
 */
export default function QAStarterLogo({ className = 'h-10 w-auto' }: QAStarterLogoProps) {
  return (
    <picture>
      <source srcSet="/logo.webp" type="image/webp" />
      <img src="/logo.png" alt="QAStarter Logo" className={className} />
    </picture>
  );
}
