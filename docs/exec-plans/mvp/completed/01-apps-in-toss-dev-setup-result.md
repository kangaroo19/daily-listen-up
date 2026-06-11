# 01. Apps in Toss 앱/개발 환경 세팅 결과

## 기준 문서

- Active 작업지시서: `docs/exec-plans/active/01-apps-in-toss-dev-setup.md`
- MVP 기준: `docs/exec-plans/index.md`
- 제품 기준: `docs/product-specs/home.md`, `docs/product-specs/quiz.md`, `docs/product-specs/result.md`, `docs/product-specs/backend.md`
- UI 기준: `docs/design-docs/style-guidelines.md`

## 작업 체크리스트

- [x] `docs/exec-plans/index.md`의 MVP 개발 기준과 01번 작업 범위를 다시 확인했다.
  - 근거: 작업 전 `docs/exec-plans/index.md`, active 문서, 제품 스펙 문서를 확인했다.
- [x] Apps in Toss WebView 미니앱 개발에 필요한 프로젝트 구조가 없으면 최소 구조를 생성하고, 이미 있으면 기존 구조를 유지했다.
  - 근거: 기존 앱 구조가 없어 `package.json`, `index.html`, `vite.config.ts`, `granite.config.ts`, `src/`를 신규 생성했다.
- [x] 비게임 미니앱 기준으로 TDS 사용에 필요한 패키지와 import 기준을 확인하고 프로젝트에 반영했다.
  - 근거: Apps in Toss WebView 문서와 TDS Mobile 시작 문서를 확인했고, `package.json`에 `@toss/tds-mobile`, `@toss/tds-mobile-ait`, `@emotion/react`를 추가했다. `src/providers/AppTDSProvider.tsx`에서 TDS Provider를 적용했다.
- [x] 앱의 첫 화면이 홈 화면 작업을 이어받을 수 있는 최소 엔트리로 실행되게 했다.
  - 근거: `src/main.tsx`, `src/App.tsx`, `src/screens/HomeScreen.tsx`에서 홈 화면을 기본 화면으로 렌더링한다.
- [x] 홈, 문제 풀이, 결과 화면을 이후 작업에서 연결할 수 있도록 라우팅 또는 화면 전환 위치를 정했다.
  - 근거: `src/routes.ts`의 `AppScreen` 타입과 `src/App.tsx`의 화면 전환 상태로 `home`, `quiz`, `result` 연결 위치를 만들었다.
- [x] 환경 변수 예시 파일 또는 문서에 공개 가능한 클라이언트 설정값과 서버 전용 비밀값을 구분해 적었다.
  - 근거: `.env.example`에 `VITE_` 공개 클라이언트 값과 서버 전용 비밀값 금지 예시를 구분했다.
- [x] Firebase, Toss, Toss Ads의 실제 연동 로직은 더미나 TODO 수준으로만 남기고 제품 흐름을 구현하지 않았다.
  - 근거: `src/integrations/firebase.ts`, `src/integrations/toss.ts`, `src/integrations/tossAds.ts`는 설정/타입/자리만 제공하며 실제 로그인, 광고, API 흐름은 구현하지 않았다.
- [x] 로컬 개발 실행 명령, 타입 검사 명령, 빌드 명령을 README 또는 작업 결과 문서에 기록할 수 있게 확인했다.
  - 근거: `package.json`에 `npm run dev`, `npm run typecheck`, `npm run build`를 정의했고 아래 검증 결과에 실행 결과를 기록했다.

## 검증 체크리스트

- [x] 로컬 개발 서버가 실행되고 앱 첫 화면이 빈 화면 없이 열린다.
  - 근거: `npm run dev -- --host 127.0.0.1` 실행 후 `http://127.0.0.1:5173/`에서 `오늘의 영어 듣고 포인트 받기`가 표시됨을 Chrome DevTools로 확인했다.
- [x] 타입 검사 또는 이에 준하는 정적 검증 명령이 통과한다.
  - 근거: `npm run typecheck` 통과.
- [x] 빌드 명령이 통과한다.
  - 근거: `npm run build` 통과. Vite 번들 크기 경고가 있었으나 빌드 exit code는 0이었다.
- [x] TDS를 기본 UI 기준으로 사용할 수 있는 의존성과 import 경로가 확인된다.
  - 근거: `@toss/tds-mobile`의 `Button`, `TDSMobileProvider`와 `@toss/tds-mobile-ait`의 `TDSMobileAITProvider` import가 타입 검사와 빌드를 통과했다.
- [x] 클라이언트 코드에 서버 비밀키, Toss access token, 원본 `userKey`를 저장하거나 노출하는 코드가 없다.
  - 근거: `rg -n "server secret|client secret|access[_ -]?token|refresh[_ -]?token|userKey|PRIVATE KEY|BEGIN PRIVATE|TOSS.*SECRET|FIREBASE.*PRIVATE|authorizationCode" -S . --glob '!node_modules/**' --glob '!dist/**' --glob '!package-lock.json'` 실행. 신규 클라이언트 코드에서는 `src/integrations/toss.ts`의 단기 `authorizationCode` 타입과 `.env.example`의 금지 예시만 확인됐다.
- [x] 02번 이후 작업에서 Firebase와 Toss 연동을 이어갈 위치가 명확하다.
  - 근거: Firebase는 `src/config/clientEnv.ts`, `src/integrations/firebase.ts`, Toss 로그인은 `src/integrations/toss.ts`, Toss Ads는 `src/integrations/tossAds.ts`에 연결 지점을 분리했다.

## 변경 요약

- Apps in Toss WebView 미니앱 기준의 Vite React TypeScript 앱 골격을 추가했다.
- TDS WebView 의존성과 Provider 진입점을 추가하고, 일반 브라우저 로컬 개발에서는 safe area 브리지 오류 없이 확인할 수 있게 했다.
- 홈, 문제 풀이, 결과 화면의 최소 화면 전환 구조를 만들었다.
- Firebase 클라이언트 설정, Toss 로그인, Toss Ads의 연결 위치만 만들고 실제 제품 흐름은 구현하지 않았다.

## 검증 결과

- `npm install`: 최초 디스크 공간 부족으로 중단됐고, 부분 설치 폴더를 정리한 뒤 npm 캐시를 비워 재실행해 완료했다.
- `npm run typecheck`: 통과.
- `npm run build`: 통과. Vite 번들 크기 경고가 있었고, 01번 범위에서는 빌드 설정 변경 없이 기록만 남긴다.
- `npm run dev -- --host 127.0.0.1`: 실행 확인. Chrome DevTools에서 홈 화면 표시, 문제/결과 화면 전환, 콘솔 error/warn 없음 확인.

## 후속 참고 사항

- 02번 작업은 `src/config/clientEnv.ts`와 `src/integrations/firebase.ts`의 공개 Firebase 설정 위치를 이어받으면 된다.
- 03번 작업은 `src/integrations/toss.ts`에서 `appLogin()` 호출과 서버 세션 교환을 구현하면 된다.
- 06번 이후 광고 작업은 `src/integrations/tossAds.ts`에서 전면형/보상형 광고 목적별 구현을 분기하면 된다.
