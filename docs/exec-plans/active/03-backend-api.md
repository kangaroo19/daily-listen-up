# 3. 서버 API 구현

## 목적

토스 로그인, 사용자 식별, 세션 확인, 답안 제출, 정답 검증, 포인트 지급 요청처럼 클라이언트가 신뢰할 수 없는 처리를 프로젝트 내부 백엔드 API에서 담당하게 한다.

이번 작업의 목표는 프론트엔드가 백엔드 내부 구현에 결합하지 않고 명확한 API 계약만 의존하도록 만드는 것이다. Firebase Functions는 현재 구현 대상이 아니며, 개발 후반에 이전할 수 있도록 HTTP 핸들러와 비즈니스 로직 경계를 분리한다.

## 구현 범위

- 프로젝트 내부 백엔드에 MVP 서버 API 라우트와 비즈니스 로직 경계를 만든다.
- Toss authorization code를 서버에서 access token과 refresh token으로 교환한다.
- Toss 사용자 정보를 서버에서 조회하고 `userKey`를 확보한다.
- 서버 세션 생성과 세션 확인 API를 구현한다.
- 오늘 날짜 KST 기준으로 사용자 진행 상태를 조회할 수 있는 API를 구현한다.
- 답안 제출 API를 구현하되, 제출 시점에는 정답 여부를 클라이언트에 노출하지 않는다.
- 광고 완료 후 결과 확인으로 이어질 수 있는 제출 식별자와 상태를 저장한다.
- 서버 저장 문제 데이터를 기준으로 정답 검증 API를 구현한다.
- 정답 사용자에 대해 토스 포인트 지급 요청으로 이어질 서버 API 경계를 만든다.
- 사용자별 `userKey + quizDate` 기준 진행 상태 저장과 갱신 기준을 구현한다.
- 중복 제출, 중복 보상 요청을 방지할 수 있는 최소 멱등 처리 기준을 구현한다.
- 프론트 API 어댑터가 사용할 요청, 응답, 오류 shape를 확정한다.
- 로컬에서 프론트와 백엔드를 함께 실행해 API 호출을 검증한다.
- Firebase Functions 이전을 고려해 router, HTTP handler, service, repository 책임을 분리한다.

## 제외 범위

- Firebase Functions 배포 또는 Functions 전용 구조 구현
- 토스 로그인 UI 구현
- Toss SDK 클라이언트 호출 구현
- Toss Ads 전면형 광고 또는 보상형 광고 SDK 호출
- 광고 완료 이벤트의 실제 Toss Ads SDK 검증 구현
- 토스 포인트 실제 운영 지급 완료 보장 고도화
- 관리자 화면 또는 콘텐츠 관리 API
- 매일 문제를 자동 생성하는 배치 서버
- 오디오 플레이어 UI 구현
- 객관식 퀴즈 UI 구현
- 결과 페이지 전체 구현
- Firebase 보안 규칙 전체 설계
- completed 문서 작성

## 구현 기준

- 백엔드 코드는 이 프로젝트 내부에 둔다.
- Firebase Functions는 이번 작업의 런타임으로 사용하지 않는다.
- Firebase Functions 이전을 고려해 HTTP handler는 요청 파싱과 응답 변환만 담당한다.
- Toss 연동, 세션 처리, 정답 검증, 진행 상태 변경, 포인트 지급 판단은 service 계층에 둔다.
- Firestore 접근은 repository 계층 또는 같은 책임의 모듈로 분리한다.
- 프론트는 백엔드 내부 파일을 직접 import하지 않는다.
- 프론트 화면 컴포넌트는 `fetch`를 직접 호출하지 않고 API 어댑터만 사용한다.
- API 어댑터는 endpoint, method, request body, response body, error shape를 감싼다.
- Toss access token, refresh token, promotion secret, client secret은 클라이언트에 저장하거나 노출하지 않는다.
- 서버 세션은 httpOnly cookie 또는 같은 수준의 서버 주도 세션 방식으로 관리한다.
- 클라이언트 응답에는 `userKey`와 화면 분기에 필요한 최소 상태만 포함한다.
- 서버 로그에는 authorization code, access token, refresh token, promotion secret 원문을 남기지 않는다.
- 날짜 기준은 매일 00:00 KST로 통일한다.
- 사용자 진행 상태는 `userKey + quizDate` 기준으로 조회하고 저장한다.
- 보상 지급 상태는 같은 날짜에 중복 요청되어도 같은 결과를 반환할 수 있게 멱등하게 설계한다.
- 실제 secret 값은 저장소에 커밋하지 않는다.
- 로컬 실행에 필요한 환경변수 이름과 예시만 문서화한다.
- Apps in Toss 공식 문서 기준으로 `appLogin()` 이후 토큰 교환과 사용자 정보 조회는 서버에서 처리한다.
- 비게임 프로모션의 서버 지급 방식은 프로모션 key 발급, 지급 실행, 지급 결과 조회 단계가 있음을 전제로 후속 포인트 지급 작업과 연결한다.

## API 계약

- `GET /api/health`
  - 성공 응답은 `{ ok: true }`를 기준으로 한다.
  - 외부 API 호출이나 Firestore 쓰기를 수행하지 않는다.

- `POST /api/auth/toss-login`
  - 요청 본문은 `{ authorizationCode: string; referrer: 'DEFAULT' | 'SANDBOX' }`를 기준으로 한다.
  - 서버는 Toss `generate-token` API로 access token과 refresh token을 발급받는다.
  - 서버는 Toss `login-me` API로 사용자 정보를 조회해 `userKey`를 확보한다.
  - 서버는 세션을 생성하거나 갱신한다.
  - 성공 응답은 `{ userKey: string }`을 기준으로 한다.
  - Toss token 원문은 클라이언트에 반환하지 않는다.

- `GET /api/auth/session`
  - 성공 응답은 `{ authenticated: true; userKey: string }`을 기준으로 한다.
  - 미로그인 응답은 `401`과 공통 오류 shape로 처리한다.

- `GET /api/me/today`
  - 현재 세션의 `userKey`와 KST `quizDate` 기준으로 오늘 진행 상태를 반환한다.
  - 응답은 `quizDate`, `status`, `attemptCount`, `hasEarnedRetry`, `isPromotionGranted`, `promotionStatus`를 기준으로 한다.
  - 오늘 문제 없음은 빈 화면이 아니라 별도 상태로 표현할 수 있어야 한다.

- `POST /api/quiz/submit`
  - 요청 본문은 `{ quizDate: string; quizId: string; choiceIndex: number }`를 기준으로 한다.
  - 서버는 세션, 오늘 문제 여부, 선택지 유효성, 중복 제출 가능 여부를 확인한다.
  - 서버는 제출 기록과 진행 상태를 저장한다.
  - 성공 응답은 `{ submissionId: string; requiresInterstitialAd: true }`를 기준으로 한다.
  - 제출 시점에는 `isCorrect`, 정답 선택지, 해설, 스크립트를 반환하지 않는다.

- `POST /api/quiz-submissions/{submissionId}/result`
  - 서버는 제출자 본인 세션인지 확인한다.
  - 서버는 전면형 광고 완료 상태가 확인된 제출에 대해서만 결과를 반환한다.
  - 성공 응답은 `{ isCorrect: boolean; status: 'correct' | 'incorrect'; attemptCount: number }`를 기준으로 한다.
  - 광고 완료 상태가 없으면 `403` 또는 결과 확인 불가 상태로 처리한다.

- `POST /api/rewards/toss-point`
  - 요청 본문은 `{ quizDate: string; quizId: string }`를 기준으로 한다.
  - 서버는 해당 날짜 정답 상태, 중복 지급 여부, 보상 요청 가능 여부를 확인한다.
  - 성공 응답은 `{ promotionStatus: 'requested' | 'granted' | 'already_granted' | 'failed'; isPromotionGranted: boolean }`를 기준으로 한다.
  - 실제 Toss promotion 지급 실행과 결과 조회 고도화는 12번 포인트 지급 작업에서 확장한다.

## 공통 오류 shape

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

- `401 unauthenticated`: 세션 없음 또는 만료
- `403 forbidden`: 현재 사용자에게 허용되지 않는 요청
- `404 not_found`: 오늘 문제 또는 대상 리소스 없음
- `409 conflict`: 이미 완료된 학습, 중복 제출, 중복 보상 요청
- `422 validation_error`: 요청 body 형식 오류
- `502 external_service_error`: Toss 또는 외부 API 실패
- `500 internal_error`: 서버 내부 오류

## 상태 및 예외 처리

- 프론트 API 어댑터는 성공, 인증 필요, 검증 실패, 충돌, 외부 서비스 실패, 서버 오류를 구분한다.
- 세션 확인 실패가 `401`이면 로그인 필요 상태로 전환한다.
- 네트워크 실패와 서버 오류는 재시도 가능한 오류 상태로 다룬다.
- Toss authorization code 만료 또는 중복 사용은 로그인 실패로 처리한다.
- Toss 토큰 교환 실패와 사용자 정보 조회 실패는 로그인 완료로 처리하지 않는다.
- Toss token 원문이나 민감한 실패 상세는 클라이언트 응답에 노출하지 않는다.
- 오늘 문제 없음 상태에서는 답안 제출을 막고 명확한 오류 코드 또는 상태를 반환한다.
- 이미 오늘 학습을 완료한 사용자의 새 제출이나 포인트 지급 요청은 중복 처리하지 않는다.
- 선택지 값이 유효하지 않으면 `422 validation_error`로 처리하고 정답 정보는 반환하지 않는다.
- 제출 중복 요청은 서버에서 멱등하게 처리하거나 `409 conflict`로 명확히 반환한다.
- 결과 확인 전 광고 완료 상태가 없으면 정답 결과를 노출하지 않는다.
- 보상 중복 요청은 이미 요청됨 또는 이미 지급됨 상태를 정상 계열로 반환한다.
- Firestore 접근 실패는 서버 오류로 처리하되 클라이언트에 내부 경로, stack trace, secret을 노출하지 않는다.
- 로컬 백엔드가 실행되지 않은 경우 프론트는 빈 화면이 아니라 API 연결 실패 상태를 표시할 수 있어야 한다.

## 완료 기준

- 로컬에서 프로젝트 내부 백엔드를 실행할 수 있다.
- 프론트 로컬 서버에서 `/api/*` 요청이 백엔드로 전달된다.
- `GET /api/health`가 정상 응답한다.
- `POST /api/auth/toss-login`에서 Toss authorization code 교환과 사용자 정보 조회 흐름이 서버 코드에 구현되어 있다.
- 클라이언트로 Toss access token, refresh token, promotion secret이 반환되지 않는다.
- `GET /api/auth/session`으로 로그인 여부를 확인할 수 있다.
- `GET /api/me/today`로 오늘 진행 상태를 조회할 수 있다.
- `POST /api/quiz/submit`이 제출 기록을 만들고 정답 여부를 즉시 노출하지 않는다.
- `POST /api/quiz-submissions/{submissionId}/result`가 광고 완료 상태 이후 서버 기준 정답 결과를 반환한다.
- `POST /api/rewards/toss-point`에서 중복 지급 방지 기준이 적용된다.
- Firestore Admin SDK 접근은 서버 코드 안에서만 수행된다.
- 프론트 API 어댑터가 구현 API를 직접 호출할 수 있다.
- 프론트 컴포넌트가 백엔드 내부 구현에 결합하지 않는다.
- 서버 응답과 오류 응답이 공통 shape를 따른다.
- 민감 정보가 클라이언트 번들, 응답, 로그, 저장소에 노출되지 않는다.
- 백엔드 타입체크와 빌드가 통과한다.
- 프론트 타입체크와 빌드가 통과한다.
- Firebase Functions로 이전할 때 재사용할 수 있도록 handler와 business logic이 분리되어 있다.

## Git 전략

- 최신 `dev` 기준에서 `codex/03-backend-api` 형식의 작업 브랜치를 만든다.
- 현재 목차에 `03-toss-login.md`가 이미 있으므로, 번호 중복 정리는 별도 문서 정리 작업 또는 PR 설명에서 명시한다.
- API 계약, Toss 로그인 서버 처리, 세션 처리, 답안 제출, 결과 확인, 보상 요청은 가능한 분리된 커밋으로 남긴다.
- 작업 범위 밖 UI 구현이나 Toss Ads SDK 구현은 같은 브랜치에 포함하지 않는다.
- 작업 완료 후 `docs/exec-plans/completed/03-backend-api-result.md`를 작성한다.
- 작업 브랜치에서 `dev`로 PR을 보낸다.
- PR 설명에는 참조한 active 문서, 작성한 completed 문서, 로컬 백엔드 실행 방법, 검증한 API 호출 결과를 함께 적는다.
- 실제 운영 secret이 필요한 항목은 PR에 값 대신 필요한 환경변수 이름만 적는다.

## 다음 작업과의 연결

- 토스 로그인 기능 구현 작업은 `POST /api/auth/toss-login`과 `GET /api/auth/session` 계약을 사용한다.
- 사용자 식별 및 진행 상태 기준 정의 작업은 `userKey + quizDate` 저장 기준과 `GET /api/me/today` 응답을 사용한다.
- Firebase 문제 데이터 조회 작업은 서버의 정답 검증 기준과 문제 데이터 shape에 맞춰 진행한다.
- 답안 제출 흐름 작업은 `POST /api/quiz/submit` 응답의 `submissionId`와 `requiresInterstitialAd` 상태를 사용한다.
- 토스애즈 전면형 광고 작업은 제출별 광고 완료 상태를 결과 확인 가능 조건과 연결한다.
- 정답 확인 및 결과 분기 작업은 `POST /api/quiz-submissions/{submissionId}/result` 계약을 사용한다.
- 토스 포인트 지급 작업은 `POST /api/rewards/toss-point`의 멱등 응답을 실제 Toss promotion 실행과 결과 조회로 확장한다.
- 당일 중복 학습 및 중복 보상 방지 작업은 이번 작업의 진행 상태 저장 구조와 멱등 처리 기준을 확장한다.
