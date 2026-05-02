# 1. Apps in Toss 기본 앱 구조 세팅 결과

## 수행 내용

- React + TypeScript + Vite 기반 단일 앱 구조를 추가했다.
- Apps in Toss WebView 설정을 위한 `granite.config.ts`를 추가했다.
- 모바일 WebView 기준 viewport, safe area, 기본 앱 셸과 전역 스타일을 추가했다.
- `bootstrapping`, `ready`, `initFailed` 앱 부팅 상태를 구성했다.
- Firebase 초기화, Toss SDK 런타임 확인, Toss Ads 접근 경계, 서버 API 클라이언트 위치를 분리했다.
- `import.meta.env` 기반 필수 환경변수 검증 위치와 `.env.example`을 추가했다.
- 공통 로딩 화면과 초기화 실패 화면을 추가했다.
- `dev`, `build`, `preview`, `lint`, `typecheck`, `format`, `format:check` 스크립트를 추가했다.

## 주요 파일

- `package.json`
- `granite.config.ts`
- `index.html`
- `src/app/`
- `src/pages/HomePage.tsx`
- `src/lib/firebase/`
- `src/lib/toss/`
- `src/lib/toss-ads/`
- `src/services/api/`
- `src/shared/config/`
- `src/shared/ui/`
- `src/styles/global.css`

## 검증

- `npm run build` 통과
- `npm run lint` 통과
- `npm run typecheck` 통과
- `npm run format:check` 통과

## 참고

- 실제 Toss 로그인 호출, 문제 조회, 광고 호출, 보상 요청 로직은 추가하지 않았다.
- TDS 사용을 전제로 관련 패키지를 설치했으며, 실제 화면 컴포넌트 적용은 후속 UI 작업 범위에서 진행한다.
- 로컬 브라우저에서 Toss 런타임이 없으면 앱이 죽지 않고 `로컬 브라우저` 상태로 표시되도록 했다.
