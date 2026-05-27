# MVP 개발 작업지시서 목차

## MVP 개발 기준

- 사용자는 토스 로그인 후 오늘의 문제에 진입한다.
- 사용자는 짧은 영어 오디오를 1회 듣고 5개 선택지 중 정답이라고 생각하는 항목을 모두 고르는 복수응답 객관식 문제를 푼다.
- 답안 제출 후 결과 확인 전면형 광고의 `dismissed` 이벤트 이후 서버 API로 채점하고 결과를 확인한다.
- 답안 검증과 정답 판정은 서버 API에서 처리한다.
- 정답이면 오늘 학습 완료 상태가 되며 토스 포인트 지급 요청 흐름으로 이동한다.
- 오늘 문제 진행 상태는 `progressStatus`, 포인트 지급 상태는 `rewardStatus`로 분리한다.
- 오답이면 보상형 광고 완료 후 같은 문제에 재도전할 수 있으며, 재도전권은 광고 1회당 1회만 제공하고 제출 시 소진한다.
- 정답과 오답 상태 모두에서 보상형 광고 완료 후 스크립트를 볼 수 있다.
- 이미 오늘 학습을 완료한 사용자는 홈에 머무르고 완료 또는 지급 실패 토스트만 본다.
- 문제 시작 시 받은 `quizDate`를 답안 제출, 광고 보상, 스크립트 열람 요청의 기준으로 사용한다.
- 백엔드는 Firebase Functions 기준으로 구현하고, 로컬 검증은 Firebase Emulator를 기준으로 한다.
- 서버는 토스 로그인 토큰 교환, 사용자 식별, 정답 검증, 포인트 지급, 하루 1회 지급 보장, 지급 결과 저장과 재조회 기준을 담당한다.
- 프론트는 Firebase 클라이언트 SDK 연동, Toss SDK 연동, Toss Ads 연동, 서버 API 호출 흐름을 함께 다룬다.

## 제품 스펙 기준 문서

- 홈: `docs/product-specs/home.md`
- 문제 풀이 화면: `docs/product-specs/quiz.md`
- 결과 화면: `docs/product-specs/result.md`
- 백엔드: `docs/product-specs/backend.md`

## MVP 화면 범위

MVP는 홈, 문제 풀이, 결과 화면을 기준으로 구현한다.
각 화면의 상세 목적, 진입 조건, 사용자 액션, 예외 처리는 `docs/product-specs/`의 화면별 문서를 따른다.

세부 UI 디자인, 문구, 컴포넌트 기준은 각 `active` 작업지시서와 `docs/design-docs/style-guidelines.md`에서 다룬다.

## 운영 방식

- `active`: 진행 예정이거나 진행 중인 세부 구현 작업지시서를 둔다.
- `completed`: 작업 완료 후 실제로 어떻게 작업했는지에 대한 수행 기록을 둔다.
- 먼저 `active`에 번호별 작업지시서를 작성한다.
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

- 최초 1회 `main` 기준으로 `dev` 브랜치를 만든다.
- 모든 구현 작업은 `dev` 브랜치를 기준으로 시작한다.
- 각 작업은 `active` 문서 번호와 작업명을 기준으로 별도 브랜치를 만든다.
- 브랜치명은 `codex/{번호}-{작업명}` 형식을 사용한다.
  - 예: `codex/01-apps-in-toss-setup`
  - 예: `codex/02-server-code-setup`
- 작업 완료 후에는 같은 번호의 `completed` 문서를 작성한다.
- 변경 사항을 커밋한 뒤 작업 브랜치에서 `dev` 브랜치로 PR을 생성한다.
- PR 설명에는 참조한 `active` 문서와 작성한 `completed` 문서를 함께 링크한다.
- 다음 작업을 시작하기 전에는 최신 `dev` 기준에서 새 브랜치를 만든다.

## 문서명 규칙

- `active` 문서는 번호와 작업명을 함께 쓴다.
  - 예: `active/01-apps-in-toss-setup.md`
  - 예: `active/02-server-code-setup.md`
  - 예: `active/03-firebase-data-security.md`
- `completed` 문서는 같은 번호에 `result`를 붙인다.
  - 예: `completed/01-apps-in-toss-setup-result.md`
  - 예: `completed/02-server-code-setup-result.md`
  - 예: `completed/03-firebase-data-security-result.md`

## 작업 묶음 운영 기준

세부 작업지시서는 모든 번호를 한 번에 작성하지 않고, 아래 묶음 단위로 먼저 작성한 뒤 구현한다.
각 묶음 구현 중 확인된 구조나 정책 변경은 다음 묶음 작업지시서에 반영한다.

1. 1차 묶음: 01~03
   - 앱/개발 환경, Firebase 기반, Toss 로그인/세션
2. 2차 묶음: 04~06
   - 홈 진입, 퀴즈 UI, 답안 제출/전면 광고/정답 검증
3. 3차 묶음: 07~09
   - 포인트 지급, 결과/재도전/스크립트, 당일 완료/중복 보상 방지
4. 4차 묶음: 10
   - TDS polish, 테스트, 빌드 검증, MVP 완료 체크

## 전체 작업 목록

1. Apps in Toss 앱/개발 환경 세팅
   - 파일명: `active/01-apps-in-toss-dev-setup.md`
2. Firebase Functions/Firestore/Storage 기반 세팅
   - 파일명: `active/02-firebase-backend-data-setup.md`
3. Toss 로그인과 앱 세션 구현
   - 파일명: `active/03-toss-login-session.md`
4. 오늘 문제 조회와 홈 진입 분기 구현
   - 파일명: `active/04-home-today-quiz-entry.md`
5. 오디오 재생과 복수응답 퀴즈 UI 구현
   - 파일명: `active/05-audio-multiple-choice-quiz.md`
6. 답안 제출, 전면형 광고, 정답 검증 구현
   - 파일명: `active/06-answer-submit-interstitial-result.md`
7. 포인트 지급과 지급 상태 조회 구현
   - 파일명: `active/07-point-reward-status.md`
8. 결과 화면, 재도전, 스크립트 보기 구현
   - 파일명: `active/08-result-retry-script.md`
9. 당일 완료/중복 보상 방지와 상태 모델 강화
   - 파일명: `active/09-daily-completion-duplicate-guard.md`
10. TDS UI 정리, 테스트, 빌드 검증, MVP 완료 체크
    - 파일명: `active/10-mvp-polish-test-verification.md`
