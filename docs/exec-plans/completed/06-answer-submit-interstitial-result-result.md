# 06. 답안 제출, 전면형 광고, 정답 검증 구현 결과

## 기준 문서

- Active 작업지시서: `docs/exec-plans/active/06-answer-submit-interstitial-result.md`
- 직전 완료 문서: `docs/exec-plans/completed/05-audio-multiple-choice-quiz-result.md`
- MVP 기준: `docs/exec-plans/index.md`
- 제품 기준: `docs/product-specs/quiz.md`, `docs/product-specs/result.md`, `docs/product-specs/backend.md`
- UI 기준: `docs/design-docs/style-guidelines.md`
- Toss Ads 문서: `https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/IntegratedAd.md`

## 작업 체크리스트

- [x] 작업 시작 시 `docs/exec-plans/completed/05-audio-multiple-choice-quiz-result.md`가 존재하면 먼저 읽고 `quizDate`, 선택 답안 상태, 제출 버튼 연결 위치를 반영했다.
  - 근거: 05번 완료 문서의 `submissionBoundary`, `getAppSessionToken()` 사용 방식, `답안 제출` 버튼 연결 위치를 `src/screens/QuizScreen.tsx`에 반영했다.
- [x] 문제 풀이 화면의 `답안 제출` 버튼이 선택 답안 1개 이상과 오디오 청취 완료 상태에서만 눌리게 유지했다.
  - 근거: `src/screens/QuizScreen.tsx`의 `canSubmit`.
- [x] `답안 제출` 클릭 시 결과 확인 전면형 광고를 연다.
  - 근거: `src/screens/QuizScreen.tsx`의 `handleSubmitAnswer()`, `src/integrations/tossAds.ts`의 `showTossAd('answer-result')`.
- [x] 전면형 광고가 `dismissed` 이벤트를 발생시키기 전에는 `POST /api/answer-result`를 호출하지 않는다.
  - 근거: `src/integrations/tossAds.ts`가 `dismissed` 이벤트에서만 resolve하고, `src/screens/QuizScreen.tsx`는 `await showTossAd()` 이후에만 `postAnswerResult()`를 호출한다.
- [x] `dismissed` 이벤트 이후 앱 세션 토큰, `quizDate`, 선택 답안 목록으로 `POST /api/answer-result`를 호출한다.
  - 근거: `src/screens/QuizScreen.tsx`, `src/services/apiClient.ts`의 `postAnswerResult()`.
- [x] 제출 중에는 중복 클릭과 중복 API 호출을 막는다.
  - 근거: `src/screens/QuizScreen.tsx`의 `isSubmitting`, `canSubmit`, `Button loading`.
- [x] 서버는 앱 세션 토큰을 확인하고 내부 `userId`를 확보한다.
  - 근거: `functions/src/api/answerResult.ts`, `functions/src/services/answerResult.ts`, `functions/src/services/sessionBoundary.ts`.
- [x] 서버는 요청의 `quizDate`에 해당하는 공개 문제를 조회한다.
  - 근거: `functions/src/services/answerResult.ts`의 `findPublishedQuizByDate()`.
- [x] 서버는 현재 `userProgress.progressStatus`를 조회하고 제출 가능 상태인지 검증한다.
  - 근거: `functions/src/services/answerResult.ts`의 `findUserProgress()` 및 상태 분기.
- [x] `progressStatus = not_started`이면 첫 제출로 허용한다.
  - 근거: `functions/src/__tests__/answerResult.test.ts`, `functions/src/scripts/verifyAnswerResult.ts`.
- [x] `progressStatus = retry_unlocked`이면 재제출로 허용하고 제출 처리와 함께 재도전권을 소진한다.
  - 근거: `functions/src/services/answerResult.ts`가 제출 후 `completed` 또는 `wrong`으로 전환한다. `functions/src/scripts/verifyAnswerResult.ts`에서 attempt 증가와 상태 전환 확인.
- [x] `progressStatus = wrong`이면 보상형 광고 없이 재제출할 수 없도록 거부한다.
  - 근거: `functions/src/services/answerResult.ts`, `functions/src/scripts/verifyAnswerResult.ts`.
- [x] `progressStatus = completed`이면 추가 제출을 거부한다.
  - 근거: `functions/src/services/answerResult.ts`, `functions/src/scripts/verifyAnswerResult.ts`.
- [x] 서버는 선택 답안과 `correctChoiceIds`가 정확히 일치하는지 채점한다.
  - 근거: `functions/src/services/answerResult.ts`의 `hasExactChoiceMatch()`, `functions/src/__tests__/answerResult.test.ts`.
- [x] 오답이면 `userProgress`를 `progressStatus = wrong`, `rewardStatus = none` 기준으로 저장한다.
  - 근거: `functions/src/services/answerResult.ts`, `functions/src/scripts/verifyAnswerResult.ts`.
- [x] 정답이면 `userProgress`를 `progressStatus = completed` 기준으로 저장하고 포인트 지급 흐름에 진입할 수 있는 응답을 만든다.
  - 근거: `functions/src/services/answerResult.ts`가 `{ isCorrect: true, progressStatus: 'completed', rewardStatus: 'none' }`을 반환한다. 실제 포인트 지급 요청은 07번 범위로 남겼다.
- [x] API 응답은 정답 여부, `progressStatus`, `rewardStatus`를 포함한다.
  - 근거: `functions/src/api/answerResult.ts`, `src/services/apiClient.ts`, `functions/src/scripts/verifyAnswerResult.ts`.
- [x] API 응답을 받은 뒤 결과 화면으로 이동하고 응답 상태를 전달한다.
  - 근거: `src/screens/QuizScreen.tsx`, `src/App.tsx`, `src/screens/ResultScreen.tsx`.
- [x] API 실패 또는 광고 실패/취소 시 같은 문제 풀이 화면에서 재시도할 수 있게 한다.
  - 근거: `src/screens/QuizScreen.tsx`가 실패 시 문제/선택 상태를 유지하고 `submitErrorMessage`만 표시한 뒤 `isSubmitting`을 해제한다.

## 검증 체크리스트

- [x] 전면형 광고의 `dismissed` 이벤트 전에는 `POST /api/answer-result`가 호출되지 않는다.
  - 근거: `src/integrations/tossAds.ts`, `src/screens/QuizScreen.tsx` 코드 확인. Toss Ads 문서의 전면형 광고 이벤트 `loaded`, `dismissed`, 실패 이벤트 `failedToShow` 기준 반영.
- [x] `POST /api/answer-result` 요청에 `quizDate`와 선택 답안 목록이 포함된다.
  - 근거: `src/services/apiClient.ts`, `functions/src/scripts/verifyAnswerResult.ts`.
- [x] `progressStatus = not_started`에서 첫 제출이 성공한다.
  - 근거: `npm --prefix functions run test`, `firebase emulators:exec --project daily-listen-up-dev --only firestore,functions "npm --prefix functions run verify:answer-result"`.
- [x] `progressStatus = retry_unlocked`에서 재제출이 성공하고 제출 후 재도전권이 소진된다.
  - 근거: `functions/src/__tests__/answerResult.test.ts`, `functions/src/scripts/verifyAnswerResult.ts`.
- [x] `progressStatus = wrong`에서 광고 보상 없이 재제출하면 서버가 거부한다.
  - 근거: `functions/src/__tests__/answerResult.test.ts`, `functions/src/scripts/verifyAnswerResult.ts`.
- [x] `progressStatus = completed`에서 추가 제출하면 서버가 거부한다.
  - 근거: `functions/src/__tests__/answerResult.test.ts`, `functions/src/scripts/verifyAnswerResult.ts`.
- [x] 정답 선택지와 선택 답안이 정확히 일치할 때만 정답으로 판정된다.
  - 근거: `functions/src/services/answerResult.ts`, `functions/src/__tests__/answerResult.test.ts`, `functions/src/scripts/verifyAnswerResult.ts`.
- [x] 오답 제출 후 서버 상태가 `progressStatus = wrong`, `rewardStatus = none`으로 확인된다.
  - 근거: `functions/src/scripts/verifyAnswerResult.ts`.
- [x] 정답 제출 후 서버 응답에 `progressStatus = completed`와 지급 흐름에 필요한 `rewardStatus`가 포함된다.
  - 근거: `functions/src/scripts/verifyAnswerResult.ts`. 06번에서는 `rewardStatus` 초기값을 `none`으로 반환하고, 07번에서 포인트 지급 요청 상태로 전환한다.
- [x] 결과 화면 진입은 서버 응답을 받은 뒤에만 발생한다.
  - 근거: `src/screens/QuizScreen.tsx`가 `postAnswerResult()` 완료 후에만 `onAnswerResult()`를 호출하고, `src/App.tsx`가 그 시점에 `result` 화면으로 전환한다.
- [x] 클라이언트 코드와 네트워크 응답에 `correctChoiceIds`, `script`, 원본 `audioStoragePath`가 노출되지 않는다.
  - 근거: `functions/src/scripts/verifyAnswerResult.ts`가 응답 key를 `isCorrect`, `progressStatus`, `rewardStatus`로 검증했다. `rg` 점검에서 클라이언트의 `script` 문자열은 광고 목적 타입 값이며 스크립트 본문 노출이 아니다.
- [x] 타입 검사, Functions 검증, 프론트 빌드, 관련 테스트 또는 수동 검증이 통과한다.
  - 근거: `npm run typecheck`, `npm --prefix functions run test`, `firebase emulators:exec --project daily-listen-up-dev --only firestore,functions "npm --prefix functions run verify:answer-result"`, `npm run build`.

## 제외한 검증

- 로컬 개발 서버 실행은 이번 작업 지시에서 제외되어 실행하지 않았다.
- Browser 또는 실제 화면 기반 UI 검증은 이번 작업 지시에서 제외되어 실행하지 않았다.
- Toss 테스트앱/샌드박스앱에서는 결과 확인 전면형 광고가 실행되지 않는 것으로 확인되어, 로컬/샌드박스 검증용으로 `VITE_SKIP_ANSWER_RESULT_INTERSTITIAL=true` 플래그를 추가했다.
  - 이 플래그가 `true`이면 `showTossAd('answer-result')`가 전면형 광고 호출 없이 resolve되어 `POST /api/answer-result` 제출 흐름을 검증할 수 있다.
  - 기본값은 `.env.example` 기준 `false`이며, 운영/실매체 검증에서는 이 플래그를 켜면 안 된다.
  - 08번 결과 화면의 광고 기능도 Toss 테스트앱/샌드박스앱에서 인앱광고를 사용할 수 없으면 같은 값을 사용해 광고 표시 단계를 건너뛰고 후속 흐름을 검증한다.

## 변경 요약

- 문제 풀이 화면의 `답안 제출` 버튼을 Toss Ads 전면형 광고 완료 후 답안 제출 API로 연결했다.
- Toss Ads 전면형 광고는 `loaded` 이후 표시하고, `dismissed` 이벤트 이후에만 제출 API 호출이 진행되도록 했다.
- `POST /api/answer-result`를 추가해 앱 세션, 공개 문제, 현재 진행 상태, 정답 일치 여부를 서버에서 검증한다.
- 제출 결과를 `ResultScreen`으로 전달해 정답/오답, `progressStatus`, `rewardStatus`를 표시할 수 있게 했다.
- Firebase Emulator 검증 스크립트 `functions/src/scripts/verifyAnswerResult.ts`와 npm 실행 스크립트를 추가했다.
- Toss 테스트앱/샌드박스 검증을 위해 `VITE_SKIP_ANSWER_RESULT_INTERSTITIAL` 플래그를 추가했다. 플래그가 켜진 환경에서는 결과 확인 전면형 광고만 건너뛰고 서버 제출/채점/결과 이동 흐름은 그대로 실행한다.

## 검증 결과

- `npm run typecheck`: 통과.
- `npm --prefix functions run test`: 통과, 15개 테스트.
- `firebase emulators:exec --project daily-listen-up-dev --only firestore,functions "npm --prefix functions run verify:answer-result"`: 통과.
- `npm run build`: 통과. Vite 번들 크기 경고는 발생했지만 빌드는 성공했다.
- 비밀값/서버 전용 필드 검색: 클라이언트 코드와 `answer-result` 응답에 정답 목록, 스크립트 본문, 원본 Storage 경로, 포인트 금액, Toss access token/refresh token, 원본 `userKey`, mTLS 인증서/개인키를 노출하지 않는 구조를 확인했다.

## 후속 참고 사항

- 07번 포인트 지급 구현자는 정답 응답 형식 `{ isCorrect: true, progressStatus: 'completed', rewardStatus: 'none' }`을 지급 흐름 진입 신호로 사용하면 된다.
- 06번에서는 포인트 지급 요청을 수행하지 않으므로 정답 직후 `rewardStatus`는 `none`으로 시작한다.
- 지급 흐름 진입 위치는 `src/screens/ResultScreen.tsx`에서 `answerResult.isCorrect === true && answerResult.progressStatus === 'completed'` 상태를 받은 이후다.
- `POST /api/answer-result`는 `correctChoiceIds`, `script`, `promotionAmount`, 원본 `audioStoragePath`를 응답하지 않는다.
- 08번 작업자는 Toss 테스트앱/샌드박스앱에서 인앱광고 기능을 사용할 수 없을 때 `VITE_SKIP_ANSWER_RESULT_INTERSTITIAL=true` 값을 사용해 광고 표시 단계를 건너뛰고 재도전/스크립트 보기 후속 흐름을 검증한다.
