import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

/**
 * 로컬 개발 시 CORS 를 완전히 우회하기 위한 Vite 프록시 설정.
 *
 * - 프론트 .env 의 VITE_API_BASE_URL 을 `/api` 로 두면,
 *   `apiClient` 는 동일 오리진(`localhost:5173`)으로 호출하고
 *   Vite dev server 가 이를 NestJS(`localhost:8080`) 로 리라이트한다.
 * - 과거처럼 `VITE_API_BASE_URL=http://localhost:8080/api` 로 두면
 *   브라우저가 바로 백엔드를 때리고 CORS(`CORS_ORIGIN`) 설정에 의존하게 된다.
 *   둘 다 동작하지만, 프록시 방식이 쿠키/프리플라이트 이슈가 없어 권장.
 *
 * VITE_DEV_PROXY_TARGET 으로 백엔드 주소를 덮어쓸 수 있음 (기본: http://localhost:8080).
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            if (id.includes('@dnd-kit')) return 'vendor-dnd'
            if (id.includes('@supabase')) return 'vendor-supabase'
            if (id.includes('axios')) return 'vendor-axios'
            return 'vendor'
          },
        },
      },
    },
  }
})
