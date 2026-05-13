# MVP 개발 작업지시서 목차

## MVP 개발 기준

- 사용자는 토스 로그인 후 오늘의 문제에 진입한다.
- 사용자는 짧은 영어 오디오를 1회 듣고 5개 선택지 중 정답이라고 생각하는 항목을 모두 고르는 복수응답 객관식 문제를 푼다.
- 답안 제출 후 전면형 광고를 완료해야 결과를 확인할 수 있다.
- 답안 검증과 정답 판정은 서버 API에서 처리한다.
- 정답이면 오늘 학습 완료 상태가 되며 토스 포인트 지급 요청 흐름으로 이동한다.
- 오답이면 보상형 광고 완료 후 같은 문제에 재도전할 수 있다.
- 정답과 오답 상태 모두에서 보상형 광고 완료 후 스크립트를 볼 수 있다.
- 이미 오늘 학습을 완료한 사용자는 완료 화면만 본다.
- 서버 코드는 초기에는 프로젝트 내부에 작성하되, Firebase Functions로 옮길 수 있는 구조를 전제로 한다.
- 서버는 토스 로그인 토큰 교환, 사용자 식별, 정답 검증, 포인트 지급, 하루 1회 지급 보장, 지급 결과 저장과 재조회 기준을 담당한다.
- 프론트는 Firebase 클라이언트 SDK 연동, Toss SDK 연동, Toss Ads 연동, 서버 API 호출 흐름을 함께 다룬다.

## 제품 스펙 기준 문서

- 홈: `docs/product-specs/home.md`
- 문제 풀이 화면: `docs/product-specs/quiz.md`
- 결과 화면: `docs/product-specs/result.md`
- 백엔드: `docs/product-specs/backend.md`

## MVP 페이지 구조

MVP는 다음 3개 주요 페이지를 기준으로 구현한다.

1. 홈페이지
   - 미니앱에 대한 간략한 설명을 제공한다.
   - 사용자가 오늘의 영어 듣기 문제를 시작할 수 있는 주요 CTA를 제공한다.
   - 로그인 또는 세션 확인이 필요한 경우 토스 로그인 흐름으로 연결한다.

2. 영어 문제 풀이 페이지
   - 오늘의 영어 오디오를 재생한다.
   - 오디오 청취 완료 후 5개 선택지를 보여준다.
   - 사용자가 정답이라고 생각하는 항목을 1개 이상 선택할 수 있게 한다.
   - 답안 제출 이후 결과 확인 전면형 광고 흐름으로 이동한다.

3. 결과 페이지
   - 문제에 대한 정답과 사용자의 풀이 결과를 보여준다.
   - 이미 오늘의 문제를 푼 사용자는 앱 진입 후 이 페이지로 바로 이동한다.
   - 정답/오답 상태에 따라 이후 포인트 보상, 재도전, 스크립트 보기 흐름으로 연결한다.

세부 UI 디자인, 문구, 컴포넌트 기준은 각 `active` 작업지시서와 `docs/design-docs/style-guidelines.md`에서 다룬다.

## 운영 방식

- `active`: 진행 예정이거나 진행 중인 세부 구현 작업지시서를 둔다.
- `completed`: 작업 완료 후 실제로 어떻게 작업했는지에 대한 수행 기록을 둔다.
- 먼저 `active`에 번호별 작업지시서를 작성한다.
- 작업을 수행한 뒤 `completed`에 수행 결과 문서를 작성한다.
- 필요하면 아래 목차의 각 항목을 `active`와 `completed` 문서로 연결한다.

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
   - 앱 스캐폴드, 서버 코드 기반, Firebase 데이터/보안 기준
2. 2차 묶음: 04~08
   - 로그인, 세션/진행 상태, 홈 CTA, 오늘 문제 조회, 홈 진입 분기
3. 3차 묶음: 09~14
   - 오디오 UI, 퀴즈 UI, 정답 검증, 전면 광고, 포인트 서버, 결과 화면
4. 4차 묶음: 15~18
   - 보상형 광고, 재도전, 스크립트 보기, 중복 보상 방지 강화
5. 5차 묶음: 19~22
   - TDS polish, 테스트 시나리오, 빌드/실행 검증, MVP 완료 체크리스트

## 전체 작업 목록

1. Apps in Toss 기본 앱 구조 세팅
   - 파일명: `active/01-apps-in-toss-setup.md`
2. 서버 코드 기반 세팅
   - 파일명: `active/02-server-code-setup.md`
3. Firestore/Storage 데이터 모델 및 보안 기준 구현
   - 파일명: `active/03-firebase-data-security.md`
4. Toss 로그인 서버 연동 구현
   - 파일명: `active/04-toss-login-server.md`
5. 앱 세션 및 사용자 진행 상태 API 구현
   - 파일명: `active/05-session-progress-api.md`
6. Toss 로그인 클라이언트 및 홈 CTA 구현
   - 파일명: `active/06-toss-login-home-cta.md`
7. 오늘 문제 조회 API와 콘텐츠 로딩 구현
   - 파일명: `active/07-today-quiz-api.md`
8. 홈 진입 분기와 문제 없음 상태 구현
   - 파일명: `active/08-home-entry-empty-state.md`
9. 오디오 재생 UI 구현
   - 파일명: `active/09-audio-player-ui.md`
10. 복수응답 퀴즈 풀이 UI 구현
    - 파일명: `active/10-multiple-choice-quiz-ui.md`
11. 정답 검증 API 구현
    - 파일명: `active/11-answer-result-api.md`
12. 답안 제출 및 결과 확인 전면형 광고 구현
    - 파일명: `active/12-answer-submit-interstitial.md`
13. 포인트 지급 및 지급 상태 조회 서버 연동
    - 파일명: `active/13-point-reward-server.md`
14. 결과 화면 상태 분기와 보상 상태 UI 구현
    - 파일명: `active/14-result-state-reward-ui.md`
15. 보상형 광고 완료 기록 공통 처리 구현
    - 파일명: `active/15-rewarded-ad-complete.md`
16. 오답 재도전 흐름 구현
    - 파일명: `active/16-retry-flow.md`
17. 광고 보고 스크립트 보기 구현
    - 파일명: `active/17-script-unlock.md`
18. 당일 완료 및 중복 보상 방지 강화
    - 파일명: `active/18-daily-completion-duplicate-guard.md`
19. 전체 화면 UI 정리 및 TDS 스타일 적용
    - 파일명: `active/19-tds-ui-polish.md`
20. MVP 테스트 시나리오 작성
    - 파일명: `active/20-mvp-test-scenarios.md`
21. 빌드 및 Apps in Toss/서버 코드 실행 검증
    - 파일명: `active/21-build-toss-server-verification.md`
22. MVP 완료 기준 체크리스트
    - 파일명: `active/22-mvp-completion-checklist.md`
