/// <reference types="vite/client" />

// Declare figma:asset module for images
declare module 'figma:asset/*' {
  const src: string;
  export default src;
}

// Declare CSS modules
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Declare image modules
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}
