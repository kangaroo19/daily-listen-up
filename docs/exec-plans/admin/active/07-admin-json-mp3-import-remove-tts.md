# 07. JSON 기반 mp3 퀴즈 등록과 ElevenLabs TTS 제거

## 목적

관리자 앱에서 ElevenLabs TTS 미리듣기 기능을 제거하고, 운영자가 `quizPool.json` 단일 항목 양식을 붙여넣은 뒤 mp3 파일을 선택해 기존 퀴즈 폼과 저장 흐름으로 등록할 수 있게 한다.

ElevenLabs API는 과금 요소가 있으므로 관리자 v1에서는 사용하지 않는다. 최종 오디오는 운영자가 준비한 mp3 파일만 업로드한다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/admin/index.md`
- `docs/exec-plans/admin/active/06-admin-publish-delete-progress-policy.md`
- `docs/exec-plans/admin/completed/06-admin-publish-delete-progress-policy-result.md`
- `docs/product-specs/admin.md`
- `docs/design-docs/style-guidelines.md`
- `docs/design-docs/admin-dashboard-ui.md`
- `functions/src/content/quizPool.json`

## 선행 조건

- 06번 작업으로 관리자 앱의 퀴즈 CRUD, mp3 업로드, 발행, 삭제, 진행 기록 기반 제한 정책이 구현되어 있어야 한다.
- 06번 completed 문서를 먼저 확인해 실제 관리자 앱 구조와 후속 반영 사항을 파악한다.

## 범위

- 관리자 앱 퀴즈 상세 패널 상단에 수동 입력과 JSON 입력 모드를 전환하는 UI를 추가한다.
- JSON 입력 모드는 `functions/src/content/quizPool.json`의 단일 항목에 `quizDate`를 추가한 객체 1개만 허용한다.
- JSON 입력 모드는 배열 입력을 허용하지 않는다.
- JSON 입력값을 파싱하고 기존 퀴즈 폼 상태로 변환한다.
- JSON의 `audioFileName`과 선택한 mp3 파일명이 일치하는지 검증한다.
- JSON 가져오기는 Firestore 또는 Storage에 즉시 저장하지 않고 기존 폼을 채운다.
- 가져온 데이터는 기존 `미발행 저장` 버튼으로 저장한다.
- 기존 Storage 업로드와 Firestore 저장 흐름을 재사용한다.
- 관리자 앱의 TTS 미리듣기 UI와 관련 service 코드를 제거한다.
- Functions의 ElevenLabs TTS 미리듣기 endpoint와 관련 Secret/env 정의를 제거한다.
- 관리자 v1 기준 문서에서 ElevenLabs 예외 문구를 mp3-only 기준으로 갱신한다.

## 제외 범위

- 배열 JSON 일괄 업로드는 구현하지 않는다.
- 서버 side bulk import API는 만들지 않는다.
- 사용자 앱 `src/` 동작은 변경하지 않는다.
- Firestore 퀴즈 스키마에 `speakerGender`를 추가하지 않는다.
- JSON 가져오기 후 즉시 자동 저장 또는 자동 발행하지 않는다.
- mp3 파일을 자동 생성하거나 외부 TTS API를 호출하지 않는다.

## JSON 입력 양식

JSON 모드는 아래 형태의 단일 객체만 허용한다. `speakerGender`는 기존 `quizPool.json` 양식 호환을 위해 허용하지만 Firestore에는 저장하지 않는다.

```json
{
  "quizDate": "2026-06-14",
  "id": "cafe-name-mixup",
  "audioFileName": "cafe-name-mixup.mp3",
  "speakerGender": "female",
  "script": "This morning, I stopped at a small cafe before work...",
  "choices": [
    { "id": "choice-a", "text": "화자는 출근 전에 작은 카페에 들렀다." },
    { "id": "choice-b", "text": "화자는 따뜻한 아메리카노를 주문했다." },
    { "id": "choice-c", "text": "바리스타는 컵에 Mina 대신 Nina라고 적었다." },
    { "id": "choice-d", "text": "Nina는 음료를 마시지 않고 바로 버렸다." },
    { "id": "choice-e", "text": "바리스타는 이후 이름 대신 테이블 번호를 쓰기 시작했다." }
  ],
  "correctChoiceIds": ["choice-a", "choice-c"],
  "promotionAmount": 5
}
```

## 구현 지침

- JSON 입력 모드는 기존 퀴즈 상세 폼과 같은 저장 정책을 따른다.
- `quizDate`는 Firestore 문서 ID와 Storage 업로드 경로 날짜로 사용한다.
- `audioFileName`은 필수이며 선택한 mp3 파일명과 정확히 일치해야 한다.
- mp3 파일은 기존 `isMp3File` 검증을 통과해야 한다.
- `choices`는 정확히 5개여야 하며 각 `id`와 `text`가 있어야 한다.
- `correctChoiceIds`는 1개 이상이어야 하며 `choices[].id`에 존재하는 값만 허용한다.
- `promotionAmount`는 기존 폼 정책과 동일하게 양수 정수만 허용한다.
- `script`는 비어 있을 수 없다.
- JSON 가져오기 성공 시 기존 폼의 `quizDate`, `script`, `choices`, `correctChoiceIds`, `promotionAmount`를 채우고 선택한 mp3 파일을 최종 오디오 후보로 지정한다.
- JSON 가져오기 성공 시 `audioStoragePath`는 직접 입력하지 않고 기존 업로드 로직이 저장 시 생성하도록 둔다.
- JSON 가져오기 실패는 JSON 입력 섹션 근처에 이유를 표시한다.
- TTS 제거 후에도 직접 mp3 업로드만으로 새 퀴즈를 저장할 수 있어야 한다.
- 기존 진행 기록이 있는 퀴즈의 수정 제한 정책은 유지한다.

## 작업 체크리스트

- [ ] 최신 `dev` 기준에서 `codex/07-admin-json-mp3-import-remove-tts` 브랜치를 만든다.
- [ ] 06번 completed 문서를 읽고 관리자 앱 전체 흐름과 후속 반영 사항을 확인한다.
- [ ] TTS 관련 관리자 UI를 제거한다.
- [ ] TTS 관련 관리자 service 코드를 제거한다.
- [ ] Functions의 TTS 미리듣기 endpoint와 route 등록을 제거한다.
- [ ] ElevenLabs 관련 Secret/env 정의와 예시 문서를 제거하거나 mp3-only 기준으로 갱신한다.
- [ ] 퀴즈 상세 패널에 수동 입력/JSON 입력 모드 전환 UI를 추가한다.
- [ ] JSON 단일 객체 파싱과 schema 검증을 구현한다.
- [ ] `quizDate`, `audioFileName`, `script`, `choices`, `correctChoiceIds`, `promotionAmount`를 검증한다.
- [ ] `speakerGender`는 허용하되 저장 payload에서 제외한다.
- [ ] mp3 파일명과 `audioFileName` 일치 검증을 구현한다.
- [ ] JSON 가져오기 성공 시 기존 퀴즈 폼에 값을 반영한다.
- [ ] JSON 가져오기 성공 시 선택한 mp3 파일을 기존 오디오 업로드 후보로 지정한다.
- [ ] 기존 미발행 저장, 발행, 발행 해제, 삭제, 오디오 업로드 정책이 유지되는지 확인한다.
- [ ] `docs/exec-plans/admin/index.md`의 ElevenLabs 기준을 mp3-only 기준으로 갱신한다.
- [ ] `docs/exec-plans/admin/completed/07-admin-json-mp3-import-remove-tts-result.md`를 작성한다.

## 검증 체크리스트

- [ ] `npm --prefix apps/admin run typecheck`가 통과한다.
- [ ] `npm --prefix apps/admin run build`가 통과한다.
- [ ] `npm --prefix functions run build`가 통과한다.
- [ ] `npm --prefix functions test`가 통과한다.
- [ ] 유효한 단일 JSON과 일치하는 mp3 파일로 기존 폼이 채워진다.
- [ ] 배열 JSON은 거부된다.
- [ ] `quizDate` 누락 또는 형식 오류는 거부된다.
- [ ] `audioFileName`과 선택한 mp3 파일명이 다르면 거부된다.
- [ ] `choices` 5개, 정답 ID, 포인트 검증이 기존 폼 정책과 일치한다.
- [ ] 저장 시 Firestore 문서는 기존 `Quiz` 형태로 저장되고 `speakerGender`는 저장되지 않는다.
- [ ] 저장 시 mp3 파일은 기존 Storage 업로드 경로 정책대로 업로드된다.
- [ ] TTS 버튼, TTS service, TTS Function route, ElevenLabs env/Secret 참조가 남아 있지 않다.
- [ ] 기존 사용자 앱의 오늘 문제 조회, 답안 제출, 결과, 재도전, 스크립트 보기 흐름이 변경되지 않는다.

## 완료 후 결과 문서 작성 기준

- `docs/exec-plans/admin/completed/07-admin-json-mp3-import-remove-tts-result.md`를 작성한다.
- 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- TTS 제거 범위, JSON 입력 모드, mp3 파일명 검증, 기존 저장 흐름 유지 여부를 기록한다.
- 실제 관리자 UID, API key, Firebase Secret 값은 결과 문서에 기록하지 않는다.
