# 5. 앱 세션 및 사용자 진행 상태 API 구현

## 목적

4번 Toss 로그인 서버 연동에서 발급한 앱 세션 토큰을 검증하고, 현재 로그인 사용자와 오늘 날짜의 기존 진행 상태를 조회할 수 있게 한다.

## 구현 범위

- 앱 세션 토큰 검증 공통 로직 또는 미들웨어 기준을 만든다.
- `GET /api/me` 라우트를 추가한다.
- 요청 헤더에서 앱 세션 토큰을 읽는다.
  - `Authorization: Bearer ${sessionToken}` 형식을 사용한다.
- `appSessions`에서 세션 토큰에 해당하는 세션을 조회한다.
- 세션 만료 여부를 서버 시간 기준으로 검증한다.
- 유효한 세션이면 내부 사용자 정보를 조회한다.
- 서버 KST 기준 오늘 날짜를 계산한다.
- 오늘 날짜의 기존 `userProgress` 문서가 있으면 공개 가능한 진행 상태를 반환한다.
- 오늘 날짜의 기존 `userProgress` 문서가 없으면 `progress: null`을 반환한다.
- `GET /api/me`와 세션 검증 흐름에 대한 서버 테스트를 작성한다.

## 제외 범위

- Toss 로그인 token exchange 구현
- Toss 사용자 정보 조회 구현
- 앱 세션 토큰 발급과 `appSessions` 생성
- `userProgress` 신규 생성
- 오늘 문제 존재 여부 판단
- 오늘 문제 조회 API 구현
- 홈 진입 분기 UI 구현
- 정답 제출과 정답 판정 구현
- 재도전권 또는 스크립트 열람권 상태 변경
- 포인트 지급 상태 변경
- 보상형 광고 완료 기록 API 구현

## 구현 기준

- 4번에서 발급한 `sessionToken`을 후속 서버 API의 인증 기준으로 사용한다.
- 세션 토큰은 `Authorization` 헤더의 Bearer token으로 받는다.
- 인증 실패 응답에는 세션 토큰 원문이나 내부 조회 정보를 포함하지 않는다.
- `appSessions` 문서가 없으면 인증 실패로 처리한다.
- `appSessions.expiresAt`이 현재 서버 시간보다 과거이면 인증 실패로 처리한다.
- 세션이 유효하면 `appSessions.userId`로 내부 사용자 정보를 조회한다.
- 원본 Toss `userKey`, Toss access token, refresh token은 응답에 포함하지 않는다.
- `GET /api/me` 성공 응답은 현재 사용자, 세션 만료 시각, 서버 KST 기준 오늘 날짜, 기존 진행 상태를 포함한다.
- `userProgress`는 사용자와 서버 KST 기준 오늘 날짜로 조회한다.
- 기존 `userProgress`가 없으면 문서를 만들지 않고 `progress: null`을 반환한다.
- 이 프로젝트 흐름에서는 7번에서 `userProgress`를 초기화하는 편이 더 깔끔하다.
- 5번은 앱 세션 검증, 현재 세션/사용자 조회, 기존 진행 상태가 있으면 반환까지만 담당한다.
- `userProgress` 생성은 오늘 문제가 실제로 조회되는 7번으로 넘긴다.
- 6~8번 홈 흐름은 `GET /api/me`의 `progress: null`과 7번 오늘 문제 조회 결과를 조합해 진입 분기를 결정한다.
- 서버 코드는 이후 Firebase Functions로 옮길 수 있도록 Express 라우트와 세션 검증 로직을 과하게 결합하지 않는다.
- 기존 `/api/health` 라우트와 4번 로그인 라우트 흐름을 깨지 않는다.

## API 응답 기준

`GET /api/me` 성공 응답은 다음 형태를 기준으로 한다.

```json
{
  "user": {
    "id": "internal-user-id"
  },
  "session": {
    "expiresAt": "2026-05-16T14:59:59.999Z"
  },
  "today": {
    "quizDate": "2026-05-16",
    "progress": null
  }
}
```

기존 진행 상태가 있으면 `today.progress`에 다음처럼 공개 가능한 필드만 포함한다.

```json
{
  "attemptCount": 1,
  "lastSubmittedChoiceIds": ["choice-a"],
  "isCorrect": false,
  "canRetry": false,
  "canViewScript": false,
  "rewardStatus": "none",
  "needsRewardReview": false
}
```

## 상태 및 예외 처리

- `Authorization` 헤더가 없으면 401로 응답한다.
- Bearer token 형식이 아니면 401로 응답한다.
- 세션 토큰에 해당하는 `appSessions` 문서가 없으면 401로 응답한다.
- 세션이 만료되었으면 401로 응답한다.
- 세션은 유효하지만 사용자 문서가 없으면 서버 데이터 불일치로 보고 500으로 응답한다.
- 오늘 날짜의 `userProgress`가 없으면 에러가 아니라 `progress: null`로 응답한다.
- 다른 날짜의 `userProgress`를 오늘 상태로 반환하지 않는다.
- Firestore 조회가 실패하면 서버 내부 에러로 처리한다.
- 인증 실패와 서버 실패 응답은 민감한 내부 정보를 노출하지 않는다.

## 완료 기준

- 앱 세션 토큰 검증 공통 로직 또는 미들웨어 기준이 서버 코드에 존재한다.
- `GET /api/me` 라우트가 서버 app에 등록되어 있다.
- 토큰 누락 시 401로 응답하는 테스트가 존재하고 통과한다.
- Bearer token 형식이 아니면 401로 응답하는 테스트가 존재하고 통과한다.
- 존재하지 않는 세션 토큰이면 401로 응답하는 테스트가 존재하고 통과한다.
- 만료된 세션이면 401로 응답하는 테스트가 존재하고 통과한다.
- 유효한 세션이면 사용자 ID와 세션 만료 시각을 반환하는 테스트가 존재하고 통과한다.
- 오늘 `userProgress`가 없으면 문서를 생성하지 않고 `progress: null`을 반환하는 테스트가 존재하고 통과한다.
- 오늘 `userProgress`가 있으면 공개 가능한 진행 상태를 반환하는 테스트가 존재하고 통과한다.
- 다른 날짜의 `userProgress`는 오늘 상태로 반환하지 않는 테스트가 존재하고 통과한다.
- 응답에 Toss access token, refresh token, 원본 `userKey`가 포함되지 않는 테스트가 존재하고 통과한다.
- 기존 `/api/health` 테스트가 계속 통과한다.
- 4번 로그인 라우트 테스트가 있다면 계속 통과한다.
- `npm run test:server`가 통과한다.
- `npm run typecheck:server`가 통과한다.
- `npm run lint`가 통과한다.
- 7번 오늘 문제 조회 API가 이 작업의 세션 검증 기준을 재사용할 수 있다.

## Git 전략

- 최신 `dev` 기준에서 `codex/05-session-progress-api` 브랜치를 만든다.
- 세션 검증 로직, `GET /api/me` 라우트, 진행 상태 조회, 테스트, 검증 기록을 의미 있는 단위로 커밋한다.
- 작업 완료 후 `docs/exec-plans/completed/05-session-progress-api-result.md`를 작성한다.
- 작업 브랜치에서 `dev`로 PR을 보낸다.
- PR 설명에는 이 active 문서와 completed 문서를 함께 링크한다.

## 다음 작업과의 연결

- 6번 Toss 로그인 클라이언트 및 홈 CTA 구현은 4번 로그인 성공 후 받은 `sessionToken`으로 이 작업의 `GET /api/me`를 호출할 수 있다.
- 7번 오늘 문제 조회 API와 콘텐츠 로딩 구현은 이 작업의 세션 검증 기준을 재사용한다.
- 7번은 오늘 문제가 실제로 존재할 때 `userProgress`를 초기화한다.
- 8번 홈 진입 분기와 문제 없음 상태 구현은 `GET /api/me`의 `progress: null`과 7번 오늘 문제 조회 결과를 조합해 첫 방문, 진행 중, 완료, 문제 없음 상태를 나눈다.
