import { useState } from 'react';

interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({ className = "h-16", alt = "ТюмГУ" }: LogoProps) {
  const [useFallback, setUseFallback] = useState(false);
  
  const handleError = () => {
    setUseFallback(true);
  };
  
  return (
    <img 
      src={useFallback ? "/logo.svg" : "/logo.png"} 
      alt={alt} 
      className={className}
      onError={handleError}
    />
  );
}