# 4. Toss 로그인 서버 연동 구현 결과

## 작업 요약

- `POST /api/login/toss` 라우트를 추가했다.
- Toss 인가 코드 token exchange와 사용자 정보 조회 client를 추가했다.
- Toss `userKey`를 내부 사용자 ID로 변환해 `users`에 저장하고 `lastLoginAt`을 갱신하는 구조를 추가했다.
- 앱 세션 토큰을 생성하고 KST 기준 당일 만료 시각으로 `appSessions`에 저장하는 구조를 추가했다.
- 로그인 성공 응답에는 앱 세션 정보만 내려주고 Toss token과 원본 `userKey`는 노출하지 않게 했다.
- Toss 로그인 서버 연동 테스트, 세션 만료 계산 테스트, 사용자/세션 저장 테스트를 추가했다.

## 변경 파일

- `.env.example`
- `server/src/app.ts`
- `server/src/auth/session.ts`
- `server/src/auth/session.test.ts`
- `server/src/auth/tossClient.ts`
- `server/src/auth/tossClient.test.ts`
- `server/src/auth/userSessionRepository.ts`
- `server/src/auth/userSessionRepository.test.ts`
- `server/src/routes/tossLogin.ts`
- `server/src/routes/tossLogin.test.ts`
- `docs/exec-plans/completed/04-toss-login-server-result.md`

## 완료 기준 확인

- [x] `POST /api/login/toss` 라우트가 서버 app에 등록되어 있다.
  - 확인 파일: `server/src/app.ts`, `server/src/routes/tossLogin.ts`
  - 확인 명령: `npm run test:server`

- [x] `authorizationCode`, `referrer` 요청 검증 테스트가 존재하고 통과한다.
  - 확인 파일: `server/src/routes/tossLogin.test.ts`
  - 확인 명령: `npm run test:server`

- [x] Toss token exchange 성공 응답을 파싱하는 테스트가 존재하고 통과한다.
  - 확인 파일: `server/src/auth/tossClient.test.ts`
  - 확인 명령: `npm run test:server`

- [x] Toss token exchange의 `invalid_grant` 실패 처리 테스트가 존재하고 통과한다.
  - 확인 파일: `server/src/auth/tossClient.test.ts`, `server/src/routes/tossLogin.test.ts`
  - 확인 명령: `npm run test:server`

- [x] Toss 사용자 정보 조회 성공 응답에서 `userKey`를 확보하는 테스트가 존재하고 통과한다.
  - 확인 파일: `server/src/auth/tossClient.test.ts`
  - 확인 명령: `npm run test:server`

- [x] Toss 사용자 정보 조회의 `USER_KEY_NOT_FOUND`, `USER_NOT_FOUND` 실패 처리 테스트가 존재하고 통과한다.
  - 확인 파일: `server/src/auth/tossClient.test.ts`, `server/src/routes/tossLogin.test.ts`
  - 확인 명령: `npm run test:server`

- [x] 신규 `userKey` 로그인 시 `users`와 `appSessions` 저장 흐름이 테스트된다.
  - 확인 파일: `server/src/auth/userSessionRepository.test.ts`
  - 확인 명령: `npm run test:server`

- [x] 기존 `userKey` 재로그인 시 기존 사용자 재사용과 `lastLoginAt` 갱신 흐름이 테스트된다.
  - 확인 파일: `server/src/auth/userSessionRepository.test.ts`
  - 확인 명령: `npm run test:server`

- [x] 세션 만료 시간이 KST 기준 당일 만료로 계산되는 테스트가 존재하고 통과한다.
  - 확인 파일: `server/src/auth/session.test.ts`
  - 확인 명령: `npm run test:server`

- [x] 로그인 성공 응답에 `sessionToken`, `expiresAt`이 포함된다.
  - 확인 파일: `server/src/routes/tossLogin.test.ts`
  - 확인 명령: `npm run test:server`

- [x] 로그인 성공 응답에 Toss access token, refresh token, 원본 `userKey`가 포함되지 않는다.
  - 확인 파일: `server/src/routes/tossLogin.test.ts`
  - 확인 명령: `npm run test:server`

- [x] `.env.example`에 Toss 로그인 서버 연동에 필요한 환경변수 이름이 있고 실제 secret 값은 없다.
  - 확인 파일: `.env.example`
  - 포함 변수: `TOSS_CLIENT_ID`, `TOSS_CLIENT_SECRET`, `TOSS_API_BASE_URL`

- [x] 기존 `/api/health` 테스트가 계속 통과한다.
  - 확인 파일: `server/src/routes/health.test.ts`
  - 확인 명령: `npm run test:server`

- [x] `npm run test:server`가 통과한다.
  - 확인 명령: `npm run test:server`
  - 확인 결과: 8개 테스트 파일, 24개 테스트 통과

- [x] `npm run typecheck:server`가 통과한다.
  - 확인 명령: `npm run typecheck:server`

- [x] `npm run lint`가 통과한다.
  - 확인 명령: `npm run lint`

- [x] 5번 앱 세션 및 사용자 진행 상태 API 구현이 발급된 세션 토큰과 `appSessions` 문서를 사용할 수 있다.
  - 확인: `sessionToken` 생성, session token hash 기반 `appSessions` 저장, `expiresAt` 반환 구조 추가

## 실행한 검증 명령

- `npm run test:server`
- `npm run typecheck:server`
- `npm run lint`

## 참고 사항

- 실제 Toss API 호출은 테스트에서 mock 처리했다.
- 실제 Firebase 운영 프로젝트 연결이나 service account key 커밋은 작업 범위가 아니라 수행하지 않았다.
- 원본 Toss `userKey`는 Firestore 문서 ID에 직접 쓰지 않고 SHA-256 기반 내부 사용자 ID로 변환해 사용한다.
- 앱 세션 문서 ID에는 원본 세션 토큰 대신 SHA-256 hash를 사용한다.
