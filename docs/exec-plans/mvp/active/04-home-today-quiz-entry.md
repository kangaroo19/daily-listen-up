# 04. 오늘 문제 조회와 홈 진입 분기 구현

## 목적

홈에서 사용자가 `시작하기`를 누른 뒤 로그인과 앱 세션 확보를 거쳐 오늘 문제 존재 여부와 사용자의 오늘 진행/지급 상태를 확인하게 한다.
상태에 따라 문제 풀이 화면으로 이동하거나 홈에 완료/지급 실패/준비 중 토스트를 보여준다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/index.md`
- `docs/product-specs/home.md`
- `docs/product-specs/backend.md`
- `docs/product-specs/quiz.md`
- `docs/product-specs/result.md`
- `docs/design-docs/style-guidelines.md`
- 작업 시작 시 직전 completed 문서가 존재하면 먼저 확인한다: `docs/exec-plans/completed/03-toss-login-session-result.md`
- 필요한 배경 확인용: `INTRODUCE.md`

## 범위

- 홈 화면에 제품 설명, 보조 설명, 하단 주요 액션 `시작하기`를 제품 스펙 문구 기준으로 구현한다.
- `시작하기` 클릭 후 로그인/세션 확보가 완료되면 `GET /api/check-today-quiz`를 호출한다.
- 오늘 문제가 있으면 `GET /api/reward-status`를 호출해 `progressStatus`와 `rewardStatus`를 확인한다.
- `progressStatus`가 `not_started`, `wrong`, `retry_unlocked`이면 문제 풀이 화면으로 이동할 수 있게 한다.
- `progressStatus = completed`이면 홈에 머무르고 `rewardStatus`에 맞는 토스트를 보여준다.
- 오늘 문제가 없거나 상태 확인에 실패하면 홈에 머무르고 제품 스펙의 토스트 문구를 보여준다.

## 제외 범위

- Toss 로그인과 앱 세션 발급 자체는 03번 작업 결과를 사용하고 새로 구현하지 않는다.
- 문제 풀이 화면의 오디오 재생과 선택지 UI는 05번 작업에서 다룬다.
- 답안 제출, 전면형 광고, 정답 검증, 결과 화면, 포인트 지급은 구현하지 않는다.
- 완료 사용자를 결과 화면으로 재진입시키지 않는다.
- 제품 스펙에 없는 홈 콘텐츠, 랭킹, 학습 기록, 설정 화면을 추가하지 않는다.

## 작업 체크리스트

- [ ] 작업 시작 시 `docs/exec-plans/completed/03-toss-login-session-result.md`가 존재하면 먼저 읽고 앱 세션 저장 위치와 로그인 실패 처리 기준을 반영한다.
- [ ] 홈 화면 제목을 `오늘의 영어 듣고 포인트 받기`로 표시한다.
- [ ] 홈 화면 설명 `짧은 영어 음성을 듣고 문제를 맞히면 토스 포인트 보상에 도전할 수 있어요.`를 표시한다.
- [ ] 홈 화면 보조 설명 `하루에 한 문제만 제공돼요.`를 표시한다.
- [ ] 하단 주요 CTA `시작하기`를 TDS 우선 기준으로 배치한다.
- [ ] `시작하기` 클릭 시 03번 작업의 로그인/앱 세션 확보 흐름을 호출한다.
- [ ] 앱 세션 확보 후 `GET /api/check-today-quiz`를 호출한다.
- [ ] `hasTodayQuiz = false`이면 홈에 머무르고 `오늘의 문제가 아직 준비되지 않았어요.` 토스트를 보여준다.
- [ ] `hasTodayQuiz = true`이면 `GET /api/reward-status`를 호출한다.
- [ ] `progressStatus`가 `not_started`, `wrong`, `retry_unlocked`이면 문제 풀이 화면 경로로 이동한다.
- [ ] `progressStatus = completed`이고 `rewardStatus = failed`이면 홈에 머무르고 `포인트 지급 확인이 필요해요` 토스트를 보여준다.
- [ ] `progressStatus = completed`이고 `rewardStatus`가 `failed`가 아니면 홈에 머무르고 `오늘 문제풀이를 완료했습니다` 토스트를 보여준다.
- [ ] 로그인 실패, 오늘 문제 확인 실패, 지급 상태 확인 실패 시 홈에 머무르고 제품 스펙의 실패 토스트를 보여준다.
- [ ] 요청 처리 중에는 `시작하기` 버튼을 비활성화해 중복 클릭을 막는다.

## 검증 체크리스트

- [ ] 홈 화면이 모바일 WebView 기준으로 한 화면의 주요 목적과 하단 CTA를 명확히 보여준다.
- [ ] `시작하기` 클릭 후 로그인, `GET /api/check-today-quiz`, `GET /api/reward-status`가 제품 스펙 순서대로 호출된다.
- [ ] 오늘 문제가 없을 때 문제 풀이 화면으로 이동하지 않고 준비 중 토스트가 표시된다.
- [ ] `progressStatus = not_started`일 때 문제 풀이 화면으로 이동한다.
- [ ] `progressStatus = wrong`일 때 문제 풀이 화면으로 이동한다.
- [ ] `progressStatus = retry_unlocked`일 때 문제 풀이 화면으로 이동한다.
- [ ] `progressStatus = completed`, `rewardStatus = failed`일 때 홈에 머무르고 지급 실패 토스트가 표시된다.
- [ ] `progressStatus = completed`, `rewardStatus = success` 또는 `pending`일 때 홈에 머무르고 완료 토스트가 표시된다.
- [ ] 로그인 취소 또는 API 실패 시 홈에서 다시 시도할 수 있다.
- [ ] 타입 검사, 프론트 빌드, 관련 테스트 또는 수동 검증이 통과한다.

## 완료 후 completed 문서 작성 기준

- `docs/exec-plans/completed/04-home-today-quiz-entry-result.md`를 작성한다.
- 이 active 문서의 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 각 체크 항목에는 근거가 되는 파일, 명령, 테스트 또는 수동 검증 결과를 짧게 기록한다.
- 완료하지 못한 항목은 체크하지 않고 미완료 사유와 05번 작업에서 영향을 받는 부분을 적는다.
- 05번 퀴즈 UI 구현자가 사용할 문제 풀이 화면 경로, 전달 상태, 앱 세션 사용 방식이 있으면 후속 참고 사항에 남긴다.
