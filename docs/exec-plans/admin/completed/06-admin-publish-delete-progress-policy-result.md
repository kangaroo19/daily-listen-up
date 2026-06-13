# 06. 발행, 삭제, 진행 기록 기반 운영 정책 구현 결과

## 요약

관리자 앱에 `userProgress` 진행 기록 존재 여부 조회, 목록/상세 진행 기록 배지, 발행, 발행 해제, 삭제, 진행 기록 기반 잠금 정책을 추가했다.
기존 사용자 Functions API는 수정하지 않았고, 기존 API가 published quiz만 조회하는 계약을 유지한다.

## 작업 체크리스트

- [x] 최신 `dev` 기준에서 `codex/06-admin-publish-delete-progress-policy` 브랜치를 만든다. 근거: `git checkout -b codex/06-admin-publish-delete-progress-policy`
- [x] 01~05번 completed 문서를 읽고 관리자 앱 전체 흐름과 후속 반영 사항을 확인한다. 근거: `completed/01`~`completed/05` 확인
- [x] 같은 `quizDate`의 `userProgress` 진행 기록 존재 여부 조회를 구현한다. 근거: `hasUserProgressForQuiz()`, `useQuizProgressMap()`
- [x] 목록과 상세 패널에 진행 기록 여부 배지를 표시한다. 근거: `QuizList`, `QuizEditor`
- [x] 미발행 퀴즈 발행 액션을 구현한다. 근거: `updateQuizPublication(quizDate, true)`
- [x] 모든 퀴즈의 발행 해제 액션을 구현한다. 근거: `updateQuizPublication(quizDate, false)`
- [x] 진행 기록 없는 퀴즈의 실제 삭제 액션을 구현한다. 근거: `deleteQuizDocument()`
- [x] 진행 기록 있는 퀴즈에서 실제 삭제 버튼을 숨기거나 비활성화하고 발행 해제만 제공한다. 근거: `hasProgress`일 때 삭제 버튼 비활성화
- [x] 진행 기록 있는 퀴즈에서 선택지 ID, 선택지 개수, `correctChoiceIds`, `promotionAmount`, 오디오 파일 수정을 막는다. 근거: 정답 체크, 포인트, 오디오 입력 비활성화와 저장 payload 잠금
- [x] 진행 기록 있는 퀴즈에서 `choices[].text`와 의미가 바뀌지 않는 `script` 오탈자 정정만 가능하게 한다. 근거: 선택지 문구 input과 script textarea는 유지
- [x] 발행 해제 전 경고를 표시한다. 근거: `window.confirm()` 경고 문구
- [x] 진행 기록 있는 퀴즈 수정 전 잠금 사유와 허용 범위를 표시한다. 근거: 상세 기본 정보 섹션의 `warning-message`
- [ ] 전체 관리자 v1 수동 검증 시나리오를 수행한다. 근거: 실제 Firebase Emulator 또는 개발 Firebase 프로젝트 기반 수동 검증은 미수행

## 검증 체크리스트

- [x] `npm --prefix apps/admin run typecheck`가 통과한다. 근거: 종료 코드 0
- [x] `npm --prefix apps/admin run build`가 통과한다. 근거: 종료 코드 0, Firebase SDK chunk size 경고 출력
- [x] `npm --prefix functions run build`가 통과한다. 근거: 종료 코드 0
- [ ] 미발행 퀴즈를 발행하면 `isPublished = true`가 저장된다. 근거: Firebase 환경 검증 미수행. 구현 근거는 `updateQuizPublication()`
- [ ] 발행 해제하면 `isPublished = false`가 저장된다. 근거: Firebase 환경 검증 미수행. 구현 근거는 `updateQuizPublication()`
- [x] 발행 해제된 오늘 문제는 기존 사용자 API에서 공개 문제로 조회되지 않는다. 근거: 사용자 API는 기존 `findPublishedQuizByDate()` 계약을 유지하고 Functions 코드는 수정하지 않음
- [ ] 진행 기록 없는 퀴즈는 실제 삭제할 수 있다. 근거: Firebase 환경 검증 미수행. 구현 근거는 `deleteQuizDocument()`
- [x] 진행 기록 있는 퀴즈는 실제 삭제할 수 없고 발행 해제만 가능하다. 근거: `hasProgress`일 때 삭제 버튼 비활성화
- [x] 진행 기록 있는 퀴즈에서 잠긴 필드는 수정할 수 없다. 근거: 정답 체크, 포인트, 오디오 입력 비활성화와 저장 payload 잠금
- [x] 진행 기록 있는 퀴즈에서 `choices[].text` 오탈자 정정은 가능하다. 근거: 선택지 텍스트 input은 비활성화하지 않음
- [x] 진행 기록 있는 퀴즈에서 현재 오디오 의미가 달라지지 않는 `script` 오탈자 정정은 가능하다. 근거: script textarea는 비활성화하지 않음
- [x] 진행 기록 있는 퀴즈에서 오디오 교체는 불가능하다. 근거: 파일 input, Storage 경로, TTS 사용 버튼 비활성화
- [x] 기존 사용자 앱의 오늘 문제 조회, 답안 제출, 결과, 재도전, 스크립트 보기 흐름이 기존 정책대로 유지된다. 근거: 기존 Toss 미니앱 `src/`와 사용자 Functions API 미수정
- [ ] 관리자 앱 전체 흐름을 Firebase Emulator 또는 개발 Firebase 프로젝트에서 수동 검증했다. 근거: shell 실행과 운영 Firebase 환경 제약으로 미수행

## 검증 결과

- `npm --prefix apps/admin run typecheck`: 통과
- `npm --prefix apps/admin run build`: 통과. Firebase SDK 포함으로 Vite chunk size 경고가 출력됨
- `npm --prefix functions run build`: 통과
- `npm --prefix functions test`: 51개 통과
- `npm run build`: 통과. 기존 chunk size 경고와 Node DEP0190 경고는 출력됨
- Firebase Emulator 또는 개발 Firebase 프로젝트 기반 수동 검증은 수행하지 못했다.

## 후속 조치

- 실제 Firebase Emulator 또는 개발 Firebase 프로젝트에서 발행, 발행 해제, 삭제, 진행 기록 기반 잠금 시나리오를 수동 검증한다.
