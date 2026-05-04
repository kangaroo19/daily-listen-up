# 3. 서버 API 구현 결과

## 참조 문서

- `docs/exec-plans/active/03-backend-api.md`
- `docs/exec-plans/completed/02-backend-foundation-result.md`
- Apps in Toss 토스 로그인 개발 문서
- Apps in Toss 비게임 프로모션 문서

## 작업 내용

- `shared/api/contracts.ts`에 로그인, 세션, 오늘 진행 상태, 답안 제출, 결과 확인, 포인트 요청 계약을 추가했다.
- 서버 HTTP 핸들러에 MVP API 라우트를 연결하고 동적 제출 결과 경로를 처리하도록 했다.
- Toss authorization code 교환과 `login-me` 사용자 조회를 서버 전용 `TossClient`로 구현했다.
- 서버 세션을 httpOnly cookie 기반으로 생성하고 확인하도록 했다.
- KST 날짜 기준 오늘 진행 상태 조회, 제출 저장, 결과 확인, 보상 요청 기준을 service 계층에 구현했다.
- repository 인터페이스와 로컬 검증용 in-memory repository를 분리했다.
- 제출 시점에는 정답 여부를 반환하지 않고, 광고 완료 플래그가 확인된 결과 요청에서만 정답 결과를 반환하도록 했다.
- 포인트 요청은 정답 상태 이후에만 가능하고, 이미 지급된 경우 `already_granted`로 멱등 응답을 반환하도록 했다.
- 프론트 API 어댑터에 구현 API 메서드와 오류 상태 분류를 추가했다.
- 실제 Toss secret 없이 로컬 검증할 수 있도록 `LOCAL_AUTH_BYPASS_ENABLED`와 `LOCAL_TOSS_POINT_AUTO_GRANT` 예시 환경변수를 추가했다.

## 로컬 실행 방법

```bash
npm run backend:build
npm run backend:start
```

프론트 개발 서버는 기존처럼 `npm run dev`로 실행하며, Vite가 `/api/*` 요청을 `http://localhost:8787`로 프록시한다.

## 검증 결과

- `npm run typecheck`: 통과
- `npm run backend:build`: 통과
- `npm run build:frontend`: 통과
- `npm run lint`: 통과
- 로컬 백엔드 API 시나리오 확인
  - `GET /api/health`: `{ "ok": true }`
  - `POST /api/auth/toss-login`: 로컬 우회 설정에서 `{ "userKey": "local-tester" }`
  - `GET /api/me/today`: KST 오늘 날짜와 `not_started` 상태
  - `POST /api/quiz/submit`: `submissionId`와 `requiresInterstitialAd: true`
  - 광고 완료 전 `POST /api/quiz-submissions/{submissionId}/result`: `403`
  - 광고 완료 후 결과 확인: `{ "isCorrect": true, "status": "correct", "attemptCount": 1 }`
  - `POST /api/rewards/toss-point`: 로컬 자동 지급 설정에서 `{ "promotionStatus": "granted", "isPromotionGranted": true }`

## 미결정 사항

- 실제 운영 Toss authorization code는 로컬 검증에 사용하지 않았다.
- 실제 Toss 포인트 지급 key 발급, 지급 실행, 결과 조회 고도화는 13번 작업에서 확장한다.
- Firestore Admin SDK 실제 저장소 구현은 Firebase 문제 데이터와 진행 상태 저장 정책이 확정되는 후속 작업에서 연결한다.
