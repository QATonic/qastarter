interface QAStarterLogoProps {
  className?: string;
}

export default function QAStarterLogo({ className = 'h-10 w-auto' }: QAStarterLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="QAStarter Logo"
      className={className}
    />
  );
}
