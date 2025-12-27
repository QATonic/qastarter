interface QAStarterLogoProps {
  className?: string;
}

export default function QAStarterLogo({ className = "h-10 w-auto" }: QAStarterLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Blue to Purple gradient matching website theme */}
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
        
        {/* Shadow for depth */}
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Shield shape with gradient */}
      <g filter="url(#shadow)">
        <path
          d="M 50 5 L 85 20 L 85 50 C 85 70, 70 85, 50 95 C 30 85, 15 70, 15 50 L 15 20 Z"
          fill="url(#logoGradient)"
        />
      </g>
      
      {/* Subtle highlight on top for 3D effect */}
      <path
        d="M 50 8 L 82 22 L 82 48 C 82 62, 72 74, 60 80"
        stroke="white"
        strokeWidth="2"
        fill="none"
        opacity="0.15"
      />
      
      {/* Play button in center - larger and more prominent */}
      <g transform="translate(50, 50)">
        {/* Outer circle background */}
        <circle cx="0" cy="0" r="22" fill="white" opacity="0.25"/>
        
        {/* Play triangle */}
        <path
          d="M -7 -14 L -7 14 L 14 0 Z"
          fill="white"
          opacity="0.95"
        />
        
        {/* Circle border around play button */}
        <circle cx="0" cy="0" r="20" stroke="white" strokeWidth="2.5" fill="none" opacity="0.9"/>
      </g>
    </svg>
  );
}
