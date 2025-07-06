import { defineConfig } from 'vite'

export default defineConfig({
  // Base path for deployment
  base: '/',
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
  },
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['firebase/app', 'firebase/firestore', 'firebase/analytics']
  }
}) 