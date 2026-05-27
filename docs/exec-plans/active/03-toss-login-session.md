# 03. Toss 로그인과 앱 세션 구현

## 목적

홈의 `시작하기` 흐름에서 Toss `appLogin()`으로 받은 인가 코드를 서버에 전달하고, 서버가 Toss 사용자 식별값을 내부 사용자와 당일 앱 세션으로 변환하게 한다.
클라이언트는 Toss 토큰이나 원본 `userKey`를 직접 다루지 않고, 이후 서버 API 호출에 사용할 앱 세션 토큰만 사용한다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/index.md`
- `docs/product-specs/home.md`
- `docs/product-specs/backend.md`
- `docs/design-docs/style-guidelines.md`
- 작업 시작 시 직전 completed 문서가 존재하면 먼저 확인한다: `docs/exec-plans/completed/02-firebase-backend-data-setup-result.md`
- 필요한 배경 확인용: `INTRODUCE.md`

## 범위

- 클라이언트에서 홈의 `시작하기` 액션이 Toss `appLogin()`을 호출하는 흐름을 구현한다.
- 서버의 `POST /api/login/toss`가 `authorizationCode`, `referrer`를 받아 Toss 토큰 교환과 사용자 조회를 처리하게 한다.
- 서버는 Toss `userKey`를 내부 `userId`로 연결하고 당일 만료되는 앱 세션을 발급한다.
- 앱 세션은 이후 `GET /api/check-today-quiz`, `GET /api/today-quiz`, `GET /api/reward-status` 호출에 사용할 수 있는 형태로 클라이언트에 저장한다.
- 로그인 실패, 취소, 서버 세션 발급 실패 시 사용자가 홈에 머무르고 다시 시도할 수 있게 한다.

## 제외 범위

- 오늘 문제 존재 여부 확인과 홈 진입 분기 UI 완성은 04번 작업에서 다룬다.
- 문제 풀이 화면, 오디오 재생, 선택지 UI는 05번 작업에서 다룬다.
- 답안 제출, 광고, 정답 검증, 포인트 지급은 구현하지 않는다.
- Toss access token, refresh token, 원본 `userKey`를 클라이언트에 내려주거나 저장하지 않는다.
- 로그인 외 API의 세부 요청/응답 형식을 이 작업에서 임의 확정하지 않는다.

## 작업 체크리스트

- [ ] 작업 시작 시 `docs/exec-plans/completed/02-firebase-backend-data-setup-result.md`가 존재하면 먼저 읽고 Functions, Emulator, 데이터 모델 기준을 반영한다.
- [ ] 홈의 `시작하기` 버튼에서 Toss `appLogin()`을 호출하는 클라이언트 경계를 구현한다.
- [ ] `appLogin()` 성공 결과의 `authorizationCode`, `referrer`만 `POST /api/login/toss`로 전달한다.
- [ ] `POST /api/login/toss`에서 Toss 토큰 발급 API를 호출하는 서버 전용 로직을 구현한다.
- [ ] Toss access token으로 사용자 조회 API를 호출하고 `userKey`를 확보한다.
- [ ] `userKey`는 서버 전용으로 보관하고 내부 `userId`와 연결한다.
- [ ] `appSessions`에 당일 만료 앱 세션을 생성하고 클라이언트에는 앱 세션 토큰만 반환한다.
- [ ] 클라이언트는 앱 세션 토큰을 이후 서버 API 호출에 사용할 수 있는 위치에 저장한다.
- [ ] 로그인 취소, Toss API 실패, 서버 세션 발급 실패 시 홈에 머무르고 `로그인을 완료하지 못했어요. 다시 시작해 주세요.` 토스트를 보여준다.
- [ ] 요청 처리 중 `시작하기` 버튼 중복 클릭을 막는다.

## 검증 체크리스트

- [ ] Toss 로그인 성공 시 클라이언트가 `POST /api/login/toss`를 호출하고 앱 세션 토큰을 받는다.
- [ ] 서버 로그 또는 테스트에서 Toss 토큰 교환과 사용자 조회가 서버에서만 수행됨을 확인한다.
- [ ] 클라이언트 번들, 로컬 저장소, 네트워크 응답에 Toss access token, refresh token, 원본 `userKey`가 노출되지 않는다.
- [ ] `users`에는 내부 `userId`와 서버 전용 `userKey` 연결 기준이 저장된다.
- [ ] `appSessions`에는 세션 식별값, 내부 `userId`, 당일 만료 시각이 저장된다.
- [ ] 로그인 취소 또는 실패 시 사용자는 홈에 머무르고 다시 `시작하기`를 누를 수 있다.
- [ ] 타입 검사, Functions 검증, 프론트 빌드 또는 이에 준하는 검증 명령이 통과한다.

## 완료 후 completed 문서 작성 기준

- `docs/exec-plans/completed/03-toss-login-session-result.md`를 작성한다.
- 이 active 문서의 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 각 체크 항목에는 근거가 되는 파일, 명령, 테스트 또는 수동 검증 결과를 짧게 기록한다.
- 완료하지 못한 항목은 체크하지 않고 미완료 사유와 04번 작업에서 막히는 부분이 있는지 적는다.
- 04번 홈 진입 분기 구현자가 사용할 앱 세션 저장 위치, API 호출 방식, 실패 처리 기준을 후속 참고 사항에 남긴다.
