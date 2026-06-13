# 04. 관리자 오디오 업로드와 Storage 저장 구현

## 목적

관리자 앱에서 직접 선택한 mp3 파일을 Firebase Storage에 업로드하고, 퀴즈 문서의 `audioStoragePath`와 연결한다.

이 작업은 최종 오디오 저장 경로와 오디오 교체 실패 복구 기준을 구현한다. ElevenLabs TTS 미리듣기 생성은 05번 작업에서 구현한다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/admin/index.md`
- `docs/exec-plans/admin/active/03-admin-quiz-crud-editor.md`
- `docs/product-specs/admin.md`
- `docs/design-docs/admin-dashboard-ui.md`
- `docs/operations/quiz-content-seeding.md`
- `storage.rules`

## 선행 조건

- 03번 작업으로 퀴즈 편집기와 Firestore 저장 흐름이 준비되어 있어야 한다.
- 02번 작업으로 Storage Rules의 관리자 UID allowlist 정책이 준비되어 있어야 한다.

## 범위

- 관리자 앱에서 mp3 파일 input을 구현한다.
- 선택한 mp3를 미리 확인할 수 있게 한다.
- 최종 오디오를 Firebase Storage `quiz-audio/{quizDate}/{fileName}` 경로에 업로드한다.
- Firestore `quizzes/{quizDate}.audioStoragePath`에 업로드 경로를 저장한다.
- 기존 퀴즈의 오디오 교체 순서를 구현한다.
- Storage 업로드 실패, Firestore 저장 실패, 기존 파일 삭제 실패 상태를 표시한다.

## 제외 범위

- ElevenLabs TTS 미리듣기 생성은 구현하지 않는다.
- 생성된 TTS blob을 최종 오디오로 선택하는 흐름은 05번 작업에서 구현한다.
- 진행 기록이 있는 퀴즈의 오디오 교체 잠금은 06번 작업에서 최종 처리한다.
- Storage 파일 정리를 위한 별도 배치나 관리자 Function은 만들지 않는다.

## 구현 지침

- 오디오 파일은 mp3만 허용한다.
- Storage 경로는 `quiz-audio/{quizDate}/{fileName}` 형식을 따른다.
- 파일명은 기존 파일명 충돌을 피할 수 있도록 안전하게 만든다.
- 새 오디오 업로드와 Firestore `audioStoragePath` 저장이 모두 성공한 뒤 기존 Storage 오디오 파일 삭제를 시도한다.
- 기존 오디오 파일 삭제 실패는 퀴즈 저장 실패로 보지 않고 운영 정리 대상으로 표시한다.
- Firestore 저장 실패 시 새로 업로드된 파일은 화면에서 재시도 또는 운영 정리 대상으로 인지할 수 있게 한다.

## 작업 체크리스트

- [ ] 최신 `dev` 기준에서 `codex/04-admin-audio-storage` 브랜치를 만든다.
- [ ] 03번 completed 문서를 읽고 퀴즈 저장 흐름과 후속 반영 사항을 확인한다.
- [ ] 상세 편집 패널의 오디오 섹션에 mp3 파일 input을 추가한다.
- [ ] 선택한 mp3 파일명과 재생 가능한 미리듣기 UI를 표시한다.
- [ ] mp3가 아닌 파일을 선택하면 저장 대상에서 제외하고 오류를 표시한다.
- [ ] Firebase Storage 업로드 모듈을 구현한다.
- [ ] 최종 저장 시 `quiz-audio/{quizDate}/{fileName}`에 mp3를 업로드한다.
- [ ] Firestore 퀴즈 문서에 `audioStoragePath`를 저장한다.
- [ ] 기존 오디오가 있는 퀴즈에서 새 오디오 저장 성공 후 기존 파일 삭제를 시도한다.
- [ ] 기존 파일 삭제 실패를 저장 실패가 아닌 경고 상태로 표시한다.
- [ ] Storage 업로드 실패와 Firestore 저장 실패를 구분해 표시한다.

## 검증 체크리스트

- [ ] `npm --prefix apps/admin run typecheck`가 통과한다.
- [ ] `npm --prefix apps/admin run build`가 통과한다.
- [ ] mp3 파일을 선택하면 파일명과 미리듣기 UI가 표시된다.
- [ ] mp3가 아닌 파일은 저장되지 않는다.
- [ ] 새 퀴즈 저장 시 Storage `quiz-audio/{quizDate}/...` 객체가 생성된다.
- [ ] Firestore `quizzes/{quizDate}.audioStoragePath`에 Storage 경로가 저장된다.
- [ ] 기존 오디오 교체 시 새 경로 저장 성공 후 기존 파일 삭제가 시도된다.
- [ ] 기존 파일 삭제 실패가 퀴즈 저장 실패로 처리되지 않는다.
- [ ] 비관리자 UID로 Storage 업로드가 거부된다.

## 완료 후 결과 문서 작성 기준

- `docs/exec-plans/admin/completed/04-admin-audio-storage-result.md`를 작성한다.
- 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- Storage 경로와 Firestore `audioStoragePath` 저장 검증 근거를 기록한다.
- 실제 Storage 다운로드 URL, 비밀값, 관리자 UID는 결과 문서에 기록하지 않는다.

