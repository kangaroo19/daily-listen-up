# 1. Apps in Toss 기본 앱 구조 세팅 결과

## 작업 요약

Apps in Toss WebView 미니앱 기본 구조를 repo 루트에 생성했다.
`create-ait-app` scaffold 결과를 기반으로 npm, TDS, Granite 설정을 포함한 실행 가능한 프론트 앱 기반을 마련했다.

## 주요 변경 사항

- repo 루트에 WebView 앱 실행 파일을 추가했다.
  - `package.json`
  - `package-lock.json`
  - `index.html`
  - `vite.config.ts`
  - `granite.config.ts`
  - `src/`
  - `public/`
- `granite.config.ts`에 앱 식별값을 반영했다.
  - `appName`: `daily-english-listening`
  - `brand.displayName`: `오늘의 리스닝`
- TDS 사용에 필요한 패키지를 추가했다.
  - `@toss/tds-mobile`
  - `@toss/tds-mobile-ait`
- 01 범위 밖인 배포 안내와 `deploy` 스크립트는 제거했다.
- 검증 산출물과 의존성 폴더가 커밋되지 않도록 `.gitignore`를 추가했다.

## 완료 기준 체크리스트

- [x] `npm install`이 성공하고 npm lockfile이 생성된다.
  - 확인 결과: 성공
  - 관련 파일: `package-lock.json`
  - 실행 명령: `npm install`
  - 참고: npm audit 결과 26개 취약점이 보고되었으며, scaffold 의존성 경고로 completed 문서에 기록한다.
- [x] `npm run dev`로 로컬 개발 서버를 실행할 수 있다.
  - 확인 결과: 성공
  - 실행 명령: `npm run dev`
  - 확인 방법: `http://localhost:5173` 요청이 HTTP 200을 반환했다.
  - 참고: Granite dev 서버는 내부적으로 `http://0.0.0.0:8081`도 함께 출력했다.
- [x] `npm run build`가 성공하고 production build 결과물이 생성된다.
  - 확인 결과: 성공
  - 실행 명령: `npm run build`
  - 생성 결과: `dist/`, `daily-english-listening.ait`
  - 참고: 생성 결과물은 `.gitignore`로 커밋 대상에서 제외했다.
- [x] `granite.config.ts`에 `daily-english-listening`과 `오늘의 리스닝`이 반영되어 있다.
  - 확인 결과: 성공
  - 관련 파일: `granite.config.ts`
- [x] TDS 사용 전제가 의존성 또는 설정에 반영되어 있다.
  - 확인 결과: 성공
  - 관련 파일: `package.json`, `src/main.tsx`, `src/App.tsx`
  - 참고: scaffold가 TDS import를 생성했지만 TDS 패키지를 누락해 초기 build가 실패했고, `@toss/tds-mobile`, `@toss/tds-mobile-ait`를 추가해 해결했다.
- [x] 기존 문서와 약관 파일이 삭제되거나 덮어써지지 않았다.
  - 확인 결과: 성공
  - 유지 파일: `docs/`, `INTRODUCE.md`, `AGENTS.md`, `TERMS_OF_SERVICE.md`
- [x] 2번 서버 코드 기반 세팅 전에 프론트 앱이 독립적으로 실행 가능한 상태다.
  - 확인 결과: 성공
  - 실행 명령: `npm run lint`, `npm run build`

## 검증 기록

- `npm install`
  - 결과: 성공
  - 특이사항: peer dependency override 경고와 deprecated package 경고가 있었다.
- `npm run build`
  - 1차 결과: 실패
  - 원인: `@toss/tds-mobile-ait` 패키지가 package 의존성에 없어 Vite가 import를 resolve하지 못했다.
  - 조치: `npm install @toss/tds-mobile @toss/tds-mobile-ait`
  - 2차 결과: 성공
- `npm run dev`
  - 결과: 성공
  - 확인: `http://localhost:5173` HTTP 200
- `npm run lint`
  - 결과: 성공

## 미충족 또는 후속 확인 필요 사항

- npm audit에서 26개 취약점이 보고되었다.
  - 이번 작업은 scaffold 기반 세팅이 목적이므로 `npm audit fix`는 실행하지 않았다.
  - 후속 의존성 정리 또는 보안 점검 작업에서 별도 판단한다.
- `npm run build`에서 chunk size warning과 Node `DEP0190` deprecation warning이 출력되었다.
  - 빌드는 성공했으며, 01 완료 기준의 차단 이슈는 아니다.
  - 앱 기능이 늘어나는 단계에서 필요하면 bundle 최적화를 검토한다.

## 다음 작업으로 넘길 내용

- 2번 서버 코드 기반 세팅은 현재 루트 WebView 앱 구조를 유지하면서 `server/` 폴더를 추가한다.
- 2번에서 npm script를 추가할 때 기존 `dev`, `build`, `lint`, `format` 스크립트를 덮어쓰지 않는다.
- 6번 홈 CTA 구현은 현재 scaffold 기본 화면을 실제 홈 화면으로 교체한다.

