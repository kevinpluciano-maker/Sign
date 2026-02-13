import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "unzipped-preview.preview.emergentagent.com",
      ".emergentagent.com",
      ".preview.emergentagent.com",
      ".emergentcf.cloud",
      "codebrowser-1.cluster-12.preview.emergentcf.cloud"
    ],
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // Gzip compression for production
    mode === 'production' && viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files larger than 1kb
      deleteOriginFile: false,
    }),
    // Brotli compression for production (better compression than gzip)
    mode === 'production' && viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    }),
    // Bundle analyzer for production builds
    mode === 'production' && visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        // SIMPLIFIED: Let Vite handle chunking automatically for better stability
        // Manual chunking was causing React context issues on Netlify
        manualChunks: undefined,
        // Optimized asset file names for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/${ext}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      }
    },
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
    // Optimize asset inlining
    assetsInlineLimit: 4096, // 4kb threshold
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-dom/client',
      'react/jsx-runtime',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast'
    ],
    exclude: ['@lovable/tagger']
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none',
  }
}));