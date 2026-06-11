# 09. 당일 완료/중복 보상 방지와 상태 모델 강화 결과

## 기준 문서

- Active 작업지시서: `docs/exec-plans/active/09-daily-completion-duplicate-guard.md`
- 직전 완료 문서: `docs/exec-plans/completed/08-result-retry-script-result.md`
- MVP 기준: `docs/exec-plans/index.md`
- 제품 기준: `docs/product-specs/backend.md`, `docs/product-specs/home.md`, `docs/product-specs/quiz.md`, `docs/product-specs/result.md`
- UI 기준: `docs/design-docs/style-guidelines.md`

## 작업 체크리스트

- [x] 작업 시작 시 `docs/exec-plans/completed/08-result-retry-script-result.md`가 존재하면 먼저 읽고 재도전권, 스크립트 열람권, 실패 처리 기준을 반영했다.
  - 근거: 08 completed의 재도전권 저장 방식, 스크립트 열람권 저장 방식, 실패 처리 기준을 확인했다.
- [x] 서버 API에서 `progressStatus`와 `rewardStatus`를 서로 다른 축으로 다루는지 점검했다.
  - 근거: `functions/src/services/answerResult.ts`, `functions/src/services/rewardedAdComplete.ts`, `functions/src/services/homeEntry.ts`.
- [x] `GET /api/reward-status`가 완료 사용자에게 `progressStatus = completed`와 최신 `rewardStatus`를 함께 반환하게 유지했다.
  - 근거: `functions/src/api/rewardStatus.ts`, `functions/src/services/homeEntry.ts`, `functions/src/__tests__/homeEntry.test.ts`.
- [x] 홈 시작 흐름이 `progressStatus = completed`이면 문제 풀이 또는 결과 화면으로 이동하지 않게 했다.
  - 근거: `src/screens/HomeScreen.tsx`가 completed 상태에서 `onEnterQuiz()`를 호출하지 않고 토스트만 표시한다.
- [x] 홈 시작 흐름이 `progressStatus = completed`, `rewardStatus = failed`이면 `포인트 지급 확인이 필요해요` 토스트만 보여주게 했다.
  - 근거: `src/screens/HomeScreen.tsx`.
- [x] 홈 시작 흐름이 `progressStatus = completed`, `rewardStatus != failed`이면 `오늘 문제풀이를 완료했습니다` 토스트만 보여주게 했다.
  - 근거: `src/screens/HomeScreen.tsx`.
- [x] `GET /api/today-quiz` 또는 문제 풀이 진입 경계에서 완료 사용자가 문제 데이터를 다시 받아 풀이로 진입하지 못하게 했다.
  - 근거: `functions/src/services/todayQuiz.ts`, `functions/src/api/todayQuiz.ts`, `functions/src/__tests__/todayQuiz.test.ts`.
- [x] `POST /api/answer-result`에서 `progressStatus = completed`인 사용자의 추가 제출을 거부한다.
  - 근거: `functions/src/services/answerResult.ts`, `functions/src/__tests__/answerResult.test.ts`.
- [x] `POST /api/answer-result`에서 `progressStatus = wrong`인 사용자의 광고 보상 없는 재제출을 거부한다.
  - 근거: `functions/src/services/answerResult.ts`, `functions/src/__tests__/answerResult.test.ts`.
- [x] `POST /api/answer-result`에서 `progressStatus = retry_unlocked` 제출 시 재도전권을 소진한다.
  - 근거: `functions/src/__tests__/answerResult.test.ts`의 retry 제출 후 `wrong` 전환 검증.
- [x] `POST /api/rewarded-ad-complete`의 `purpose = retry`는 재도전권을 누적하지 않고 `retry_unlocked` 상태만 보장한다.
  - 근거: `functions/src/services/rewardedAdComplete.ts`, `functions/src/__tests__/rewardedAdComplete.test.ts`.
- [x] `POST /api/rewarded-ad-complete`의 `purpose = script`는 스크립트 열람권과 `script` 응답만 다루고 재도전권을 부여하지 않는다.
  - 근거: `functions/src/__tests__/rewardedAdComplete.test.ts`.
- [x] `rewardGrants`는 같은 `userId`, `quizDate`에 대해 중복 지급 요청이 발생하지 않도록 확인했다.
  - 근거: `functions/src/services/pointReward.ts`, `functions/src/repositories/rewardGrantRepository.ts`, `functions/src/__tests__/pointReward.test.ts`.
- [x] 지급 실패 상태에서도 `progressStatus = completed`를 유지하고 추가 지급 자동 재시도를 하지 않는다.
  - 근거: 실패 grant 저장과 `rewardReviewRequired = true`를 `functions/src/__tests__/pointReward.test.ts`에서 검증했다.
- [x] 서버 KST 기준 오늘 날짜와 요청 `quizDate`가 어긋난 경우의 처리 기준을 테스트 또는 문서에 남긴다.
  - 근거: 아래 "날짜 기준"에 문서화했다.

## 검증 체크리스트

- [x] 완료 사용자가 홈에서 다시 `시작하기`를 눌러도 결과 화면으로 이동하지 않는다.
  - 근거: `src/screens/HomeScreen.tsx` completed 분기.
- [x] 완료 사용자가 홈에서 다시 `시작하기`를 눌러도 문제 풀이 화면으로 이동하지 않는다.
  - 근거: `src/screens/HomeScreen.tsx`, `functions/src/__tests__/todayQuiz.test.ts`.
- [x] 완료 사용자의 `rewardStatus = failed` 상태는 홈에서 지급 실패 토스트로 확인된다.
  - 근거: `src/screens/HomeScreen.tsx`.
- [x] 완료 사용자의 `rewardStatus = success` 또는 `pending` 상태는 홈에서 완료 토스트로 확인된다.
  - 근거: `src/screens/HomeScreen.tsx`.
- [x] 완료 사용자가 `POST /api/answer-result`를 다시 호출하면 서버가 거부한다.
  - 근거: `functions/src/__tests__/answerResult.test.ts`.
- [x] `wrong` 상태 사용자가 보상형 광고 없이 다시 제출하면 서버가 거부한다.
  - 근거: `functions/src/__tests__/answerResult.test.ts`.
- [x] `retry_unlocked` 상태 사용자가 제출하면 재도전권이 소진된다.
  - 근거: `functions/src/__tests__/answerResult.test.ts`.
- [x] 보상형 광고를 여러 번 완료해도 재도전권이 누적 횟수로 저장되지 않는다.
  - 근거: `functions/src/__tests__/rewardedAdComplete.test.ts`.
- [x] `purpose = script` 보상은 스크립트 열람권만 부여하고 재도전 제출 가능 상태를 임의로 만들지 않는다.
  - 근거: `functions/src/__tests__/rewardedAdComplete.test.ts`.
- [x] 같은 `userId`, `quizDate`에 포인트 지급 요청이 두 번 발생하지 않는다.
  - 근거: `functions/src/__tests__/pointReward.test.ts`.
- [x] 지급 실패 상태에서도 같은 날짜의 추가 지급 요청이 자동으로 반복되지 않는다.
  - 근거: 실패 상태도 `rewardGrants`에 저장하고 기존 grant가 있으면 Toss 요청을 하지 않는다.
- [x] 서버 테스트 또는 Emulator 검증으로 당일 완료, 중복 보상 방지, 지급 실패 상태를 재현할 수 있다.
  - 근거: `npm --prefix functions run test`, 32개 테스트 통과.
- [x] 타입 검사, Functions 검증, 프론트 빌드, 관련 테스트 또는 수동 검증이 통과한다.
  - 근거: 아래 검증 결과.

## 날짜 기준

- `GET /api/today-quiz`와 `GET /api/reward-status`는 서버 KST 기준 오늘 날짜를 사용한다.
- `POST /api/answer-result`와 `POST /api/rewarded-ad-complete`는 클라이언트가 `GET /api/today-quiz`에서 받은 요청 `quizDate`를 기준으로 문제, 제출, 광고 보상을 처리한다.
- 서버 KST 오늘 날짜와 요청 `quizDate`가 어긋난 경우 MVP에서는 요청 `quizDate`가 공개 문제로 존재하고 사용자 상태가 허용되는지만 서버가 검증한다. 임의의 날짜 차단 정책은 09 범위에서 추가하지 않았다.

## 전체 상태 전이 표

| 현재 progressStatus | 액션 | 다음 progressStatus | rewardStatus 처리 | 비고 |
| --- | --- | --- | --- | --- |
| not_started | 첫 오답 제출 | wrong | none | 재도전은 광고 보상 필요 |
| not_started | 첫 정답 제출 | completed | pending/success/failed | `rewardGrants` 기준 1회 지급 |
| wrong | 답안 재제출 | 거부 | 유지 | 광고 보상 없는 재제출 불가 |
| wrong | purpose=retry 광고 완료 | retry_unlocked | 유지 | 재도전권 누적 없음 |
| wrong | purpose=script 광고 완료 | wrong | 유지 | `canViewScript = true`, script 응답 |
| retry_unlocked | 오답 제출 | wrong | none | 재도전권 소진 |
| retry_unlocked | 정답 제출 | completed | pending/success/failed | 재도전권 소진 후 완료 |
| retry_unlocked | purpose=retry 광고 완료 | retry_unlocked | 유지 | idempotent |
| completed | today-quiz 조회 또는 답안 제출 | 거부 | 유지 | 홈에서는 토스트만 표시 |
| completed | purpose=script 광고 완료 | completed | 유지 | 스크립트 열람만 허용 |

## 테스트 계정/샘플 데이터

- 단위 테스트 사용자: `user_1`
- 단위 테스트 세션: `app_session_token`
- 샘플 날짜: `2026-05-31`, `2026-06-01`, `2026-06-02`
- 샘플 정답: `choice-b`, `choice-e` 또는 테스트별 fixture 값
- 포인트 금액: `promotionAmount = 5`
- Emulator 샘플 데이터는 기존 `functions/src/sample/sampleQuiz.ts`와 seed/verify 스크립트 기준을 유지했다.

## 검증 결과

- `npm --prefix functions run test`: 통과, 32개 테스트.
- `npm run typecheck`: 통과.
- `npm run build`: 통과. Vite 번들 크기 경고는 기존과 동일하게 발생했지만 빌드는 성공했다.

## 변경 요약

- `GET /api/today-quiz`가 서버 KST 오늘 날짜의 `userProgress.progressStatus = completed`를 확인해 문제 데이터를 다시 내려주지 않게 했다.
- 포인트 지급 실패가 Toss 요청 전 단계에서 발생해도 `rewardGrants`에 `failed` 기록을 남겨 같은 사용자/날짜의 자동 재지급 진입을 막았다.
- 재도전 광고의 idempotent 상태 보장, script 광고의 retry 미부여, 지급 실패 grant 저장 테스트를 추가했다.

## 후속 참고 사항

- 10번 최종 검증에서는 실제 Emulator 데이터로 completed 사용자의 홈 토스트, `/api/today-quiz` 409 응답, `/api/answer-result` 409 응답을 한 번 더 확인한다.
- 동시 요청 경합까지 막는 Firestore transaction 또는 `create()` 기반 원자성 강화는 MVP 09 범위에서 확정하지 않았다. 10번에서 운영 요구가 있으면 별도 작업으로 분리한다.
- 지급 실패 후 운영자 재지급/고객센터 상세 플로우는 MVP 범위 밖으로 남겼다.
