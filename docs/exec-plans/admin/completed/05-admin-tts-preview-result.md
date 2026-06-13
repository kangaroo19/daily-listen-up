# 05. ElevenLabs TTS 미리듣기 구현 결과

## 요약

Firebase Function에 관리자 전용 TTS 미리듣기 엔드포인트를 추가하고, 관리자 앱 오디오 섹션에서 스크립트/화자 성별 기반 TTS blob을 재생한 뒤 최종 오디오 후보로 선택할 수 있게 했다.
Function은 Firestore/Storage 저장을 하지 않고 `audio/mpeg` 응답만 반환한다.

## 작업 체크리스트

- [x] 최신 `dev` 기준에서 `codex/05-admin-tts-preview` 브랜치를 만든다. 근거: `git checkout -b codex/05-admin-tts-preview`
- [x] 04번 completed 문서를 읽고 오디오 저장 흐름과 후속 반영 사항을 확인한다. 근거: `completed/04` 확인
- [x] Functions 쪽에 TTS 미리듣기 엔드포인트를 추가한다. 근거: `functions/src/api/ttsPreview.ts`, `routes.ts`
- [x] TTS Function에서 Firebase Auth ID token을 검증한다. 근거: `verifyIdToken`
- [x] TTS Function에서 관리자 UID allowlist를 검증한다. 근거: `ADMIN_UID_ALLOWLIST`
- [x] TTS Function에서 `script`와 `speakerGender` 입력을 검증한다. 근거: `invalid_script`, `invalid_speaker_gender`
- [x] ElevenLabs API 키와 voice ID를 Secret 또는 서버 전용 환경변수에서 읽는다. 근거: `releaseSecrets.ts`
- [x] ElevenLabs 호출 결과를 `audio/mpeg` 응답으로 반환한다. 근거: `content-type: audio/mpeg`
- [x] 관리자 앱 오디오 섹션에 `TTS 미리듣기` 액션을 추가한다. 근거: `QuizEditor`
- [x] 생성된 blob을 브라우저에서 재생할 수 있게 한다. 근거: `URL.createObjectURL(blob)`, `<audio controls>`
- [x] `이 음성 사용` 액션으로 생성된 blob을 최종 오디오 대상으로 지정한다. 근거: blob을 mp3 `File`로 변환해 기존 업로드 흐름에 연결
- [x] TTS 실패 상태와 직접 mp3 업로드 대체 흐름을 표시한다. 근거: `warningMessage`
- [x] 실제 API 키와 실제 voice ID가 저장소에 남지 않았는지 확인한다. 근거: Secret 이름과 env key만 추가

## 검증 체크리스트

- [x] `npm --prefix apps/admin run typecheck`가 통과한다. 근거: 종료 코드 0
- [x] `npm --prefix apps/admin run build`가 통과한다. 근거: 종료 코드 0, Firebase SDK chunk size 경고 출력
- [x] `npm --prefix functions run build`가 통과한다. 근거: 종료 코드 0
- [x] 관리자 Auth ID token 없이 TTS Function 호출이 거부된다. 근거: `ttsPreview.test.ts`
- [x] 비관리자 UID로 TTS Function 호출이 거부된다. 근거: `ttsPreview.test.ts`
- [x] 잘못된 `speakerGender` 값은 거부된다. 근거: `ttsPreview.test.ts`
- [x] 유효한 `script`와 `speakerGender`로 mp3 blob 응답을 받을 수 있다. 근거: `ttsPreview.test.ts`
- [ ] 관리자 앱에서 생성된 TTS 미리듣기를 재생할 수 있다. 근거: Firebase/ElevenLabs 운영 환경 필요
- [ ] `이 음성 사용` 후 저장하면 생성된 mp3가 최종 오디오로 Storage에 업로드된다. 근거: Firebase/ElevenLabs 운영 환경 필요
- [x] TTS 실패 시 직접 mp3 업로드로 저장을 계속할 수 있다. 근거: TTS 실패는 `warningMessage`만 설정하고 저장 흐름을 막지 않음
- [x] 클라이언트 번들, `.env.example`, 결과 문서에 ElevenLabs API 키와 실제 voice ID가 없다. 근거: `rg` 확인 결과 secret 이름과 테스트 더미 값만 존재

## 검증 결과

- `npm --prefix apps/admin run typecheck`: 통과
- `npm --prefix apps/admin run build`: 통과. Firebase SDK 포함으로 Vite chunk size 경고가 출력됨
- `npm --prefix functions run build`: 통과
- `npm --prefix functions test`: 51개 통과
- `npm run build`: 통과. 기존 chunk size 경고와 Node DEP0190 경고는 출력됨
- `rg "ELEVENLABS|VOICE_ID|test-key|female-voice" apps/admin functions/src docs/exec-plans/admin/completed/05-admin-tts-preview-result.md`: 실제 API 키/voice ID 없음. 테스트 파일에는 더미 값만 사용
- 실제 ElevenLabs 호출과 관리자 앱 TTS 재생/최종 업로드 통합 검증은 운영 Firebase, 관리자 계정, ElevenLabs Secret 설정이 필요해 수행하지 않았다.
