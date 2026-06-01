# 08. 결과 화면, 재도전, 스크립트 보기 구현

## 목적

결과 화면에서 사용자가 정답/오답과 포인트 지급 상태를 확인하고, 오답이면 보상형 광고 완료 후 같은 문제에 재도전하며, 정답과 오답 상태 모두에서 보상형 광고 완료 후 스크립트를 볼 수 있게 한다.
재도전과 스크립트 열람은 `POST /api/rewarded-ad-complete`와 `quizDate`를 기준으로 서버가 기록한다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/index.md`
- `docs/product-specs/result.md`
- `docs/product-specs/quiz.md`
- `docs/product-specs/backend.md`
- `docs/product-specs/home.md`
- `docs/design-docs/style-guidelines.md`
- 작업 시작 시 직전 completed 문서가 존재하면 먼저 확인한다: `docs/exec-plans/completed/07-point-reward-status-result.md`

## 범위

- `POST /api/answer-result` 응답을 기준으로 결과 화면에 정답 또는 오답 상태를 표시한다.
- 정답 상태에서는 오늘 학습 완료 안내와 `rewardStatus`에 따른 포인트 지급 상태 문구를 표시한다.
- 오답 상태에서는 `광고 보고 재도전` 버튼을 제공한다.
- 정답과 오답 상태 모두에서 `광고 보고 스크립트 보기` 버튼을 제공한다.
- 보상형 광고의 `userEarnedReward` 이벤트 이후 `POST /api/rewarded-ad-complete`를 호출한다.
- `purpose = retry`이면 서버가 `progressStatus = retry_unlocked`를 기록하고 같은 문제 풀이 화면으로 돌아간다.
- `purpose = script`이면 서버 응답의 `script`를 같은 결과 화면 안에 펼쳐 보여준다.
- 광고 실패 또는 취소 시 결과 화면에 머무르고 다시 시도할 수 있게 한다.

## 제외 범위

- 답안 제출과 전면형 광고 이후 정답 검증은 06번 작업 결과를 사용한다.
- 포인트 지급 요청과 지급 상태 저장은 07번 작업 결과를 사용한다.
- 당일 완료, 중복 보상 방지, 상태 모델 강화 검증은 09번 작업에서 다룬다.
- 완료 사용자의 홈 재진입 차단 흐름은 04번과 09번 기준을 사용하고, 이 작업에서 홈 정책을 새로 만들지 않는다.
- 스크립트를 광고 완료 전에 미리 내려받거나 클라이언트에 숨겨두지 않는다.

## 확인 필요

- Toss Ads 보상형 광고 SDK의 실제 `userEarnedReward` 이벤트명과 실패/취소 이벤트명은 구현 시 사용 중인 SDK 문서를 확인해 확정한다.
- 결과 화면에서 지급 상태를 주기적으로 재조회할지, 진입 시점 응답만 표시할지는 07번 completed 결과와 구현 시 확인한다.
- Toss 테스트앱/샌드박스앱에서는 인앱광고 기능을 사용할 수 없으므로, 샌드박스 검증 시 `.env.local`의 `VITE_SKIP_ANSWER_RESULT_INTERSTITIAL=true` 값을 사용해 광고 표시 단계를 건너뛴다.

## 작업 체크리스트

- [ ] 작업 시작 시 `docs/exec-plans/completed/07-point-reward-status-result.md`가 존재하면 먼저 읽고 결과 응답, 지급 상태 문구 매핑, 재조회 기준을 반영한다.
- [ ] 결과 화면 진입 시 `POST /api/answer-result` 응답의 정답 여부, `progressStatus`, `rewardStatus`, `quizDate`를 사용한다.
- [ ] 정답이면 제목 `정답이에요`와 안내 `포인트 보상 상태를 확인해 주세요.`를 표시한다.
- [ ] 정답 직후 완료 상태를 `오늘 학습을 완료했어요`, `내일 새로운 문제로 다시 만나요.` 문구로 표현한다.
- [ ] `rewardStatus = pending`이면 `포인트 지급을 확인하고 있어요.`를 표시한다.
- [ ] `rewardStatus = success`이면 `포인트 지급이 완료됐어요.`를 표시한다.
- [ ] `rewardStatus = failed`이면 `포인트 지급을 완료하지 못했어요. 잠시 후 다시 확인하거나 고객센터에 문의해 주세요.`를 표시한다.
- [ ] 오답이면 제목 `아쉬워요`와 안내 `광고를 보고 같은 문제에 다시 도전할 수 있어요.`를 표시한다.
- [ ] 오답 상태에서 `광고 보고 재도전` 버튼을 제공한다.
- [ ] 정답과 오답 상태 모두에서 `광고 보고 스크립트 보기` 버튼을 제공한다.
- [ ] `광고 보고 재도전` 클릭 시 보상형 광고를 열고 `userEarnedReward` 이후 `POST /api/rewarded-ad-complete`에 `quizDate`, `purpose = retry`를 전달한다.
- [ ] `purpose = retry` 성공 응답 후 같은 문제 풀이 화면으로 이동하고 새 시도에서 오디오를 다시 1회 들을 수 있게 한다.
- [ ] `광고 보고 스크립트 보기` 클릭 시 보상형 광고를 열고 `userEarnedReward` 이후 `POST /api/rewarded-ad-complete`에 `quizDate`, `purpose = script`를 전달한다.
- [ ] `purpose = script` 성공 응답의 `script`를 같은 결과 화면 안에 펼쳐 보여준다.
- [ ] 스크립트 보기 후에도 오답 사용자는 재도전할 수 있게 유지한다.
- [ ] 보상형 광고 취소, 실패, API 실패 시 결과 화면에 머무르고 `광고를 완료하지 못했어요. 다시 시도해 주세요.` 안내를 보여준다.
- [ ] `VITE_SKIP_ANSWER_RESULT_INTERSTITIAL=true`이면 Toss 테스트앱/샌드박스 검증을 위해 보상형 광고 표시 단계를 건너뛰고 후속 흐름을 확인할 수 있게 한다.
- [ ] 재도전 횟수는 화면에 표시하지 않는다.

## 검증 체크리스트

- [ ] 정답 결과 화면에 정답 문구, 완료 문구, `rewardStatus`별 지급 상태 문구가 표시된다.
- [ ] 오답 결과 화면에 오답 문구와 `광고 보고 재도전` 버튼이 표시된다.
- [ ] 정답과 오답 결과 화면 모두에 `광고 보고 스크립트 보기` 버튼이 표시된다.
- [ ] 보상형 광고의 `userEarnedReward` 이벤트 전에는 `POST /api/rewarded-ad-complete`가 호출되지 않는다.
- [ ] `VITE_SKIP_ANSWER_RESULT_INTERSTITIAL=true` 샌드박스 검증 환경에서는 광고 SDK 미지원으로 인한 실패 없이 재도전과 스크립트 보기 후속 흐름을 확인할 수 있다.
- [ ] 재도전 요청은 `quizDate`, `purpose = retry`를 포함한다.
- [ ] 재도전 성공 후 서버 상태가 `progressStatus = retry_unlocked`로 확인된다.
- [ ] 재도전 성공 후 같은 문제 풀이 화면으로 돌아간다.
- [ ] 스크립트 요청은 `quizDate`, `purpose = script`를 포함한다.
- [ ] 스크립트는 `POST /api/rewarded-ad-complete`의 `purpose = script` 응답으로 받은 값만 표시된다.
- [ ] 광고 완료 전에는 스크립트가 화면 또는 클라이언트 상태에 노출되지 않는다.
- [ ] 오답 사용자가 스크립트를 본 뒤에도 재도전할 수 있다.
- [ ] 광고 취소, 실패, API 실패 시 결과 화면에 머무르고 다시 시도할 수 있다.
- [ ] 타입 검사, 프론트 빌드, 관련 테스트 또는 수동 검증이 통과한다.

## 완료 후 completed 문서 작성 기준

- `docs/exec-plans/completed/08-result-retry-script-result.md`를 작성한다.
- 이 active 문서의 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 각 체크 항목에는 근거가 되는 파일, 명령, 테스트 또는 수동 검증 결과를 짧게 기록한다.
- 완료하지 못한 항목은 체크하지 않고 미완료 사유와 09번 작업에서 처리할 기준을 적는다.
- 09번 상태 모델 강화 구현자가 사용할 재도전권 저장 방식, 스크립트 열람권 저장 방식, 실패 처리 기준을 후속 참고 사항에 남긴다.
