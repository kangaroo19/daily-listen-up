# 06. 답안 제출, 전면형 광고, 정답 검증 구현

## 목적

문제 풀이 화면의 선택 답안을 결과 확인 전면형 광고 이후 서버에 제출하고, 서버가 `quizDate`, 선택 답안, 현재 `progressStatus`를 기준으로 제출 가능 여부와 정답 여부를 검증하게 한다.
이 작업은 결과 화면으로 이동하기 전에 정답/오답, `progressStatus`, `rewardStatus`를 확정해 다음 흐름이 서버 기준 상태를 따르도록 만드는 작업이다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/index.md`
- `docs/product-specs/quiz.md`
- `docs/product-specs/result.md`
- `docs/product-specs/backend.md`
- `docs/design-docs/style-guidelines.md`
- 작업 시작 시 직전 completed 문서가 존재하면 먼저 확인한다: `docs/exec-plans/completed/05-audio-multiple-choice-quiz-result.md`

## 범위

- 문제 풀이 화면의 `답안 제출` 버튼을 결과 확인 전면형 광고 흐름에 연결한다.
- 전면형 광고의 `dismissed` 이벤트 이후에만 `POST /api/answer-result`를 호출한다.
- `POST /api/answer-result` 요청에는 `GET /api/today-quiz`에서 받은 `quizDate`와 사용자가 선택한 답안 목록을 포함한다.
- 서버는 앱 세션, 요청 `quizDate`, 공개 문제, 현재 `progressStatus`를 기준으로 제출 가능 여부를 검증한다.
- 서버는 저장된 `correctChoiceIds`와 선택 답안이 정확히 일치하는지 채점한다.
- 첫 제출은 `progressStatus = not_started`에서만 허용한다.
- 재제출은 `progressStatus = retry_unlocked`에서만 허용하고, 제출 처리 시 재도전권을 소진한다.
- 응답의 정답 여부, `progressStatus`, `rewardStatus`를 결과 화면 진입 상태로 전달한다.

## 제외 범위

- 포인트 지급 요청의 세부 구현과 지급 상태 재조회 강화는 07번 작업에서 다룬다.
- 결과 화면의 재도전, 스크립트 보기, 결과 UI 완성은 08번 작업에서 다룬다.
- 당일 완료와 중복 보상 방지의 서버 검증 강화는 09번 작업에서 다룬다.
- 광고 SDK의 운영 광고 단위, 정책 세부값, 실매체 설정값은 이 작업에서 임의 확정하지 않는다.
- 클라이언트에서 정답 목록, 스크립트, 포인트 금액을 요구하거나 노출하지 않는다.

## 확인 필요

- Toss Ads 전면형 광고 SDK의 실제 이벤트명과 실패/취소 이벤트명은 구현 시 사용 중인 SDK 문서와 01~05번 completed 결과를 확인해 확정한다.
- 전면형 광고가 로드되지 않거나 표시 실패한 경우 제출을 차단할지, 재시도 UI만 제공할지는 제품 스펙에 더 명확한 기준이 없으므로 구현 시 확인한다.

## 작업 체크리스트

- [ ] 작업 시작 시 `docs/exec-plans/completed/05-audio-multiple-choice-quiz-result.md`가 존재하면 먼저 읽고 `quizDate`, 선택 답안 상태, 제출 버튼 연결 위치를 반영한다.
- [ ] 문제 풀이 화면의 `답안 제출` 버튼이 선택 답안 1개 이상과 오디오 청취 완료 상태에서만 눌리게 유지한다.
- [ ] `답안 제출` 클릭 시 결과 확인 전면형 광고를 연다.
- [ ] 전면형 광고가 `dismissed` 이벤트를 발생시키기 전에는 `POST /api/answer-result`를 호출하지 않는다.
- [ ] `dismissed` 이벤트 이후 앱 세션 토큰, `quizDate`, 선택 답안 목록으로 `POST /api/answer-result`를 호출한다.
- [ ] 제출 중에는 중복 클릭과 중복 API 호출을 막는다.
- [ ] 서버는 앱 세션 토큰을 확인하고 내부 `userId`를 확보한다.
- [ ] 서버는 요청의 `quizDate`에 해당하는 공개 문제를 조회한다.
- [ ] 서버는 현재 `userProgress.progressStatus`를 조회하고 제출 가능 상태인지 검증한다.
- [ ] `progressStatus = not_started`이면 첫 제출로 허용한다.
- [ ] `progressStatus = retry_unlocked`이면 재제출로 허용하고 제출 처리와 함께 재도전권을 소진한다.
- [ ] `progressStatus = wrong`이면 보상형 광고 없이 재제출할 수 없도록 거부한다.
- [ ] `progressStatus = completed`이면 추가 제출을 거부한다.
- [ ] 서버는 선택 답안과 `correctChoiceIds`가 정확히 일치하는지 채점한다.
- [ ] 오답이면 `userProgress`를 `progressStatus = wrong`, `rewardStatus = none` 기준으로 저장한다.
- [ ] 정답이면 `userProgress`를 `progressStatus = completed` 기준으로 저장하고 포인트 지급 흐름에 진입할 수 있는 응답을 만든다.
- [ ] API 응답은 정답 여부, `progressStatus`, `rewardStatus`를 포함한다.
- [ ] API 응답을 받은 뒤 결과 화면으로 이동하고 응답 상태를 전달한다.
- [ ] API 실패 또는 광고 실패/취소 시 같은 문제 풀이 화면에서 재시도할 수 있게 한다.

## 검증 체크리스트

- [ ] 전면형 광고의 `dismissed` 이벤트 전에는 `POST /api/answer-result`가 호출되지 않는다.
- [ ] `POST /api/answer-result` 요청에 `quizDate`와 선택 답안 목록이 포함된다.
- [ ] `progressStatus = not_started`에서 첫 제출이 성공한다.
- [ ] `progressStatus = retry_unlocked`에서 재제출이 성공하고 제출 후 재도전권이 소진된다.
- [ ] `progressStatus = wrong`에서 광고 보상 없이 재제출하면 서버가 거부한다.
- [ ] `progressStatus = completed`에서 추가 제출하면 서버가 거부한다.
- [ ] 정답 선택지와 선택 답안이 정확히 일치할 때만 정답으로 판정된다.
- [ ] 오답 제출 후 서버 상태가 `progressStatus = wrong`, `rewardStatus = none`으로 확인된다.
- [ ] 정답 제출 후 서버 응답에 `progressStatus = completed`와 지급 흐름에 필요한 `rewardStatus`가 포함된다.
- [ ] 결과 화면 진입은 서버 응답을 받은 뒤에만 발생한다.
- [ ] 클라이언트 코드와 네트워크 응답에 `correctChoiceIds`, `script`, 원본 `audioStoragePath`가 노출되지 않는다.
- [ ] 타입 검사, Functions 검증, 프론트 빌드, 관련 테스트 또는 수동 검증이 통과한다.

## 완료 후 completed 문서 작성 기준

- `docs/exec-plans/completed/06-answer-submit-interstitial-result-result.md`를 작성한다.
- 이 active 문서의 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 각 체크 항목에는 근거가 되는 파일, 명령, 테스트 또는 수동 검증 결과를 짧게 기록한다.
- 완료하지 못한 항목은 체크하지 않고 미완료 사유와 07번 이후 작업에서 처리할 기준을 적는다.
- 07번 포인트 지급 구현자가 사용할 정답 응답 형식, `rewardStatus` 초기값, 지급 흐름 진입 위치를 후속 참고 사항에 남긴다.
