# 관리자 v1 작업지시서 목차

## 관리자 v1 개발 기준

- 관리자 앱은 `apps/admin`에 독립 React/Vite 앱으로 만든다.
- 기존 Toss 미니앱 `src/` 내부에는 관리자 화면을 넣지 않는다.
- 관리자 앱의 퀴즈 CRUD와 최종 mp3 업로드는 Firebase Client SDK로 처리한다.
- ElevenLabs TTS 미리듣기 생성만 API 키 보호를 위해 최소 Firebase Function 예외로 구현한다.
- TTS Function은 미리듣기 mp3 생성만 담당하고, Firestore/Storage 저장이나 퀴즈 CRUD API로 확장하지 않는다.
- 새 퀴즈는 완성된 문제를 `isPublished = false` 상태로 미발행 저장하고, 별도 발행 액션 후 사용자 앱에 노출한다.
- 진행 기록이 있는 퀴즈는 판정과 보상에 영향 있는 필드를 잠그고, 오탈자 정정과 발행 해제만 제한적으로 허용한다.
- 발행 해제는 긴급 중단 액션이며, 기존 진행자의 재도전과 스크립트 열람도 막는다.
- 기존 사용자 미니앱과 Firebase Functions API 동작은 가능한 한 유지한다.

## 제품 스펙 기준 문서

- 관리자페이지: `docs/product-specs/admin.md`
- 콘텐츠 운영 기준: `docs/operations/quiz-content-seeding.md`
- 백엔드: `docs/product-specs/backend.md`
- UI/TDS 기준: `docs/design-docs/style-guidelines.md`
- 관리자 대시보드 UI 기준: `docs/design-docs/admin-dashboard-ui.md`

## 관리자 앱 범위

관리자 v1은 문제 콘텐츠 운영을 위한 별도 정적 웹앱을 기준으로 구현한다.
퀴즈 목록, 상세, 등록, 수정, 삭제, 미발행 저장, 발행, 발행 해제, 미리보기, mp3 업로드, TTS 미리듣기 생성을 포함한다.

세부 UI 디자인, 문구, 컴포넌트 기준은 각 `active` 작업지시서와 `docs/design-docs/style-guidelines.md`, `docs/design-docs/admin-dashboard-ui.md`에서 다룬다.

## 운영 방식

- `active`: 진행 예정이거나 진행 중인 세부 구현 작업지시서를 둔다.
- `completed`: 작업 완료 후 실제로 어떻게 작업했는지에 대한 수행 기록을 둔다.
- 먼저 `active`에 번호별 작업지시서를 작성한다.
- 기존 `01-admin-page.md`는 대형 단일 작업지시서였으므로 새 구조에서는 사용하지 않는다.
- `active` 작업지시서를 기준으로 작업할 때는 직전에 완료된 번호의 `completed` 문서를 먼저 확인해, 실제 구현 결과와 후속 작업에 반영할 변경 사항을 파악한다.
- `active` 문서에는 구현자가 작업 중 체크할 수 있는 빈 체크리스트를 포함한다.
- 작업을 수행한 뒤 `completed`에 수행 결과 문서를 작성한다.
- `completed` 문서에는 `active` 체크리스트를 가져와 검증 결과에 따라 완료 여부를 체크하고, 각 항목의 근거를 간단히 기록한다.
- 필요하면 아래 목차의 각 항목을 `active`와 `completed` 문서로 연결한다.

## 작업지시서 체크리스트 기준

- `active` 문서의 체크리스트는 `- [ ]` 형식으로 작성한다.
- 체크리스트 항목은 구현 작업과 검증 작업을 모두 포함한다.
- `completed` 문서의 체크리스트는 `- [x]` 또는 `- [ ]` 형식으로 실제 검증 결과를 표시한다.
- 완료하지 못한 항목은 체크하지 않고, 미완료 사유와 후속 처리 기준을 함께 적는다.

## Git 작업 방식

- 모든 구현 작업은 `dev` 브랜치를 기준으로 시작한다.
- 각 작업은 `active` 문서 번호와 작업명을 기준으로 별도 브랜치를 만든다.
- 브랜치명은 `codex/{번호}-{작업명}` 형식을 사용한다.
  - 예: `codex/01-admin-dev-setup`
  - 예: `codex/02-admin-auth-rules`
- 작업 완료 후에는 같은 번호의 `completed` 문서를 작성한다.
- 변경 사항을 커밋한 뒤 작업 브랜치에서 `dev` 브랜치로 PR을 생성한다.
- PR 설명에는 참조한 `active` 문서와 작성한 `completed` 문서를 함께 링크한다.
- 다음 작업을 시작하기 전에는 최신 `dev` 기준에서 새 브랜치를 만든다.

## 문서명 규칙

- `active` 문서는 번호와 작업명을 함께 쓴다.
  - 예: `active/01-admin-dev-setup.md`
  - 예: `active/02-admin-auth-rules.md`
  - 예: `active/03-admin-quiz-crud-editor.md`
- `completed` 문서는 같은 번호에 `result`를 붙인다.
  - 예: `completed/01-admin-dev-setup-result.md`
  - 예: `completed/02-admin-auth-rules-result.md`
  - 예: `completed/03-admin-quiz-crud-editor-result.md`

## 작업 묶음 운영 기준

세부 작업지시서는 모든 번호를 한 번에 작성하지 않고, 아래 묶음 단위로 먼저 작성한 뒤 구현한다.
각 묶음 구현 중 확인된 구조나 정책 변경은 다음 묶음 작업지시서에 반영한다.

1. 1차 묶음: 01~02
   - 관리자 앱 개발 환경, Firebase 인증과 Rules 기반 접근 제어
2. 2차 묶음: 03~04
   - 퀴즈 CRUD 편집기, 직접 mp3 업로드와 Storage 저장
3. 3차 묶음: 05
   - ElevenLabs TTS 미리듣기 Function과 blob 재생/선택 흐름
4. 4차 묶음: 06
   - 발행, 발행 해제, 삭제, 진행 기록 기반 수정 제한, 최종 검증

## 전체 작업 목록

1. 관리자 앱 개발 환경 세팅
   - 파일명: `active/01-admin-dev-setup.md`
2. 관리자 인증과 Firebase Rules 접근 제어 구현
   - 파일명: `active/02-admin-auth-rules.md`
3. 관리자 퀴즈 CRUD 편집기 구현
   - 파일명: `active/03-admin-quiz-crud-editor.md`
4. 관리자 오디오 업로드와 Storage 저장 구현
   - 파일명: `active/04-admin-audio-storage.md`
5. ElevenLabs TTS 미리듣기 구현
   - 파일명: `active/05-admin-tts-preview.md`
6. 발행, 삭제, 진행 기록 기반 운영 정책 구현
   - 파일명: `active/06-admin-publish-delete-progress-policy.md`
