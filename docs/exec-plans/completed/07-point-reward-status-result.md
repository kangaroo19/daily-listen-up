# 07. 포인트 지급과 지급 상태 조회 구현 결과

## 기준 문서

- Active 작업지시서: `docs/exec-plans/active/07-point-reward-status.md`
- 직전 완료 문서: `docs/exec-plans/completed/06-answer-submit-interstitial-result-result.md`
- MVP 기준: `docs/exec-plans/index.md`
- 제품 기준: `docs/product-specs/backend.md`, `docs/product-specs/result.md`, `docs/product-specs/quiz.md`
- Toss 프로모션 문서: `https://developers-apps-in-toss.toss.im/bedrock/reference/framework/비게임/promotion.md`

## 작업 체크리스트

- [x] 작업 시작 시 `docs/exec-plans/completed/06-answer-submit-interstitial-result-result.md`가 존재하면 먼저 읽고 정답 응답 형식과 지급 흐름 진입 위치를 반영했다.
  - 근거: `functions/src/services/answerResult.ts`가 정답 저장 후 `grantPointReward()`를 호출한다.
- [x] 정답 판정 직후 서버에서만 포인트 지급 요청 흐름에 진입한다.
  - 근거: `functions/src/services/answerResult.ts`, `functions/src/services/pointReward.ts`.
- [x] 지급 요청 전에 앱 세션의 내부 `userId`와 요청 `quizDate`를 기준으로 `rewardGrants` 기존 기록을 조회한다.
  - 근거: `functions/src/services/pointReward.ts`, `functions/src/repositories/rewardGrantRepository.ts`.
- [x] 기존 지급 기록이 있으면 추가 지급 요청을 하지 않고 저장된 `rewardStatus`를 반환한다.
  - 근거: `functions/src/__tests__/pointReward.test.ts`.
- [x] 기존 지급 기록이 없으면 `promotionKey`, `userId`, `quizDate`, `amount`, `status`를 포함한 지급 기록을 생성한다.
  - 근거: `functions/src/services/pointReward.ts`.
- [x] 토스 포인트 지급 요청에 필요한 민감한 값은 서버 환경 변수 또는 서버 전용 설정에서만 읽는다.
  - 근거: `functions/src/services/tossPromotionClient.ts`, `.env.example`.
- [x] 샌드박스/검증 환경의 토스 포인트 지급 요청에는 테스트 프로모션 코드를 사용하고, 클라이언트에는 노출하지 않는다.
  - 근거: 서버 전용 `TOSS_PROMOTION_CODE`를 `.env.example`에 추가했고, 클라이언트 `src/`에서는 사용하지 않는다.
- [x] 지급 요청 시작 시 `rewardStatus = pending`으로 저장한다.
  - 근거: `functions/src/services/pointReward.ts`, `functions/src/__tests__/pointReward.test.ts`.
- [x] 지급 성공 응답이면 `rewardGrants.status`와 `userProgress.rewardStatus`를 `success`로 저장한다.
  - 근거: `functions/src/__tests__/pointReward.test.ts`.
- [x] 지급 실패 응답이면 `rewardGrants.status`와 `userProgress.rewardStatus`를 `failed`로 저장하고 `rewardReviewRequired` 기준을 남긴다.
  - 근거: `functions/src/__tests__/pointReward.test.ts`.
- [x] `POST /api/answer-result`의 정답 응답에 최신 `rewardStatus`를 포함한다.
  - 근거: `functions/src/__tests__/answerResult.test.ts`, `functions/src/scripts/verifyAnswerResult.ts`.
- [x] `GET /api/reward-status`가 앱 세션, KST 오늘 날짜, `userProgress`, `rewardGrants`를 기준으로 `progressStatus`와 `rewardStatus`를 함께 반환한다.
  - 근거: 기존 `functions/src/api/rewardStatus.ts`, `functions/src/services/homeEntry.ts`, `functions/src/__tests__/homeEntry.test.ts`.
- [x] 진행 기록이 없으면 `progressStatus = not_started`, 지급 기록이 없으면 `rewardStatus = none`으로 반환한다.
  - 근거: `functions/src/__tests__/homeEntry.test.ts`.
- [x] 홈 시작 흐름과 결과 화면이 `GET /api/reward-status`를 호출할 수 있는 클라이언트 API 경계를 갖춘다.
  - 근거: `src/services/apiClient.ts`의 `getRewardStatus()`, `src/screens/HomeScreen.tsx`.

## 검증 체크리스트

- [x] 정답 제출 후 포인트 지급 요청은 클라이언트가 아니라 서버에서만 발생한다.
  - 근거: 클라이언트 `src/` 검색 결과 Toss 프로모션 지급 호출 없음. 서버 `answerResult`에서만 지급 흐름 진입.
- [x] 정답 제출 후 `progressStatus = completed`와 `rewardStatus`가 분리된 값으로 저장된다.
  - 근거: `functions/src/services/answerResult.ts`, `functions/src/services/pointReward.ts`.
- [x] 같은 `userId`, `quizDate`에 기존 `rewardGrants`가 있으면 추가 지급 요청이 발생하지 않는다.
  - 근거: `functions/src/__tests__/pointReward.test.ts`.
- [x] 지급 성공 시 `rewardGrants.status = success`와 `userProgress.rewardStatus = success`가 확인된다.
  - 근거: `npm --prefix functions run test`.
- [x] 지급 실패 시 `rewardGrants.status = failed`, `userProgress.rewardStatus = failed`, `rewardReviewRequired` 기준이 확인된다.
  - 근거: `npm --prefix functions run test`.
- [x] 지급 요청 중 또는 확인 중 상태를 `pending`으로 조회할 수 있다.
  - 근거: `functions/src/__tests__/pointReward.test.ts`, `functions/src/__tests__/homeEntry.test.ts`.
- [x] `GET /api/reward-status`가 `progressStatus`와 `rewardStatus`를 모두 반환한다.
  - 근거: `functions/src/__tests__/homeEntry.test.ts`.
- [x] 지급 기록이 없는 사용자는 `rewardStatus = none`으로 조회된다.
  - 근거: `functions/src/__tests__/homeEntry.test.ts`.
- [x] 테스트 프로모션 코드는 서버 전용 환경 변수 또는 서버 설정에서만 사용되고 클라이언트 번들/응답에 노출되지 않는다.
  - 근거: `TOSS_PROMOTION_CODE`는 `.env.example`의 서버 전용 영역과 `functions/src/services/pointReward.ts`에서만 사용한다.
- [x] 클라이언트 코드에 포인트 지급 비밀키나 Toss 서버 토큰이 노출되지 않는다.
  - 근거: `rg` 검색 결과 민감값은 `functions/src` 서버/테스트/검증 스크립트 범위에만 존재한다.
- [x] 타입 검사, Functions 검증, 프론트 빌드, 관련 테스트 또는 수동 검증이 통과한다.
  - 근거: `npm run typecheck`, `npm --prefix functions run test`, `npm run build`, 기존 Emulator 대상 `npm --prefix functions run verify:answer-result`.

## 제외한 검증

- 로컬 개발 서버 실행은 이번 작업 지시에서 제외되어 실행하지 않았다.
- Browser 또는 실제 화면 기반 UI 검증은 이번 작업 지시에서 제외되어 실행하지 않았다.
- 실제 Toss 프로모션 운영/테스트 코드 호출은 mTLS 인증서와 테스트 프로모션 코드 운영 설정이 필요한 외부 연동이라 단위 테스트의 의존성 주입으로 성공, 실패, pending, 중복 방지 경로를 검증했다.

## 변경 요약

- `TossPromotionClient`를 추가해 비게임 프로모션 S2S API의 key 발급, 지급 실행, 지급 결과 조회 경계를 구현했다.
- `grantPointReward()`를 추가해 `rewardGrants` 중복 조회, pending 저장, 성공/실패 상태 저장, `userProgress.rewardStatus` 동기화를 처리한다.
- `POST /api/answer-result` 정답 흐름에 포인트 지급 서비스를 연결해 최신 `rewardStatus`를 응답한다.
- 기존 `verify:answer-result` 스크립트는 기존 지급 기록 경로를 사용해 외부 Toss 호출 없이 최신 `rewardStatus` 반영을 확인하도록 보강했다.
- 서버 전용 환경 변수 예시 `TOSS_PROMOTION_CODE`를 추가했다.

## 검증 결과

- `npm --prefix functions run test`: 통과, 21개 테스트.
- `npm --prefix functions run verify:answer-result`: 통과. 기존 실행 중인 Emulator에 `GCLOUD_PROJECT`, `FIRESTORE_EMULATOR_HOST`, `FUNCTIONS_EMULATOR`를 지정해 연결했다.
- `npm run typecheck`: 통과.
- `npm run build`: 통과. Vite 번들 크기 경고는 기존처럼 발생했지만 빌드는 성공했다.

## 후속 참고 사항

- 08번 결과 화면은 `POST /api/answer-result` 응답의 `{ isCorrect, progressStatus, rewardStatus }`를 그대로 사용하면 된다.
- 지급 상태 문구는 `pending`: `포인트 지급을 확인하고 있어요.`, `success`: `포인트 지급이 완료됐어요.`, `failed`: `포인트 지급을 완료하지 못했어요. 잠시 후 다시 확인하거나 고객센터에 문의해 주세요.` 기준이다.
- 홈과 결과 화면에서 재조회가 필요하면 기존 `GET /api/reward-status` 클라이언트 경계인 `getRewardStatus()`를 사용한다.
- 실제 Toss 연동 환경에서는 서버 전용 `TOSS_PROMOTION_CODE`, `TOSS_API_BASE_URL`, `TOSS_MTLS_CERT_PATH`, `TOSS_MTLS_KEY_PATH`를 설정해야 한다.
