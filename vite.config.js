import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { DH_ORIGIN, DH_HEADERS } from './src/data/dhApi.js'

// 브라우저에서 동행복권을 직접 부르면 CORS로 막혀서 /api/dh 로 대신 요청
// ponytail: dev/preview 서버에서만 동작. 정적 배포 시엔 같은 경로의 서버 함수가 필요
const proxy = {
  '/api/dh': {
    target: DH_ORIGIN,
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/api\/dh/, ''),
    headers: { ...DH_HEADERS, 'User-Agent': 'Mozilla/5.0' },
  },
}

export default defineConfig({
  base: './', // 저장소 주소(/저장소이름/) 아래에서도 동작
  plugins: [
    react(),
    // 배포 사이트에 draws.json 을 함께 올려서, 설치된 앱·열려 있는 웹이 새 회차를 직접 받게 함
    { name: 'publish-draws', generateBundle() { this.emitFile({ type: 'asset', fileName: 'draws.json', source: readFileSync(new URL('./src/data/draws.json', import.meta.url)) }) } },
  ],
  server: { port: 3000, open: true, proxy },
  preview: { proxy },
})
