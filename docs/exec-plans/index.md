# MVP 개발 작업지시서 목차

## MVP 개발 기준

- 사용자는 토스 로그인 후 오늘의 문제에 진입한다.
- 토스 로그인, 사용자 식별, 정답 검증, 포인트 지급처럼 서버 신뢰가 필요한 기능은 우선 이 프로젝트 내부의 백엔드 코드에서 처리한다.
- 프로젝트 내부 백엔드 코드는 개발 후반에 Firebase Functions로 이전할 수 있게 API 경계와 비즈니스 로직 경계를 분리한다.
- Firebase Functions는 현재 구현 전제가 아니라, MVP 개발이 거의 끝난 단계에서 선택할 배포 후보로 둔다.
- 프론트는 인증 구현체나 서버 세부 구현에 직접 결합하지 않고, 얇은 API/어댑터 경계를 통해 연동한다.
- 사용자는 짧은 영어 오디오를 듣고 객관식 문제를 푼다.
- 답안 제출 후 전면형 광고를 완료해야 결과를 확인할 수 있다.
- 정답이면 토스 포인트 지급 요청 흐름으로 이동한다.
- 오답이면 보상형 광고 완료 후 같은 문제에 재도전할 수 있다.
- 이미 오늘 학습을 완료한 사용자는 완료 화면만 본다.
- 배포 방식은 후반 단계에서 확정한다. 현재는 프로젝트 내부 백엔드 코드와 Firebase 클라이언트 SDK, Toss SDK, Toss Ads 연동을 기준으로 구현한다.

## MVP 페이지 구조

MVP는 다음 3개 주요 페이지를 기준으로 구현한다.

1. 홈페이지
   - 미니앱에 대한 간략한 설명을 제공한다.
   - 사용자가 오늘의 영어 듣기 문제를 시작할 수 있는 주요 CTA를 제공한다.
   - 로그인 또는 세션 확인이 필요한 경우 토스 로그인 흐름으로 연결한다.

2. 영어 문제 풀이 페이지
   - 오늘의 영어 오디오를 재생한다.
   - 객관식 문제를 보여주고 사용자가 답안을 선택할 수 있게 한다.
   - 답안 제출 이후 결과 확인 흐름으로 이동한다.

3. 결과 페이지
   - 문제에 대한 정답과 사용자의 풀이 결과를 보여준다.
   - 이미 오늘의 문제를 푼 사용자는 앱 진입 후 이 페이지로 바로 이동한다.
   - 정답/오답 상태에 따라 이후 보상 또는 재도전 흐름으로 연결한다.

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
  - 예: `codex/02-backend-foundation`
  - 예: `codex/03-backend-api`
- 작업 완료 후에는 같은 번호의 `completed` 문서를 작성한다.
- 변경 사항을 커밋한 뒤 작업 브랜치에서 `dev` 브랜치로 PR을 생성한다.
- PR 설명에는 참조한 `active` 문서와 작성한 `completed` 문서를 함께 링크한다.
- 다음 작업을 시작하기 전에는 최신 `dev` 기준에서 새 브랜치를 만든다.

## 문서명 규칙

- `active` 문서는 번호와 작업명을 함께 쓴다.
  - 예: `active/01-apps-in-toss-setup.md`
  - 예: `active/02-backend-foundation.md`
  - 예: `active/03-backend-api.md`
- `completed` 문서는 같은 번호에 `result`를 붙인다.
  - 예: `completed/01-apps-in-toss-setup-result.md`
  - 예: `completed/02-backend-foundation-result.md`
  - 예: `completed/03-backend-api-result.md`

## 전체 작업 목록

1. Apps in Toss 기본 앱 구조 세팅
   - 파일명: `active/01-apps-in-toss-setup.md`
2. 프로젝트 내부 백엔드 기반 세팅
   - 파일명: `active/02-backend-foundation.md`
3. 서버 API 구현
   - 파일명: `active/03-backend-api.md`
4. 토스 로그인 기능 구현
   - 파일명: `active/04-toss-login.md`
5. 사용자 식별 및 진행 상태 기준 정의
   - 파일명: `active/05-user-progress-state.md`
6. Firebase 문제 데이터 조회 구현
   - 파일명: `active/06-firebase-quiz-query.md`
7. 오늘의 문제 진입 화면 구현
   - 파일명: `active/07-today-quiz-entry.md`
8. 오디오 재생 UI 구현
   - 파일명: `active/08-audio-player-ui.md`
9. 객관식 퀴즈 풀이 UI 구현
   - 파일명: `active/09-multiple-choice-quiz-ui.md`
10. 답안 제출 흐름 구현
   - 파일명: `active/10-answer-submit-flow.md`
11. 토스애즈 전면형 광고 연동
    - 파일명: `active/11-toss-ads-interstitial.md`
12. 정답 확인 및 결과 분기 구현
    - 파일명: `active/12-answer-result-branch.md`
13. 정답 시 토스 포인트 지급 요청 연동
    - 파일명: `active/13-point-reward-request.md`
14. 오답 시 보상형 광고 기반 재도전 구현
    - 파일명: `active/14-rewarded-ad-retry.md`
15. 오늘 학습 완료 화면 구현
    - 파일명: `active/15-today-complete-screen.md`
16. 당일 중복 학습 및 중복 보상 방지 처리
    - 파일명: `active/16-daily-duplicate-guard.md`
17. 오늘의 문제 없음 상태 구현
    - 파일명: `active/17-empty-today-quiz-state.md`
18. 전체 화면 UI 정리 및 TDS 스타일 적용
    - 파일명: `active/18-tds-ui-polish.md`
19. MVP 테스트 시나리오 작성
    - 파일명: `active/19-mvp-test-scenarios.md`
20. 빌드 및 Apps in Toss 실행 검증
    - 파일명: `active/20-build-and-toss-verification.md`
21. MVP 완료 기준 체크리스트
    - 파일명: `active/21-mvp-completion-checklist.md`
