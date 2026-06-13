# 06. 발행, 삭제, 진행 기록 기반 운영 정책 구현

## 목적

관리자 앱에 퀴즈 발행, 발행 해제, 삭제, 진행 기록 기반 수정 제한을 구현하고 관리자 v1 전체 흐름을 검증한다.

이 작업은 01~05번에서 만든 관리자 앱 기능을 운영 정책 기준으로 마감하는 단계다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/admin/index.md`
- `docs/exec-plans/admin/active/05-admin-tts-preview.md`
- `docs/product-specs/admin.md`
- `docs/design-docs/admin-dashboard-ui.md`
- `docs/product-specs/backend.md`
- `docs/operations/quiz-content-seeding.md`
- `functions/src/services/answerResult.ts`
- `functions/src/services/rewardedAdComplete.ts`

## 선행 조건

- 01~05번 작업이 완료되어 관리자 앱의 인증, 퀴즈 CRUD, 오디오 업로드, TTS 미리듣기가 동작해야 한다.

## 범위

- 미발행 퀴즈 발행 액션을 구현한다.
- 모든 퀴즈의 발행 해제 액션을 구현한다.
- 진행 기록이 없는 퀴즈의 실제 삭제를 구현한다.
- 진행 기록이 있는 퀴즈는 실제 삭제 대신 발행 해제만 허용한다.
- 관리자 앱에서 같은 `quizDate`의 `userProgress` 진행 기록 존재 여부를 확인한다.
- 진행 기록이 있는 퀴즈의 수정 가능 필드를 제한한다.
- 발행 해제와 진행 기록 있는 퀴즈 수정 시 경고를 표시한다.
- 관리자 v1 전체 수동 검증을 수행한다.

## 제외 범위

- 사용자 앱 Functions API의 published-only 조회 계약을 변경하지 않는다.
- 발행 해제된 퀴즈의 기존 진행자 재도전 또는 스크립트 열람을 유지하는 별도 API를 만들지 않는다.
- 퀴즈 버전 관리, 기존 제출 재채점, 포인트 회수 또는 추가 지급 정책은 구현하지 않는다.
- `userProgress` 존재 여부 확인용 별도 Function 또는 날짜별 요약 문서는 만들지 않는다.
- 관리자 감사 로그와 다중 관리자 권한 분리는 구현하지 않는다.

## 운영 정책

- 발행은 `isPublished = true` 저장으로 처리한다.
- 발행 해제는 `isPublished = false` 저장으로 처리한다.
- 발행 해제는 긴급 중단 액션이며, 일반 사용자 앱의 오늘 문제 신규 조회뿐 아니라 기존 진행자의 재도전과 스크립트 열람도 막는다.
- 진행 기록이 없는 퀴즈는 모든 필드 수정, 오디오 교체, 발행 해제, 실제 삭제를 허용한다.
- 진행 기록이 있는 퀴즈는 선택지 ID, 선택지 개수, `correctChoiceIds`, `promotionAmount`, 오디오 파일을 수정할 수 없다.
- 진행 기록이 있는 퀴즈는 `choices[].text` 오탈자와 현재 오디오 의미가 달라지지 않는 `script` 오탈자 또는 표기 정정만 허용한다.
- 진행 기록이 있는 퀴즈는 실제 삭제할 수 없으며 발행 해제만 허용한다.

## 구현 지침

- `userProgress` 직접 조회는 같은 `quizDate`의 진행 기록 존재 여부 확인에만 사용한다.
- 진행 기록 여부는 목록과 상세 패널에 상태 배지로 표시한다.
- 잠긴 필드는 비활성화하고 잠금 사유를 해당 섹션 근처에 표시한다.
- 발행 해제와 삭제는 위험 액션으로 표시한다.
- 진행 기록이 있는 퀴즈의 발행 해제 경고에는 기존 진행자의 재도전과 스크립트 열람도 막힌다는 문구를 포함한다.
- 실제 삭제 시 Firestore 문서와 필요 시 Storage 오디오 파일 삭제를 처리한다.
- Storage 오디오 삭제 실패는 삭제 결과 문구에 별도 경고로 표시한다.

## 작업 체크리스트

- [ ] 최신 `dev` 기준에서 `codex/06-admin-publish-delete-progress-policy` 브랜치를 만든다.
- [ ] 01~05번 completed 문서를 읽고 관리자 앱 전체 흐름과 후속 반영 사항을 확인한다.
- [ ] 같은 `quizDate`의 `userProgress` 진행 기록 존재 여부 조회를 구현한다.
- [ ] 목록과 상세 패널에 진행 기록 여부 배지를 표시한다.
- [ ] 미발행 퀴즈 발행 액션을 구현한다.
- [ ] 모든 퀴즈의 발행 해제 액션을 구현한다.
- [ ] 진행 기록 없는 퀴즈의 실제 삭제 액션을 구현한다.
- [ ] 진행 기록 있는 퀴즈에서 실제 삭제 버튼을 숨기거나 비활성화하고 발행 해제만 제공한다.
- [ ] 진행 기록 있는 퀴즈에서 선택지 ID, 선택지 개수, `correctChoiceIds`, `promotionAmount`, 오디오 파일 수정을 막는다.
- [ ] 진행 기록 있는 퀴즈에서 `choices[].text`와 의미가 바뀌지 않는 `script` 오탈자 정정만 가능하게 한다.
- [ ] 발행 해제 전 경고를 표시한다.
- [ ] 진행 기록 있는 퀴즈 수정 전 잠금 사유와 허용 범위를 표시한다.
- [ ] 전체 관리자 v1 수동 검증 시나리오를 수행한다.

## 검증 체크리스트

- [ ] `npm --prefix apps/admin run typecheck`가 통과한다.
- [ ] `npm --prefix apps/admin run build`가 통과한다.
- [ ] `npm --prefix functions run build`가 통과한다.
- [ ] 미발행 퀴즈를 발행하면 `isPublished = true`가 저장된다.
- [ ] 발행 해제하면 `isPublished = false`가 저장된다.
- [ ] 발행 해제된 오늘 문제는 기존 사용자 API에서 공개 문제로 조회되지 않는다.
- [ ] 진행 기록 없는 퀴즈는 실제 삭제할 수 있다.
- [ ] 진행 기록 있는 퀴즈는 실제 삭제할 수 없고 발행 해제만 가능하다.
- [ ] 진행 기록 있는 퀴즈에서 잠긴 필드는 수정할 수 없다.
- [ ] 진행 기록 있는 퀴즈에서 `choices[].text` 오탈자 정정은 가능하다.
- [ ] 진행 기록 있는 퀴즈에서 현재 오디오 의미가 달라지지 않는 `script` 오탈자 정정은 가능하다.
- [ ] 진행 기록 있는 퀴즈에서 오디오 교체는 불가능하다.
- [ ] 기존 사용자 앱의 오늘 문제 조회, 답안 제출, 결과, 재도전, 스크립트 보기 흐름이 기존 정책대로 유지된다.
- [ ] 관리자 앱 전체 흐름을 Firebase Emulator 또는 개발 Firebase 프로젝트에서 수동 검증했다.

## 완료 후 결과 문서 작성 기준

- `docs/exec-plans/admin/completed/06-admin-publish-delete-progress-policy-result.md`를 작성한다.
- 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 발행, 발행 해제, 삭제, 진행 기록 기반 잠금, 전체 수동 검증 결과를 기록한다.
- 실제 관리자 UID, ElevenLabs API 키, voice ID, Firebase Secret 값은 결과 문서에 기록하지 않는다.
