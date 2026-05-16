# 4. Toss 로그인 서버 연동 구현

## 목적

클라이언트가 `appLogin()`으로 받은 Toss 인가 코드를 서버에서 처리해 사용자를 식별하고, 후속 서버 API 호출에 사용할 `daily-listen-up` 앱 세션 토큰을 발급한다.

## 구현 범위

- `POST /api/login/toss` 라우트를 추가한다.
- 요청 body로 `authorizationCode`, `referrer`를 받는다.
- Toss 토큰 교환 API를 호출해 access token을 발급받는다.
- 발급받은 access token으로 Toss 사용자 정보 조회 API를 호출해 `userKey`를 확보한다.
- `userKey`를 기준으로 내부 사용자를 생성하거나 기존 사용자를 재사용한다.
- 로그인 시 `users` 문서의 `createdAt`, `lastLoginAt` 기준을 저장하거나 갱신한다.
- `appSessions` 문서를 생성하고 KST 기준 당일 만료되는 앱 세션 토큰을 발급한다.
- 로그인 성공 응답에는 후속 API 호출에 필요한 앱 세션 정보만 내려준다.
  - `sessionToken`
  - `expiresAt`
  - 클라이언트에 공개 가능한 최소 사용자 식별값
- `.env.example`에 Toss 로그인 서버 연동에 필요한 환경변수 기준을 확인하거나 보강한다.
  - `TOSS_CLIENT_ID`
  - `TOSS_CLIENT_SECRET`
  - 필요하면 `TOSS_API_BASE_URL`
- `POST /api/login/toss`와 Toss API client, 사용자/세션 저장 흐름에 대한 서버 테스트를 작성한다.

## 제외 범위

- 클라이언트 `appLogin()` 호출 구현
- 홈 CTA 구현
- 세션 토큰 검증 미들웨어 구현
- 현재 세션 조회 API 구현
- 사용자 진행 상태 조회 또는 초기화 API 구현
- `userProgress` 생성 및 완료 여부 분기 구현
- 오늘 문제 조회 API 구현
- 정답 검증 API 구현
- 포인트 지급 API 구현
- 보상형 광고 완료 기록 API 구현
- Toss 로그인 연결 끊기 API 또는 콜백 구현
- 개인정보 복호화 구현
- 실제 Toss 운영 secret 값 커밋

## 구현 기준

- 공식 Toss 로그인 기준에 따라 인가 코드 이후의 토큰 교환과 사용자 정보 조회는 서버에서만 처리한다.
- Toss API Base URL 기본값은 `https://apps-in-toss-api.toss.im`을 사용한다.
- Toss token exchange 호출은 다음 기준을 따른다.
  - Method: `POST`
  - Path: `/api-partner/v1/apps-in-toss/user/oauth2/generate-token`
  - Body: `authorizationCode`, `referrer`
- Toss 사용자 정보 조회 호출은 다음 기준을 따른다.
  - Method: `GET`
  - Path: `/api-partner/v1/apps-in-toss/user/oauth2/login-me`
  - Header: `Authorization: Bearer ${accessToken}`
- `authorizationCode`는 일회성이고 유효시간이 짧으므로 서버에 저장하지 않는다.
- Toss access token, refresh token은 클라이언트 응답에 포함하지 않는다.
- 원본 Toss `userKey`는 서버 전용 필드로만 저장하고 클라이언트 응답에 포함하지 않는다.
- Firestore 문서 ID에는 원본 `userKey`를 직접 쓰지 않는다.
- 내부 사용자 ID는 후속 API에서 사용할 수 있는 안정적인 식별값이어야 한다.
- 같은 `userKey`로 다시 로그인하면 기존 사용자를 재사용하고 `lastLoginAt`을 갱신한다.
- 앱 세션 토큰은 예측하기 어려운 랜덤 값으로 생성한다.
- 앱 세션 만료 시각은 서버 KST 기준 당일 만료로 둔다.
- 앱 세션 토큰 만료는 Toss 로그인 연결 자체를 끊는 정책이 아니다.
- `scope` 값은 Toss 정책 변화로 알 수 없는 항목이 추가될 수 있으므로, 미리 정의하지 않은 scope 값이 있어도 실패하지 않게 처리한다.
- 서버 코드는 이후 Firebase Functions로 옮길 수 있도록 Express 라우트와 비즈니스 로직을 과하게 결합하지 않는다.
- 기존 `/api/health` 라우트와 서버 실행 흐름을 깨지 않는다.

## 상태 및 예외 처리

- `authorizationCode`가 없거나 문자열이 아니면 400으로 응답한다.
- `referrer`가 없거나 허용하지 않는 값이면 400으로 응답한다.
- Toss token exchange가 `invalid_grant`를 반환하면 로그인 재시도가 필요한 실패로 처리한다.
- Toss 사용자 정보 조회에서 `USER_KEY_NOT_FOUND`, `USER_NOT_FOUND`가 반환되면 사용자 식별 실패로 처리한다.
- Toss API가 일시적으로 실패하거나 응답 형식이 예상과 다르면 서버 내부 에러로 처리하되, Toss access token이나 민감한 응답 원문을 클라이언트에 노출하지 않는다.
- Firebase Admin 초기화 또는 Firestore 저장이 실패하면 로그인 성공으로 응답하지 않는다.
- `appSessions` 저장이 실패하면 세션 토큰을 응답하지 않는다.
- 동일 사용자가 짧은 시간 안에 다시 로그인해도 사용자 문서가 중복 생성되지 않게 한다.
- 테스트에서는 실제 Toss API와 운영 Firestore에 의존하지 않도록 외부 호출과 저장소를 대체할 수 있는 구조로 작성한다.

## 완료 기준

- `POST /api/login/toss` 라우트가 서버 app에 등록되어 있다.
- `authorizationCode`, `referrer` 요청 검증 테스트가 존재하고 통과한다.
- Toss token exchange 성공 응답을 파싱하는 테스트가 존재하고 통과한다.
- Toss token exchange의 `invalid_grant` 실패 처리 테스트가 존재하고 통과한다.
- Toss 사용자 정보 조회 성공 응답에서 `userKey`를 확보하는 테스트가 존재하고 통과한다.
- Toss 사용자 정보 조회의 `USER_KEY_NOT_FOUND`, `USER_NOT_FOUND` 실패 처리 테스트가 존재하고 통과한다.
- 신규 `userKey` 로그인 시 `users`와 `appSessions` 저장 흐름이 테스트된다.
- 기존 `userKey` 재로그인 시 기존 사용자 재사용과 `lastLoginAt` 갱신 흐름이 테스트된다.
- 세션 만료 시간이 KST 기준 당일 만료로 계산되는 테스트가 존재하고 통과한다.
- 로그인 성공 응답에 `sessionToken`, `expiresAt`이 포함된다.
- 로그인 성공 응답에 Toss access token, refresh token, 원본 `userKey`가 포함되지 않는다.
- `.env.example`에 Toss 로그인 서버 연동에 필요한 환경변수 이름이 있고 실제 secret 값은 없다.
- 기존 `/api/health` 테스트가 계속 통과한다.
- `npm run test:server`가 통과한다.
- `npm run typecheck:server`가 통과한다.
- `npm run lint`가 통과한다.
- 5번 앱 세션 및 사용자 진행 상태 API 구현이 발급된 세션 토큰과 `appSessions` 문서를 사용할 수 있다.

## Git 전략

- 최신 `dev` 기준에서 `codex/04-toss-login-server` 브랜치를 만든다.
- Toss API client, 로그인 라우트, 사용자/세션 저장, 테스트, 검증 기록을 의미 있는 단위로 커밋한다.
- 작업 완료 후 `docs/exec-plans/completed/04-toss-login-server-result.md`를 작성한다.
- 작업 브랜치에서 `dev`로 PR을 보낸다.
- PR 설명에는 이 active 문서와 completed 문서를 함께 링크한다.

## 다음 작업과의 연결

- 5번 앱 세션 및 사용자 진행 상태 API 구현은 이 작업에서 발급한 `sessionToken`과 저장한 `appSessions` 문서를 검증 기준으로 사용한다.
- 5번은 현재 세션 조회, 세션 검증 미들웨어, 기존 사용자 진행 상태 조회를 구현한다.
- `userProgress` 신규 생성과 완료 여부 분기는 오늘 문제가 실제로 조회되는 7번 오늘 문제 조회 API에서 처리한다.
- 6번 Toss 로그인 클라이언트 및 홈 CTA 구현은 클라이언트 `appLogin()` 결과를 이 작업의 `POST /api/login/toss`로 전달한다.
- 7번 오늘 문제 조회 API는 5번의 세션 검증 기준을 통해 로그인 사용자의 오늘 문제 접근을 처리한다.
