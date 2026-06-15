# 07. JSON 기반 mp3 퀴즈 등록과 ElevenLabs TTS 제거 결과

## 요약

관리자 앱에서 TTS 미리듣기 UI와 클라이언트 service를 제거하고, `quizPool.json` 단일 객체와 일치하는 mp3 파일을 기존 퀴즈 폼에 가져오는 JSON 입력 모드를 추가했다.
Functions의 TTS preview endpoint, route 등록, 테스트, ElevenLabs Secret 정의를 제거했고, 관리자 v1 기준 문서를 mp3-only 운영 기준으로 갱신했다.

## 작업 체크리스트

- [x] 최신 `dev` 기준에서 `codex/07-admin-json-mp3-import-remove-tts` 브랜치를 만든다. 근거: `git checkout -b codex/07-admin-json-mp3-import-remove-tts`
- [x] 06번 completed 문서를 읽고 관리자 앱 전체 흐름과 후속 반영 사항을 확인한다. 근거: `docs/exec-plans/admin/completed/06-admin-publish-delete-progress-policy-result.md` 확인
- [x] TTS 관련 관리자 UI를 제거한다. 근거: `QuizEditor` 오디오 섹션에서 화자 성별, TTS 미리듣기, 이 음성 사용, TTS audio preview 제거
- [x] TTS 관련 관리자 service 코드를 제거한다. 근거: `apps/admin/src/services/ttsPreview.ts` 삭제
- [x] Functions의 TTS 미리듣기 endpoint와 route 등록을 제거한다. 근거: `functions/src/api/ttsPreview.ts` 삭제, `routes.ts` route 제거
- [x] ElevenLabs 관련 Secret/env 정의와 예시 문서를 제거하거나 mp3-only 기준으로 갱신한다. 근거: `releaseSecrets.ts`, 관리자 제품/운영/UI 기준 문서 갱신
- [x] 퀴즈 상세 패널에 수동 입력/JSON 입력 모드 전환 UI를 추가한다. 근거: `QuizEditor` 입력 방식 섹션
- [x] JSON 단일 객체 파싱과 schema 검증을 구현한다. 근거: `parseJsonQuizImport()`
- [x] `quizDate`, `audioFileName`, `script`, `choices`, `correctChoiceIds`, `promotionAmount`를 검증한다. 근거: `jsonQuizImport.ts`
- [x] `speakerGender`는 허용하되 저장 payload에서 제외한다. 근거: JSON parser는 필드를 허용하지만 `QuizFormState`와 `toQuizPayload()`에는 포함하지 않음
- [x] mp3 파일명과 `audioFileName` 일치 검증을 구현한다. 근거: `parseJsonQuizImport(jsonText, selectedAudioFileName)`
- [x] JSON 가져오기 성공 시 기존 퀴즈 폼에 값을 반영한다. 근거: `handleImportJson()`의 `setForm(result.form)`
- [x] JSON 가져오기 성공 시 선택한 mp3 파일을 기존 오디오 업로드 후보로 지정한다. 근거: `handleImportJson()`의 `applyAudioFile(jsonAudioFile as File)`
- [x] 기존 미발행 저장, 발행, 발행 해제, 삭제, 오디오 업로드 정책이 유지되는지 확인한다. 근거: 기존 `handleSubmit`, publish, unpublish, delete 흐름을 유지하고 `npm --prefix apps/admin run build` 통과
- [x] `docs/exec-plans/admin/index.md`의 ElevenLabs 기준을 mp3-only 기준으로 갱신한다. 근거: 관리자 v1 개발 기준과 범위 갱신
- [x] `docs/exec-plans/admin/completed/07-admin-json-mp3-import-remove-tts-result.md`를 작성한다. 근거: 이 문서

## 검증 체크리스트

- [x] `npm --prefix apps/admin run typecheck`가 통과한다. 근거: 종료 코드 0
- [x] `npm --prefix apps/admin run build`가 통과한다. 근거: 종료 코드 0, Firebase SDK chunk size 경고 출력
- [x] `npm --prefix functions run build`가 통과한다. 근거: 종료 코드 0
- [x] `npm --prefix functions test`가 통과한다. 근거: 47개 통과
- [x] 유효한 단일 JSON과 일치하는 mp3 파일로 기존 폼이 채워진다. 근거: `parseJsonQuizImport()` 성공 결과를 `setForm()`과 `applyAudioFile()`에 연결
- [x] 배열 JSON은 거부된다. 근거: `parseJsonQuizImport()`가 plain object가 아닌 입력을 거부
- [x] `quizDate` 누락 또는 형식 오류는 거부된다. 근거: `quizDatePattern` 검증
- [x] `audioFileName`과 선택한 mp3 파일명이 다르면 거부된다. 근거: `quiz.audioFileName !== selectedAudioFileName` 검증
- [x] `choices` 5개, 정답 ID, 포인트 검증이 기존 폼 정책과 일치한다. 근거: JSON parser와 기존 `validateQuizForm()` 기준 확인
- [x] 저장 시 Firestore 문서는 기존 `Quiz` 형태로 저장되고 `speakerGender`는 저장되지 않는다. 근거: `QuizFormState`, `toQuizPayload()`에 `speakerGender` 필드 없음
- [x] 저장 시 mp3 파일은 기존 Storage 업로드 경로 정책대로 업로드된다. 근거: JSON import가 `audioFile` 후보만 지정하고 저장은 기존 `uploadQuizAudio()` 흐름 사용
- [x] TTS 버튼, TTS service, TTS Function route, ElevenLabs env/Secret 참조가 남아 있지 않다. 근거: `rg` 확인 결과 실제 코드와 기준 문서에는 07번 작업명/05번 파일명 외 관련 참조 없음
- [x] 기존 사용자 앱의 오늘 문제 조회, 답안 제출, 결과, 재도전, 스크립트 보기 흐름이 변경되지 않는다. 근거: 사용자 앱 `src/` 미수정, 기존 Functions 사용자 API 테스트 47개 통과

## 검증 결과

- `npm --prefix apps/admin run typecheck`: 통과
- `npm --prefix apps/admin run build`: 통과. Firebase SDK 포함으로 Vite chunk size 경고가 출력됨
- `npm --prefix functions run build`: 통과
- `npm --prefix functions test`: 47개 통과
- 브라우저 확인: `http://127.0.0.1:5174/`에서 관리자 로그인 화면 로드와 콘솔 에러 없음 확인

## 미수행 검증

- 실제 Firebase Emulator 또는 개발 Firebase 프로젝트에서 JSON 가져오기 후 미발행 저장까지의 end-to-end 저장 검증은 수행하지 않았다. 현재 환경에서 관리자 로그인 계정과 Firebase 연결값이 필요하다.

## 변경 범위 기록

- TTS 제거: 관리자 UI/service, Functions endpoint/route/test, ElevenLabs Secret 정의 제거
- JSON 입력 모드: 단일 객체 파싱, mp3 파일명 일치 검증, 기존 폼 반영, 기존 오디오 업로드 후보 지정 구현
- 저장 흐름 유지: JSON 가져오기는 즉시 저장하지 않고 기존 `미발행 저장` 버튼과 Storage 업로드 흐름을 사용
- 문서 갱신: 관리자 index, 제품 스펙, 운영 가이드, 관리자 UI 기준을 mp3-only 기준으로 갱신
