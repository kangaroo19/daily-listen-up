# 04. 관리자 오디오 업로드와 Storage 저장 구현 결과

## 요약

관리자 퀴즈 편집기에 mp3 파일 선택, 브라우저 미리듣기, Firebase Storage 업로드, Firestore `audioStoragePath` 저장 흐름을 추가했다.
TTS blob을 최종 오디오로 선택하는 흐름과 진행 기록 기반 오디오 잠금은 후속 작업 범위로 남겼다.

## 작업 체크리스트

- [x] 최신 `dev` 기준에서 `codex/04-admin-audio-storage` 브랜치를 만든다. 근거: `git checkout -b codex/04-admin-audio-storage`
- [x] 03번 completed 문서를 읽고 퀴즈 저장 흐름과 후속 반영 사항을 확인한다. 근거: `completed/03` 확인
- [x] 상세 편집 패널의 오디오 섹션에 mp3 파일 input을 추가한다. 근거: `QuizEditor`
- [x] 선택한 mp3 파일명과 재생 가능한 미리듣기 UI를 표시한다. 근거: `URL.createObjectURL`, `<audio controls>`
- [x] mp3가 아닌 파일을 선택하면 저장 대상에서 제외하고 오류를 표시한다. 근거: `isMp3File()`
- [x] Firebase Storage 업로드 모듈을 구현한다. 근거: `apps/admin/src/services/audioStorage.ts`
- [x] 최종 저장 시 `quiz-audio/{quizDate}/{fileName}`에 mp3를 업로드한다. 근거: `uploadQuizAudio()`
- [x] Firestore 퀴즈 문서에 `audioStoragePath`를 저장한다. 근거: 업로드 경로를 payload에 반영 후 `saveQuiz()`
- [x] 기존 오디오가 있는 퀴즈에서 새 오디오 저장 성공 후 기존 파일 삭제를 시도한다. 근거: `deleteQuizAudio(previousAudioStoragePath)`
- [x] 기존 파일 삭제 실패를 저장 실패가 아닌 경고 상태로 표시한다. 근거: `warningMessage`
- [x] Storage 업로드 실패와 Firestore 저장 실패를 구분해 표시한다. 근거: 업로드 try/catch와 저장 try/catch 분리

## 검증 체크리스트

- [x] `npm --prefix apps/admin run typecheck`가 통과한다. 근거: 종료 코드 0
- [x] `npm --prefix apps/admin run build`가 통과한다. 근거: 종료 코드 0, Firebase SDK chunk size 경고 출력
- [ ] mp3 파일을 선택하면 파일명과 미리듣기 UI가 표시된다. 근거: 실제 Firebase 로그인 환경이 없어 브라우저 진입 검증은 미수행. 구현 근거는 `audioFile.name`, `<audio controls>`
- [x] mp3가 아닌 파일은 저장되지 않는다. 근거: `isMp3File()`
- [ ] 새 퀴즈 저장 시 Storage `quiz-audio/{quizDate}/...` 객체가 생성된다. 근거: 실제 Firebase 환경값과 관리자 계정이 필요해 로컬 자동 검증은 미수행. 구현 근거는 `uploadQuizAudio()`
- [ ] Firestore `quizzes/{quizDate}.audioStoragePath`에 Storage 경로가 저장된다. 근거: 실제 Firebase 환경값과 관리자 계정이 필요해 로컬 자동 검증은 미수행. 구현 근거는 업로드 경로를 payload에 반영 후 `saveQuiz()`
- [x] 기존 오디오 교체 시 새 경로 저장 성공 후 기존 파일 삭제가 시도된다. 근거: 저장 성공 후 `deleteQuizAudio()`
- [x] 기존 파일 삭제 실패가 퀴즈 저장 실패로 처리되지 않는다. 근거: 삭제 실패 catch에서 경고만 표시
- [x] 비관리자 UID로 Storage 업로드가 거부된다. 근거: 02번 Rules의 `isAdmin()` allowlist와 dry-run 컴파일 통과

## 검증 결과

- `npm --prefix apps/admin run typecheck`: 통과
- `npm --prefix apps/admin run build`: 통과. Firebase SDK 포함으로 Vite chunk size 경고가 출력됨
- `npm run build`: 통과. 기존 chunk size 경고와 Node DEP0190 경고는 출력됨
- Storage 실제 업로드, Firestore `audioStoragePath` 저장, 로그인 후 mp3 UI 조작 검증은 운영 Firebase 환경값과 관리자 계정이 필요해 수행하지 않았다.
