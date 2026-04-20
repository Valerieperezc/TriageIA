import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  build: {
    modulePreload: {
      resolveDependencies(_filename, deps, context) {
        if (context.hostType !== 'html') {
          return deps
        }

        return deps.filter(
          (dep) =>
            !dep.includes('vendor-charts') &&
            !dep.includes('vendor-react') &&
            !dep.includes('auth-context') &&
            !dep.includes('theme-context') &&
            !dep.includes('appConfig')
        )
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('react-dom') || id.includes('/react/')) {
            return 'vendor-react'
          }
          if (id.includes('react-router-dom') || id.includes('@remix-run/router')) {
            return 'vendor-router'
          }
          if (id.includes('@supabase/supabase-js')) {
            return 'vendor-supabase'
          }
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'vendor-charts'
          }
          if (id.includes('lucide-react') || id.includes('react-hot-toast')) {
            return 'vendor-ui'
          }
        }
      }
    }
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
