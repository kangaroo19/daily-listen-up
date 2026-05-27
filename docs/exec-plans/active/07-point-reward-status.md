# 07. 포인트 지급과 지급 상태 조회 구현

## 목적

정답 처리 후 서버가 토스 비게임 프로모션 포인트 지급을 요청하고, 지급 결과를 `rewardGrants`와 `userProgress.rewardStatus`에 저장해 클라이언트가 지급 상태를 재조회할 수 있게 한다.
오늘 문제 진행 상태인 `progressStatus`와 포인트 지급 상태인 `rewardStatus`는 서로 다른 축으로 유지한다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/index.md`
- `docs/product-specs/backend.md`
- `docs/product-specs/result.md`
- `docs/product-specs/home.md`
- `docs/design-docs/style-guidelines.md`
- 작업 시작 시 직전 completed 문서가 존재하면 먼저 확인한다: `docs/exec-plans/completed/06-answer-submit-interstitial-result-result.md`

## 범위

- 정답 판정 이후 포인트 지급 요청을 서버에서 처리한다.
- 같은 사용자와 같은 `quizDate`에 대한 지급 기록은 `rewardGrants` 기준으로 저장한다.
- 지급 요청 전 기존 `rewardGrants`를 확인해 중복 지급을 막는 기초 흐름을 둔다.
- 지급 상태는 `pending`, `success`, `failed` 중 하나로 저장하고 `userProgress.rewardStatus`와 맞춘다.
- `GET /api/reward-status`는 오늘 문제의 `progressStatus`와 `rewardStatus`를 함께 반환한다.
- 홈과 결과 화면에서 지급 상태를 재조회할 수 있는 클라이언트 경계를 준비한다.

## 제외 범위

- 결과 화면 전체 UI, 재도전, 스크립트 보기 액션은 08번 작업에서 다룬다.
- 당일 완료, 중복 보상 방지, 지급 실패 상태의 강화 검증은 09번 작업에서 다룬다.
- Toss 포인트 지급 API의 운영 키, 프로모션 키 발급 정책, 정산/운영 모니터링은 이 작업에서 임의 확정하지 않는다.
- 지급 실패 후 고객센터 연결이나 운영자 재처리 화면은 만들지 않는다.
- 지급 실패 상태에서도 재지급을 자동 반복하는 정책은 만들지 않는다.

## 확인 필요

- Toss 비게임 프로모션 지급 API의 실제 요청/응답 필드와 멱등성 키 이름은 구현 시 공식 문서와 운영 설정을 확인해 확정한다.
- `rewardStatus = pending`을 언제 `success` 또는 `failed`로 전환할지, 동기 응답 기준인지 별도 확인 API 기준인지는 구현 시 확인한다.

## 작업 체크리스트

- [ ] 작업 시작 시 `docs/exec-plans/completed/06-answer-submit-interstitial-result-result.md`가 존재하면 먼저 읽고 정답 응답 형식과 지급 흐름 진입 위치를 반영한다.
- [ ] 정답 판정 직후 서버에서만 포인트 지급 요청 흐름에 진입한다.
- [ ] 지급 요청 전에 앱 세션의 내부 `userId`와 요청 `quizDate`를 기준으로 `rewardGrants` 기존 기록을 조회한다.
- [ ] 기존 지급 기록이 있으면 추가 지급 요청을 하지 않고 저장된 `rewardStatus`를 반환한다.
- [ ] 기존 지급 기록이 없으면 `promotionKey`, `userId`, `quizDate`, `amount`, `status`를 포함한 지급 기록을 생성한다.
- [ ] 토스 포인트 지급 요청에 필요한 민감한 값은 서버 환경 변수 또는 서버 전용 설정에서만 읽는다.
- [ ] 지급 요청 시작 시 `rewardStatus = pending`으로 저장한다.
- [ ] 지급 성공 응답이면 `rewardGrants.status`와 `userProgress.rewardStatus`를 `success`로 저장한다.
- [ ] 지급 실패 응답이면 `rewardGrants.status`와 `userProgress.rewardStatus`를 `failed`로 저장하고 `rewardReviewRequired` 기준을 남긴다.
- [ ] `POST /api/answer-result`의 정답 응답에 최신 `rewardStatus`를 포함한다.
- [ ] `GET /api/reward-status`가 앱 세션, KST 오늘 날짜, `userProgress`, `rewardGrants`를 기준으로 `progressStatus`와 `rewardStatus`를 함께 반환한다.
- [ ] 진행 기록이 없으면 `progressStatus = not_started`, 지급 기록이 없으면 `rewardStatus = none`으로 반환한다.
- [ ] 홈 시작 흐름과 결과 화면이 `GET /api/reward-status`를 호출할 수 있는 클라이언트 API 경계를 갖춘다.

## 검증 체크리스트

- [ ] 정답 제출 후 포인트 지급 요청은 클라이언트가 아니라 서버에서만 발생한다.
- [ ] 정답 제출 후 `progressStatus = completed`와 `rewardStatus`가 분리된 값으로 저장된다.
- [ ] 같은 `userId`, `quizDate`에 기존 `rewardGrants`가 있으면 추가 지급 요청이 발생하지 않는다.
- [ ] 지급 성공 시 `rewardGrants.status = success`와 `userProgress.rewardStatus = success`가 확인된다.
- [ ] 지급 실패 시 `rewardGrants.status = failed`, `userProgress.rewardStatus = failed`, `rewardReviewRequired` 기준이 확인된다.
- [ ] 지급 요청 중 또는 확인 중 상태를 `pending`으로 조회할 수 있다.
- [ ] `GET /api/reward-status`가 `progressStatus`와 `rewardStatus`를 모두 반환한다.
- [ ] 지급 기록이 없는 사용자는 `rewardStatus = none`으로 조회된다.
- [ ] 클라이언트 코드에 포인트 지급 비밀키나 Toss 서버 토큰이 노출되지 않는다.
- [ ] 타입 검사, Functions 검증, 프론트 빌드, 관련 테스트 또는 수동 검증이 통과한다.

## 완료 후 completed 문서 작성 기준

- `docs/exec-plans/completed/07-point-reward-status-result.md`를 작성한다.
- 이 active 문서의 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 각 체크 항목에는 근거가 되는 파일, 명령, 테스트 또는 수동 검증 결과를 짧게 기록한다.
- 완료하지 못한 항목은 체크하지 않고 미완료 사유와 08번 이후 작업에서 처리할 기준을 적는다.
- 08번 결과 화면 구현자가 사용할 결과 응답, 지급 상태 문구 매핑, 재조회 API 사용 기준을 후속 참고 사항에 남긴다.
