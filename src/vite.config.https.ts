import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Загрузка SSL сертификатов
const loadSSLCertificates = () => {
  const certDir = path.resolve(__dirname, 'certs');
  
  try {
    const key = fs.readFileSync(path.join(certDir, 'server.key'));
    const cert = fs.readFileSync(path.join(certDir, 'server.crt'));
    
    console.log('✅ SSL сертификаты загружены');
    return { key, cert };
  } catch (error) {
    console.error('❌ Ошибка загрузки SSL сертификатов:', error.message);
    console.error('💡 Сгенерируйте сертификаты:');
    console.error('   Linux/Mac: ./scripts/generate-ssl-cert.sh');
    console.error('   Windows:   scripts\\generate-ssl-cert.bat');
    return null;
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 5173,
    strictPort: true,
    
    // HTTPS конфигурация
    https: loadSSLCertificates() || undefined,
    
    // Прокси для API (опционально)
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://localhost:3443',
        changeOrigin: true,
        secure: false, // Для самоподписанных сертификатов
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    
    // Автоматически открывать браузер
    open: false,
    
    // CORS
    cors: true
  },
  
  // Переменные окружения
  define: {
    'process.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'https://localhost:3443/v1'
    )
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Оптимизация для production
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react']
        }
      }
    }
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
