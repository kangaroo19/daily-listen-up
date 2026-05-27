# 09. 당일 완료/중복 보상 방지와 상태 모델 강화

## 목적

서버 기준으로 당일 학습 완료, 재도전권 소진, 스크립트 열람권, 포인트 하루 1회 지급을 검증 가능하게 강화한다.
완료 사용자는 홈 재진입 시 결과 화면이나 문제 풀이 화면으로 이동하지 않고 홈 토스트만 보도록 `progressStatus`와 `rewardStatus` 기준을 일관되게 적용한다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/index.md`
- `docs/product-specs/backend.md`
- `docs/product-specs/home.md`
- `docs/product-specs/quiz.md`
- `docs/product-specs/result.md`
- `docs/design-docs/style-guidelines.md`
- 작업 시작 시 직전 completed 문서가 존재하면 먼저 확인한다: `docs/exec-plans/completed/08-result-retry-script-result.md`

## 범위

- `progressStatus`와 `rewardStatus`를 분리한 상태 모델을 서버 API 전반에서 일관되게 검증한다.
- 서버 KST 기준 `quizDate`와 클라이언트가 보관한 `quizDate` 사용 기준을 점검한다.
- `progressStatus = completed` 사용자는 문제 풀이와 추가 제출로 진입하지 못하게 한다.
- 재도전은 `progressStatus = retry_unlocked`에서만 제출 가능하고 제출 시 `wrong` 또는 `completed`로 전환되게 한다.
- 보상형 광고 1회는 재도전권 1회만 제공하며 누적되지 않게 한다.
- 같은 사용자와 같은 날짜에 대한 포인트 지급은 `rewardGrants` 기준으로 한 번만 허용한다.
- 지급 실패 상태에서도 학습 완료와 중복 지급 방지 기준을 유지한다.
- 서버 테스트 또는 Emulator 검증으로 당일 완료, 중복 보상 방지, 지급 실패 상태를 확인할 수 있게 한다.

## 제외 범위

- 새로운 화면, 새 보상 정책, 관리자 재처리 도구는 만들지 않는다.
- 포인트 지급 실패 후 운영 재지급 또는 고객센터 상세 플로우는 만들지 않는다.
- MVP 범위를 넘는 장기 통계, 연속 학습, 히스토리 화면은 추가하지 않는다.
- Firestore 인덱스와 보안 규칙은 검증에 필요한 범위를 넘겨 임의 확정하지 않는다.

## 확인 필요

- `rewardStatus = failed` 상태에서 운영자가 수동 재처리할 수 있는 별도 백오피스가 필요한지는 MVP 범위 밖으로 보이며, 향후 정책 확인이 필요하다.
- `pending` 상태가 장시간 유지될 때 홈 토스트와 결과 화면 안내를 어떻게 갱신할지는 07번 completed 결과와 운영 정책 확인이 필요하다.

## 작업 체크리스트

- [ ] 작업 시작 시 `docs/exec-plans/completed/08-result-retry-script-result.md`가 존재하면 먼저 읽고 재도전권, 스크립트 열람권, 실패 처리 기준을 반영한다.
- [ ] 서버 API에서 `progressStatus`와 `rewardStatus`를 서로 다른 축으로 다루는지 점검한다.
- [ ] `GET /api/reward-status`가 완료 사용자에게 `progressStatus = completed`와 최신 `rewardStatus`를 함께 반환하게 유지한다.
- [ ] 홈 시작 흐름이 `progressStatus = completed`이면 문제 풀이 또는 결과 화면으로 이동하지 않게 한다.
- [ ] 홈 시작 흐름이 `progressStatus = completed`, `rewardStatus = failed`이면 `포인트 지급 확인이 필요해요` 토스트만 보여주게 한다.
- [ ] 홈 시작 흐름이 `progressStatus = completed`, `rewardStatus != failed`이면 `오늘 문제풀이를 완료했습니다` 토스트만 보여주게 한다.
- [ ] `GET /api/today-quiz` 또는 문제 풀이 진입 경계에서 완료 사용자가 문제 데이터를 다시 받아 풀이로 진입하지 못하게 한다.
- [ ] `POST /api/answer-result`에서 `progressStatus = completed`인 사용자의 추가 제출을 거부한다.
- [ ] `POST /api/answer-result`에서 `progressStatus = wrong`인 사용자의 광고 보상 없는 재제출을 거부한다.
- [ ] `POST /api/answer-result`에서 `progressStatus = retry_unlocked` 제출 시 재도전권을 소진한다.
- [ ] `POST /api/rewarded-ad-complete`의 `purpose = retry`는 재도전권을 누적하지 않고 `retry_unlocked` 상태만 보장한다.
- [ ] `POST /api/rewarded-ad-complete`의 `purpose = script`는 스크립트 열람권과 `script` 응답만 다루고 재도전권을 부여하지 않는다.
- [ ] `rewardGrants`는 같은 `userId`, `quizDate`에 대해 중복 지급 요청이 발생하지 않도록 확인한다.
- [ ] 지급 실패 상태에서도 `progressStatus = completed`를 유지하고 추가 지급 자동 재시도를 하지 않는다.
- [ ] 서버 KST 기준 오늘 날짜와 요청 `quizDate`가 어긋난 경우의 처리 기준을 테스트 또는 문서에 남긴다.

## 검증 체크리스트

- [ ] 완료 사용자가 홈에서 다시 `시작하기`를 눌러도 결과 화면으로 이동하지 않는다.
- [ ] 완료 사용자가 홈에서 다시 `시작하기`를 눌러도 문제 풀이 화면으로 이동하지 않는다.
- [ ] 완료 사용자의 `rewardStatus = failed` 상태는 홈에서 지급 실패 토스트로 확인된다.
- [ ] 완료 사용자의 `rewardStatus = success` 또는 `pending` 상태는 홈에서 완료 토스트로 확인된다.
- [ ] 완료 사용자가 `POST /api/answer-result`를 다시 호출하면 서버가 거부한다.
- [ ] `wrong` 상태 사용자가 보상형 광고 없이 다시 제출하면 서버가 거부한다.
- [ ] `retry_unlocked` 상태 사용자가 제출하면 재도전권이 소진된다.
- [ ] 보상형 광고를 여러 번 완료해도 재도전권이 누적 횟수로 저장되지 않는다.
- [ ] `purpose = script` 보상은 스크립트 열람권만 부여하고 재도전 제출 가능 상태를 임의로 만들지 않는다.
- [ ] 같은 `userId`, `quizDate`에 포인트 지급 요청이 두 번 발생하지 않는다.
- [ ] 지급 실패 상태에서도 같은 날짜의 추가 지급 요청이 자동으로 반복되지 않는다.
- [ ] 서버 테스트 또는 Emulator 검증으로 당일 완료, 중복 보상 방지, 지급 실패 상태를 재현할 수 있다.
- [ ] 타입 검사, Functions 검증, 프론트 빌드, 관련 테스트 또는 수동 검증이 통과한다.

## 완료 후 completed 문서 작성 기준

- `docs/exec-plans/completed/09-daily-completion-duplicate-guard-result.md`를 작성한다.
- 이 active 문서의 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 각 체크 항목에는 근거가 되는 파일, 명령, 테스트 또는 수동 검증 결과를 짧게 기록한다.
- 완료하지 못한 항목은 체크하지 않고 미완료 사유와 10번 MVP 완료 검증에서 다시 확인할 기준을 적는다.
- 10번 최종 검증자가 사용할 전체 상태 전이 표, 테스트 계정/샘플 데이터, 남은 확인 필요 항목을 후속 참고 사항에 남긴다.
