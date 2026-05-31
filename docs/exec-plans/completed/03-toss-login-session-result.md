# 03. Toss 로그인과 앱 세션 구현 결과

## 기준 문서

- Active 작업지시서: `docs/exec-plans/active/03-toss-login-session.md`
- 직전 완료 문서: `docs/exec-plans/completed/02-firebase-backend-data-setup-result.md`
- MVP 기준: `docs/exec-plans/index.md`
- 제품 기준: `docs/product-specs/home.md`, `docs/product-specs/backend.md`
- UI 기준: `docs/design-docs/style-guidelines.md`
- 공식 확인 문서: Apps in Toss `appLogin`, Toss 로그인 개발하기

## 작업 체크리스트

- [x] 작업 시작 시 `docs/exec-plans/completed/02-firebase-backend-data-setup-result.md`가 존재하면 먼저 읽고 Functions, Emulator, 데이터 모델 기준을 반영했다.
  - 근거: 02번 completed 문서의 `functions/src/services/sessionBoundary.ts`, `POST /api/login/toss` 경계, `users`/`appSessions` 모델 기준을 확인했다.
- [x] 홈의 `시작하기` 버튼에서 Toss `appLogin()`을 호출하는 클라이언트 경계를 구현했다.
  - 근거: `src/integrations/toss.ts`에서 `@apps-in-toss/web-framework`의 `appLogin()`을 호출한다. `src/screens/HomeScreen.tsx`의 `시작하기` 버튼이 `startLogin()`을 실행한다.
- [x] `appLogin()` 성공 결과의 `authorizationCode`, `referrer`만 `POST /api/login/toss`로 전달한다.
  - 근거: `src/services/startLogin.ts`, `src/services/apiClient.ts`에서 `authorizationCode`, `referrer`만 요청 body에 담는다.
- [x] `POST /api/login/toss`에서 Toss 토큰 발급 API를 호출하는 서버 전용 로직을 구현했다.
  - 근거: `functions/src/services/tossLoginClient.ts`의 `generateToken()`이 `/api-partner/v1/apps-in-toss/user/oauth2/generate-token`을 서버에서 호출한다.
- [x] Toss access token으로 사용자 조회 API를 호출하고 `userKey`를 확보한다.
  - 근거: `functions/src/services/tossLoginClient.ts`의 `getLoginMe()`가 `Authorization: Bearer ${AccessToken}`으로 `/api-partner/v1/apps-in-toss/user/oauth2/login-me`를 호출하고 `userKey`를 문자열로 정규화한다.
- [x] `userKey`는 서버 전용으로 보관하고 내부 `userId`와 연결한다.
  - 근거: `functions/src/services/loginSession.ts`, `functions/src/repositories/userRepository.ts`에서 `users/{userId}`에 `userKey`, `loggedInAt`을 저장한다. 클라이언트 응답에는 포함하지 않는다.
- [x] `appSessions`에 당일 만료 앱 세션을 생성하고 클라이언트에는 앱 세션 토큰만 반환한다.
  - 근거: `functions/src/services/loginSession.ts`가 앱 세션 토큰을 생성하고 해시한 `sessionTokenId`를 `appSessions` 문서 ID와 필드로 저장한다. 응답은 `appSessionToken`, `expiresAt`만 반환한다.
- [x] 클라이언트는 앱 세션 토큰을 이후 서버 API 호출에 사용할 수 있는 위치에 저장한다.
  - 근거: `src/services/appSession.ts`에서 `window.sessionStorage`에 `daily-listen-up.appSessionToken`으로 저장한다.
- [x] 로그인 취소, Toss API 실패, 서버 세션 발급 실패 시 홈에 머무르고 `로그인을 완료하지 못했어요. 다시 시작해 주세요.` 토스트를 보여준다.
  - 근거: `src/screens/HomeScreen.tsx`에서 실패 시 TDS `openToast()`와 `role="alert"` 토스트 메시지를 표시한다. Chrome DevTools로 일반 브라우저 실패 문구 노출을 확인했다.
- [x] 요청 처리 중 `시작하기` 버튼 중복 클릭을 막는다.
  - 근거: `src/screens/HomeScreen.tsx`의 `isStarting` 상태로 버튼 `loading`, `disabled`를 적용하고 중복 호출을 return 처리한다.

## 검증 체크리스트

- [x] Toss 로그인 성공 시 클라이언트가 `POST /api/login/toss`를 호출하고 앱 세션 토큰을 받는다.
  - 근거: 클라이언트 흐름은 `src/services/startLogin.ts`, `src/services/apiClient.ts`에 구현됐다. 서버 성공 흐름은 `firebase emulators:exec --project daily-listen-up-dev --only firestore,functions "npm --prefix functions run verify:login-session"`로 검증했다.
- [x] 서버 로그 또는 테스트에서 Toss 토큰 교환과 사용자 조회가 서버에서만 수행됨을 확인한다.
  - 근거: `functions/src/__tests__/loginSession.test.ts`가 `generate-token` 후 `login-me` 호출 순서를 검증한다. Emulator 검증 스크립트도 mock Toss 서버 호출 순서를 확인한다.
- [x] 클라이언트 번들, 로컬 저장소, 네트워크 응답에 Toss access token, refresh token, 원본 `userKey`가 노출되지 않는다.
  - 근거: `src/services/apiClient.ts`는 서버 응답에서 `appSessionToken`, `expiresAt`만 받는다. `functions/src/scripts/verifyLoginSession.ts`는 응답에 `accessToken`, `refreshToken`, `userKey`가 없음을 검증한다. 비밀값 검색 결과 실제 운영 토큰/키는 없었다.
- [x] `users`에는 내부 `userId`와 서버 전용 `userKey` 연결 기준이 저장된다.
  - 근거: Emulator 검증 결과 `Verified users/{userId}`를 확인했고, `functions/src/repositories/userRepository.ts`가 `users/{userId}`에 저장한다.
- [x] `appSessions`에는 세션 식별값, 내부 `userId`, 당일 만료 시각이 저장된다.
  - 근거: `functions/src/services/loginSession.ts`와 `functions/src/scripts/verifyLoginSession.ts`가 해시된 세션 식별값과 내부 `userId` 연결을 검증한다. 단위 테스트는 KST 당일 만료가 `2026-05-28T15:00:00.000Z`로 계산됨을 확인한다.
- [x] 로그인 취소 또는 실패 시 사용자는 홈에 머무르고 다시 `시작하기`를 누를 수 있다.
  - 근거: Chrome DevTools에서 `http://localhost:5173/` 홈의 `시작하기` 클릭 후 `로그인을 완료하지 못했어요. 다시 시작해 주세요.` alert가 보이고 버튼이 다시 활성화되는 것을 확인했다.
- [x] 타입 검사, Functions 검증, 프론트 빌드 또는 이에 준하는 검증 명령이 통과한다.
  - 근거: `npm run typecheck`, `npm run build`, `npm run functions:test` 통과. `npm run build`는 기존 Vite 번들 크기 경고만 있었다.

## 변경 요약

- 클라이언트 홈 `시작하기` 버튼을 Toss `appLogin()`과 서버 로그인 API 호출에 연결했다.
- 앱 세션 토큰을 `sessionStorage`에 저장하는 클라이언트 세션 위치를 추가했다.
- Firebase Functions `POST /api/login/toss`에서 Toss 토큰 교환, `login-me` 사용자 조회, 내부 사용자 연결, 당일 앱 세션 발급을 구현했다.
- 앱 세션 원문 토큰은 클라이언트에만 반환하고, 서버에는 해시된 `sessionTokenId`로 저장한다.
- 로그인 실패 시 홈에 머무르며 재시도 가능한 토스트/alert 문구를 표시한다.

## 검증 결과

- `npm run functions:test`: 통과. Toss 토큰 교환/사용자 조회가 서버 서비스에서 수행되고 앱 세션 토큰만 반환되는지 확인했다.
- `firebase emulators:exec --project daily-listen-up-dev --only firestore,functions "npm --prefix functions run verify:login-session"`: 통과. mock Toss API로 성공 로그인을 검증하고 `users`, `appSessions` 저장을 확인했다.
- `npm run typecheck`: 통과.
- `npm run build`: 통과. 기존 Vite 번들 크기 경고는 유지됐다.
- Chrome DevTools 수동 확인: 일반 브라우저에서 Toss 환경이 아니므로 로그인 실패 문구가 노출되고 버튼이 재활성화됨을 확인했다.
- 비밀값 검색: 실제 Firebase 서비스 계정 키, Toss 비밀키, 운영 토큰은 저장소에 추가되지 않았다.

## 추가 작업

- Toss API 실연동에 필요한 로컬 emulator용 mTLS 인증서/개인키 경로 설정을 추가했다.
  - 근거: `.env.example`에 서버 전용 `TOSS_MTLS_CERT_PATH`, `TOSS_MTLS_KEY_PATH`를 추가했다. 실제 인증서/개인키 파일과 로컬 `functions/.env.local`은 `.gitignore` 대상이라 저장소에 커밋하지 않는다. 현재 Windows 로컬 파일 경로는 배포 환경에서 사용할 수 없다.
- Toss 토큰 교환과 `login-me` 호출이 mTLS 인증서를 사용할 수 있도록 서버 전용 HTTP 클라이언트를 추가했다.
  - 근거: `functions/src/services/tossLoginClient.ts`는 mTLS 환경변수가 있으면 Node `https.request`에 `cert`, `key`, `rejectUnauthorized`를 설정해 `apps-in-toss-api.toss.im`을 호출한다. 환경변수가 없으면 기존 `fetch` 기반 mock 검증 흐름을 유지한다.
- Android 샌드박스 수동 테스트에서 실제 Toss 로그인 세션 저장을 확인했다.
  - 근거: `시작하기` 클릭 후 Firebase Emulator의 `users`, `appSessions` 컬렉션에 문서가 생성됨을 확인했다. 이전 TLS handshake 실패는 mTLS 설정 후 발생하지 않았다.

## 후속 참고 사항

- 04번은 `src/services/appSession.ts`의 `getAppSessionToken()`으로 앱 세션 토큰을 읽어 `GET /api/check-today-quiz`, `GET /api/reward-status` 요청의 `Authorization: Bearer ${token}` 헤더에 사용하면 된다.
- 서버 쪽 이후 API는 `functions/src/services/sessionBoundary.ts`의 `getBearerToken()`과 `requireAppSession()`으로 앱 세션을 확인하면 된다.
- `POST /api/login/toss` 성공 응답 형식은 `{ appSessionToken, expiresAt }`이다.
- Toss API 실연동은 mTLS가 필요하다. 로컬 emulator는 `TOSS_MTLS_CERT_PATH`, `TOSS_MTLS_KEY_PATH` 파일 경로를 사용한다. 실제 Firebase Functions 배포 전에는 인증서/개인키를 Firebase Secret Manager로 주입하는 방식으로 전환해야 하며, 인증서 파일 자체는 저장소나 배포 산출물에 포함하지 않는다.
