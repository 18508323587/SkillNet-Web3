import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 告诉 Vite：只要我请求以 /ai-api 开头的地址，你就帮我无视跨域，直接转给兰樾！
      '/ai-api': {
        target: 'https://lbss8t1b-8000.usw2.devtunnels.ms',
        changeOrigin: true, 
        rewrite: (path) => path.replace(/^\/ai-api/, ''),
      },
    },
  },
})