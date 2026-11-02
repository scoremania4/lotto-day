import { Capacitor } from '@capacitor/core'
import { DH_ORIGIN, DH_HEADERS } from '../data/dhApi'

export const isNative = Capacitor.isNativePlatform()

// 동행복권을 직접 부르는 주소
// 개발 서버: 프록시 / iOS 앱: 네이티브 요청(CORS 없음) / 웹 배포: 브라우저 제한으로 불가(null)
export const dhUrl = (path) => (import.meta.env.DEV ? `/api/dh${path}` : isNative ? DH_ORIGIN + path : null)
export const dhInit = () => (isNative ? { headers: DH_HEADERS } : {})

// 배포 사이트가 함께 올리는 최신 당첨번호 파일 (Actions 가 매주 갱신)
export const PUBLISHED_DRAWS = isNative ? 'https://scoremania4.github.io/lotto-day/draws.json' : './draws.json'
