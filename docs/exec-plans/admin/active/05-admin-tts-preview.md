# 05. ElevenLabs TTS 미리듣기 구현

## 목적

관리자 앱에서 스크립트와 화자 성별을 기준으로 ElevenLabs TTS 미리듣기 mp3를 생성하고, 생성된 음성을 최종 오디오 후보로 선택할 수 있게 한다.

이 작업은 API 키 보호를 위해 최소 Firebase Function을 추가한다. TTS Function은 미리듣기 생성만 담당하며 Firestore 문서 생성, 수정, 삭제, 발행 또는 Storage 업로드를 처리하지 않는다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/admin/index.md`
- `docs/exec-plans/admin/active/04-admin-audio-storage.md`
- `docs/product-specs/admin.md`
- `docs/design-docs/admin-dashboard-ui.md`
- `docs/operations/quiz-content-seeding.md`
- `functions/package.json`
- `functions/src/api/routes.ts`
- `functions/src/config`

## 선행 조건

- 04번 작업으로 관리자 앱의 최종 오디오 업로드 흐름이 준비되어 있어야 한다.
- 02번 작업으로 관리자 Auth ID token을 사용할 수 있어야 한다.

## 범위

- Firebase Function에 관리자 전용 TTS 미리듣기 엔드포인트를 추가한다.
- Function은 Firebase Auth ID token을 검증한다.
- Function은 관리자 UID allowlist를 검증한다.
- Function은 `script`와 `speakerGender`만 입력으로 받는다.
- Function은 ElevenLabs API를 호출해 mp3를 생성한다.
- Function은 `audio/mpeg` blob 응답을 반환한다.
- 관리자 앱은 blob을 재생하고, `이 음성 사용`으로 최종 업로드 대상으로 지정할 수 있다.
- TTS 실패 시 직접 mp3 업로드로 대체할 수 있게 한다.

## 제외 범위

- Function에서 Firestore에 퀴즈 문서를 저장하지 않는다.
- Function에서 Storage에 미리듣기 파일을 저장하지 않는다.
- Function에서 퀴즈 등록, 수정, 삭제, 발행 API를 만들지 않는다.
- ElevenLabs API 키와 voice ID 실제 값을 저장소에 기록하지 않는다.
- TTS 생성 비용/사용량 대시보드는 구현하지 않는다.

## 구현 지침

- ElevenLabs API 키와 성별별 voice ID는 Firebase Secret 또는 서버 전용 환경변수로만 읽는다.
- 관리자 앱은 Firebase Auth ID token과 함께 `script`, `speakerGender`를 전달한다.
- `speakerGender`는 `female` 또는 `male`만 허용한다.
- 응답은 `audio/mpeg`로 반환한다.
- 미리듣기 blob은 브라우저에서 재생만 하고, 최종 저장 시 관리자 앱이 Storage에 업로드한다.
- TTS 실패는 퀴즈 저장 흐름 전체를 막지 않는다.
- 실패 상태는 오디오 섹션 가까이에 표시하고 직접 mp3 업로드 대체 경로를 보여준다.

## 작업 체크리스트

- [ ] 최신 `dev` 기준에서 `codex/05-admin-tts-preview` 브랜치를 만든다.
- [ ] 04번 completed 문서를 읽고 오디오 저장 흐름과 후속 반영 사항을 확인한다.
- [ ] Functions 쪽에 TTS 미리듣기 엔드포인트를 추가한다.
- [ ] TTS Function에서 Firebase Auth ID token을 검증한다.
- [ ] TTS Function에서 관리자 UID allowlist를 검증한다.
- [ ] TTS Function에서 `script`와 `speakerGender` 입력을 검증한다.
- [ ] ElevenLabs API 키와 voice ID를 Secret 또는 서버 전용 환경변수에서 읽는다.
- [ ] ElevenLabs 호출 결과를 `audio/mpeg` 응답으로 반환한다.
- [ ] 관리자 앱 오디오 섹션에 `TTS 미리듣기` 액션을 추가한다.
- [ ] 생성된 blob을 브라우저에서 재생할 수 있게 한다.
- [ ] `이 음성 사용` 액션으로 생성된 blob을 최종 오디오 대상으로 지정한다.
- [ ] TTS 실패 상태와 직접 mp3 업로드 대체 흐름을 표시한다.
- [ ] 실제 API 키와 실제 voice ID가 저장소에 남지 않았는지 확인한다.

## 검증 체크리스트

- [ ] `npm --prefix apps/admin run typecheck`가 통과한다.
- [ ] `npm --prefix apps/admin run build`가 통과한다.
- [ ] `npm --prefix functions run build`가 통과한다.
- [ ] 관리자 Auth ID token 없이 TTS Function 호출이 거부된다.
- [ ] 비관리자 UID로 TTS Function 호출이 거부된다.
- [ ] 잘못된 `speakerGender` 값은 거부된다.
- [ ] 유효한 `script`와 `speakerGender`로 mp3 blob 응답을 받을 수 있다.
- [ ] 관리자 앱에서 생성된 TTS 미리듣기를 재생할 수 있다.
- [ ] `이 음성 사용` 후 저장하면 생성된 mp3가 최종 오디오로 Storage에 업로드된다.
- [ ] TTS 실패 시 직접 mp3 업로드로 저장을 계속할 수 있다.
- [ ] 클라이언트 번들, `.env.example`, 결과 문서에 ElevenLabs API 키와 실제 voice ID가 없다.

## 완료 후 결과 문서 작성 기준

- `docs/exec-plans/admin/completed/05-admin-tts-preview-result.md`를 작성한다.
- 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- TTS Function 인증, blob 응답, 관리자 앱 재생, 최종 업로드 검증 근거를 기록한다.
- ElevenLabs API 키, voice ID, Firebase Secret 값은 결과 문서에 기록하지 않는다.

