# 08. 결과 화면, 재도전, 스크립트 보기 구현 결과

## 기준 문서

- Active 작업지시서: `docs/exec-plans/active/08-result-retry-script.md`
- 직전 완료 문서: `docs/exec-plans/completed/07-point-reward-status-result.md`
- MVP 기준: `docs/exec-plans/index.md`
- 제품 기준: `docs/product-specs/result.md`, `docs/product-specs/quiz.md`, `docs/product-specs/backend.md`, `docs/product-specs/home.md`
- UI 기준: `docs/design-docs/style-guidelines.md`
- Toss Ads 문서: `https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/IntegratedAd.md`

## 작업 체크리스트

- [x] 작업 시작 시 `docs/exec-plans/completed/07-point-reward-status-result.md`가 존재하면 먼저 읽고 결과 응답, 지급 상태 문구 매핑, 재조회 기준을 반영했다.
  - 근거: 결과 화면은 `answerResult`와 `quizDate`를 함께 보관하고, `rewardStatus = pending`이면 `GET /api/reward-status`로 재조회한다.
- [x] 결과 화면 진입 시 `POST /api/answer-result` 응답의 정답 여부, `progressStatus`, `rewardStatus`, `quizDate`를 사용한다.
  - 근거: `src/App.tsx`, `src/screens/QuizScreen.tsx`, `src/screens/ResultScreen.tsx`.
- [x] 정답이면 제목 `정답이에요`와 안내 `포인트 보상 상태를 확인해 주세요.`를 표시한다.
  - 근거: `src/screens/ResultScreen.tsx`.
- [x] 정답 직후 완료 상태를 `오늘 학습을 완료했어요`, `내일 새로운 문제로 다시 만나요.` 문구로 표현한다.
  - 근거: `src/screens/ResultScreen.tsx`.
- [x] `rewardStatus = pending`이면 `포인트 지급을 확인하고 있어요.`를 표시한다.
  - 근거: `getRewardStatusMessage()` in `src/screens/ResultScreen.tsx`.
- [x] `rewardStatus = success`이면 `포인트 지급이 완료됐어요.`를 표시한다.
  - 근거: `getRewardStatusMessage()` in `src/screens/ResultScreen.tsx`.
- [x] `rewardStatus = failed`이면 `포인트 지급을 완료하지 못했어요. 잠시 후 다시 확인하거나 고객센터에 문의해 주세요.`를 표시한다.
  - 근거: `getRewardStatusMessage()` in `src/screens/ResultScreen.tsx`.
- [x] 오답이면 제목 `아쉬워요`와 안내 `광고를 보고 같은 문제에 다시 도전할 수 있어요.`를 표시한다.
  - 근거: `src/screens/ResultScreen.tsx`.
- [x] 오답 상태에서 `광고 보고 재도전` 버튼을 제공한다.
  - 근거: `src/screens/ResultScreen.tsx`.
- [x] 정답과 오답 상태 모두에서 `광고 보고 스크립트 보기` 버튼을 제공한다.
  - 근거: `src/screens/ResultScreen.tsx`.
- [x] `광고 보고 재도전` 클릭 시 보상형 광고를 열고 `userEarnedReward` 이후 `POST /api/rewarded-ad-complete`에 `quizDate`, `purpose = retry`를 전달한다.
  - 근거: `src/integrations/tossAds.ts`, `src/screens/ResultScreen.tsx`, `src/services/apiClient.ts`.
- [x] `purpose = retry` 성공 응답 후 같은 문제 풀이 화면으로 이동하고 새 시도에서 오디오를 다시 1회 들을 수 있게 한다.
  - 근거: `src/App.tsx`에서 결과 화면의 `onRetry`가 `QuizScreen`을 다시 마운트한다.
- [x] `광고 보고 스크립트 보기` 클릭 시 보상형 광고를 열고 `userEarnedReward` 이후 `POST /api/rewarded-ad-complete`에 `quizDate`, `purpose = script`를 전달한다.
  - 근거: `src/integrations/tossAds.ts`, `src/screens/ResultScreen.tsx`, `src/services/apiClient.ts`.
- [x] `purpose = script` 성공 응답의 `script`를 같은 결과 화면 안에 펼쳐 보여준다.
  - 근거: `src/screens/ResultScreen.tsx`.
- [x] 스크립트 보기 후에도 오답 사용자는 재도전할 수 있게 유지한다.
  - 근거: 스크립트 표시 상태와 재도전 버튼 상태가 분리되어 있다.
- [x] 보상형 광고 취소, 실패, API 실패 시 결과 화면에 머무르고 `광고를 완료하지 못했어요. 다시 시도해 주세요.` 안내를 보여준다.
  - 근거: `src/screens/ResultScreen.tsx`의 `useToast()` 오류 처리.
- [x] `VITE_SKIP_ANSWER_RESULT_INTERSTITIAL=true`이면 Toss 테스트앱/샌드박스 검증을 위해 보상형 광고 표시 단계를 건너뛰고 후속 흐름을 확인할 수 있게 한다.
  - 근거: `src/integrations/tossAds.ts`가 기존 skip 플래그를 보상형 광고에도 적용한다.
- [x] 재도전 횟수는 화면에 표시하지 않는다.
  - 근거: `src/screens/ResultScreen.tsx`.

## 검증 체크리스트

- [x] 정답 결과 화면에 정답 문구, 완료 문구, `rewardStatus`별 지급 상태 문구가 표시된다.
  - 근거: `npm run typecheck`, `npm run build`.
- [x] 오답 결과 화면에 오답 문구와 `광고 보고 재도전` 버튼이 표시된다.
  - 근거: `src/screens/ResultScreen.tsx`, `npm run build`.
- [x] 정답과 오답 결과 화면 모두에 `광고 보고 스크립트 보기` 버튼이 표시된다.
  - 근거: `src/screens/ResultScreen.tsx`.
- [x] 보상형 광고의 `userEarnedReward` 이벤트 전에는 `POST /api/rewarded-ad-complete`가 호출되지 않는다.
  - 근거: `src/integrations/tossAds.ts`, `functions/src/__tests__/rewardedAdComplete.test.ts`.
- [x] `VITE_SKIP_ANSWER_RESULT_INTERSTITIAL=true` 샌드박스 검증 환경에서는 광고 SDK 미지원으로 인한 실패 없이 재도전과 스크립트 보기 후속 흐름을 확인할 수 있다.
  - 근거: `src/integrations/tossAds.ts`.
- [x] 재도전 요청은 `quizDate`, `purpose = retry`를 포함한다.
  - 근거: `src/screens/ResultScreen.tsx`, `src/services/apiClient.ts`.
- [x] 재도전 성공 후 서버 상태가 `progressStatus = retry_unlocked`로 확인된다.
  - 근거: `functions/src/__tests__/rewardedAdComplete.test.ts`.
- [x] 재도전 성공 후 같은 문제 풀이 화면으로 돌아간다.
  - 근거: `src/App.tsx`.
- [x] 스크립트 요청은 `quizDate`, `purpose = script`를 포함한다.
  - 근거: `src/screens/ResultScreen.tsx`, `src/services/apiClient.ts`.
- [x] 스크립트는 `POST /api/rewarded-ad-complete`의 `purpose = script` 응답으로 받은 값만 표시된다.
  - 근거: `functions/src/services/rewardedAdComplete.ts`, `src/screens/ResultScreen.tsx`.
- [x] 광고 완료 전에는 스크립트가 화면 또는 클라이언트 상태에 노출되지 않는다.
  - 근거: `GET /api/today-quiz` 공개 응답은 `script`를 제외하고, `ResultScreen`은 `postRewardedAdComplete()` 응답만 상태에 저장한다.
- [x] 오답 사용자가 스크립트를 본 뒤에도 재도전할 수 있다.
  - 근거: `src/screens/ResultScreen.tsx`.
- [x] 광고 취소, 실패, API 실패 시 결과 화면에 머무르고 다시 시도할 수 있다.
  - 근거: `src/screens/ResultScreen.tsx`, `src/integrations/tossAds.ts`.
- [x] 타입 검사, 프론트 빌드, 관련 테스트 또는 수동 검증이 통과한다.
  - 근거: `npm run typecheck`, `npm --prefix functions run test`, `npm run build`.

## 변경 요약

- `POST /api/rewarded-ad-complete`를 구현해 보상형 광고 완료 후 재도전권과 스크립트 열람권을 서버에 기록한다.
- `ResultScreen`을 실제 결과 화면으로 연결해 정답/오답, 지급 상태, 재도전, 스크립트 보기를 처리한다.
- `showTossAd()`가 보상형 광고의 `userEarnedReward` 이벤트를 기준으로 성공 처리하도록 확장했다.
- 클라이언트 API에 `postRewardedAdComplete()` 경계를 추가했다.
- 보상형 광고 테스트 ID 예시 `VITE_TOSS_REWARDED_AD_GROUP_ID=ait-ad-test-rewarded-id`를 추가했다.

## 검증 결과

- `npm --prefix functions run test`: 통과, 28개 테스트.
- `npm run typecheck`: 통과.
- `npm run build`: 통과. Vite 번들 크기 경고는 기존처럼 발생했지만 빌드는 성공했다.

## 후속 참고 사항

- 재도전권 저장 방식: `POST /api/rewarded-ad-complete`의 `purpose = retry` 성공 시 `userProgress.progressStatus = retry_unlocked`로 저장한다.
- 스크립트 열람권 저장 방식: `purpose = script` 성공 시 `userProgress.canViewScript = true`로 저장하고, 응답에만 `script`를 포함한다.
- 실패 처리 기준: 보상 미획득, 광고/API 실패, 허용되지 않는 진행 상태는 권한을 부여하지 않고 결과 화면에 머무르게 한다.
- 09번에서는 같은 사용자와 같은 날짜에 대한 재도전권 누적 방지, 스크립트 열람권 유지, 완료/실패 상태의 중복 보상 방지 검증을 강화하면 된다.
