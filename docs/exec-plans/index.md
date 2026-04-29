# MVP 개발 작업지시서 목차

## MVP 개발 기준

- 사용자는 토스 로그인 후 오늘의 문제에 진입한다.
- 사용자는 짧은 영어 오디오를 듣고 객관식 문제를 푼다.
- 답안 제출 후 전면형 광고를 완료해야 결과를 확인할 수 있다.
- 정답이면 토스 포인트 지급 요청 흐름으로 이동한다.
- 오답이면 보상형 광고 완료 후 같은 문제에 재도전할 수 있다.
- 이미 오늘 학습을 완료한 사용자는 완료 화면만 본다.
- 서버 구현은 제외하고, 프론트는 API 호출과 응답 처리 기준만 다룬다.

## 운영 방식

- `active`: 진행 예정이거나 진행 중인 세부 구현 작업지시서를 둔다.
- `completed`: 작업 완료 후 실제로 어떻게 작업했는지에 대한 수행 기록을 둔다.
- 먼저 `active`에 번호별 작업지시서를 작성한다.
- 작업을 수행한 뒤 `completed`에 수행 결과 문서를 작성한다.
- 필요하면 아래 목차의 각 항목을 `active`와 `completed` 문서로 연결한다.

## 문서명 규칙

- `active` 문서는 번호와 작업명을 함께 쓴다.
  - 예: `active/01-apps-in-toss-setup.md`
  - 예: `active/02-toss-login.md`
  - 예: `active/03-user-progress-state.md`
- `completed` 문서는 같은 번호에 `result`를 붙인다.
  - 예: `completed/01-apps-in-toss-setup-result.md`
  - 예: `completed/02-toss-login-result.md`
  - 예: `completed/03-user-progress-state-result.md`

## 전체 작업 목록

1. Apps in Toss 기본 앱 구조 세팅
   - 파일명: `active/01-apps-in-toss-setup.md`
2. 토스 로그인 기능 구현
   - 파일명: `active/02-toss-login.md`
3. 사용자 식별 및 진행 상태 기준 정의
   - 파일명: `active/03-user-progress-state.md`
4. Firebase 문제 데이터 조회 구현
   - 파일명: `active/04-firebase-quiz-query.md`
5. 오늘의 문제 진입 화면 구현
   - 파일명: `active/05-today-quiz-entry.md`
6. 오디오 재생 UI 구현
   - 파일명: `active/06-audio-player-ui.md`
7. 객관식 퀴즈 풀이 UI 구현
   - 파일명: `active/07-multiple-choice-quiz-ui.md`
8. 답안 제출 흐름 구현
   - 파일명: `active/08-answer-submit-flow.md`
9. 토스애즈 전면형 광고 연동
   - 파일명: `active/09-toss-ads-interstitial.md`
10. 정답 확인 및 결과 분기 구현
    - 파일명: `active/10-answer-result-branch.md`
11. 정답 시 토스 포인트 지급 요청 연동
    - 파일명: `active/11-point-reward-request.md`
12. 오답 시 보상형 광고 기반 재도전 구현
    - 파일명: `active/12-rewarded-ad-retry.md`
13. 오늘 학습 완료 화면 구현
    - 파일명: `active/13-today-complete-screen.md`
14. 당일 중복 학습 및 중복 보상 방지 처리
    - 파일명: `active/14-daily-duplicate-guard.md`
15. 오늘의 문제 없음 상태 구현
    - 파일명: `active/15-empty-today-quiz-state.md`
16. 전체 화면 UI 정리 및 TDS 스타일 적용
    - 파일명: `active/16-tds-ui-polish.md`
17. MVP 테스트 시나리오 작성
    - 파일명: `active/17-mvp-test-scenarios.md`
18. 빌드 및 Apps in Toss 실행 검증
    - 파일명: `active/18-build-and-toss-verification.md`
19. MVP 완료 기준 체크리스트
    - 파일명: `active/19-mvp-completion-checklist.md`
