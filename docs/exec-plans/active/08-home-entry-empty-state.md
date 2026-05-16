# 8. 홈 진입 분기와 문제 없음 상태 구현

## 목적

앱 진입 또는 로그인 완료 후 세션과 오늘 문제 상태를 확인해 사용자를 홈, 문제 풀이, 결과 완료 상태, 문제 없음 상태로 이동시킨다.

## 구현 범위

- `react-router-dom` 의존성을 추가한다.
- MVP 주요 페이지 경로를 만든다.
  - `/`: 홈
  - `/quiz`: 문제 풀이 shell
  - `/result`: 결과 페이지 shell
- 알 수 없는 경로는 `/`로 돌린다.
- 앱 시작 시 `sessionStorage`의 `daily-listen-up.sessionToken`을 확인한다.
- 세션 토큰이 없으면 `/` 홈을 보여준다.
- 세션 토큰이 있으면 `GET /api/me`를 호출해 세션을 확인한다.
- 세션 확인에 실패하면 저장된 세션 값을 제거하고 `/`로 이동한다.
- 세션이 유효하면 `GET /api/today-quiz`를 호출한다.
- `GET /api/today-quiz`가 `status: "empty"`를 반환하면 `/`에서 문제 없음 상태를 보여준다.
- `GET /api/today-quiz`가 `status: "available"`을 반환하고 `progress.isCorrect === true`이면 `/result`로 이동한다.
- `GET /api/today-quiz`가 `status: "available"`을 반환하고 완료 전이면 `/quiz`로 이동한다.
- 6번 로그인 완료 후에도 같은 진입 분기 흐름을 사용한다.
- `/quiz`는 오늘 문제 데이터가 연결되는 최소 shell만 만든다.
- `/result`는 오늘 완료 상태를 보여주는 최소 shell만 만든다.

## 제외 범위

- Toss 로그인 서버 구현
- Toss 로그인 클라이언트 신규 구현
- 앱 세션 발급 구현
- 세션 검증 API 서버 구현
- 오늘 문제 조회 API 서버 구현
- 오디오 플레이어 UI 구현
- 오디오 1회 재생 제한 구현
- 복수응답 선택지 UI 구현
- 답안 제출 구현
- 정답 검증 API 구현
- 정답/오답 결과 상세 UI 구현
- 포인트 지급 상태 UI 구현
- 재도전 UI 구현
- 스크립트 보기 UI 구현
- 광고 SDK 연동
- 별도 전역 상태관리 라이브러리 추가

## 구현 기준

- 라우터는 `react-router-dom`을 사용한다.
- URL 경로는 `/`, `/quiz`, `/result`로 고정한다.
- `sessionStorage` key는 6번 기준을 따른다.
  - `daily-listen-up.sessionToken`
  - `daily-listen-up.sessionExpiresAt`
- API base URL은 6번의 `VITE_API_BASE_URL` 기준을 재사용한다.
- API 호출 시 세션 토큰은 `Authorization: Bearer ${sessionToken}` 헤더로 전달한다.
- 앱 진입 분기 함수는 로그인 완료 후에도 재사용할 수 있게 분리한다.
- `GET /api/me` 실패는 세션 만료 또는 유효하지 않은 세션으로 보고 저장된 세션 값을 제거한다.
- `GET /api/today-quiz`의 `status: "empty"`는 에러가 아니라 정상적인 문제 없음 상태로 처리한다.
- 홈 문제 없음 상태 문구는 `docs/product-specs/home.md`를 따른다.
  - `오늘의 문제가 아직 준비되지 않았어요.`
  - `잠시 후 다시 확인해 주세요.`
- 문제 없음 상태에서는 `시작하기` CTA 대신 준비 중 상태를 보여준다.
- `/quiz` shell은 오늘 문제 로딩 성공을 확인할 수 있는 최소 구조만 둔다.
- `/quiz` shell에서 오디오 재생 버튼, 선택지, 제출 버튼은 아직 구현하지 않는다.
- `/result` shell은 오늘 완료 상태의 최소 문구만 보여준다.
  - `오늘 학습을 완료했어요`
  - `내일 새로운 문제로 다시 만나요.`
- `/result` shell에서 정답/오답, 포인트 상태, 재도전, 스크립트 보기는 아직 구현하지 않는다.
- `todayQuiz`와 `progress`는 9번과 10번이 이어받을 수 있게 앱 상태 또는 경량 context로 보관한다.
- 라우팅 도입 외 별도 상태관리 라이브러리는 추가하지 않는다.

## 진입 분기 기준

앱 시작 시 다음 순서로 분기한다.

1. `sessionStorage`에서 `daily-listen-up.sessionToken`을 확인한다.
2. 토큰이 없으면 `/` 홈을 보여준다.
3. 토큰이 있으면 `GET /api/me`를 호출한다.
4. `GET /api/me`가 실패하면 세션 저장값을 제거하고 `/`로 이동한다.
5. `GET /api/me`가 성공하면 `GET /api/today-quiz`를 호출한다.
6. `GET /api/today-quiz`가 `status: "empty"`를 반환하면 `/`에서 문제 없음 상태를 보여준다.
7. `GET /api/today-quiz`가 `status: "available"`이고 `progress.isCorrect === true`이면 `/result`로 이동한다.
8. `GET /api/today-quiz`가 `status: "available"`이고 완료 전이면 `/quiz`로 이동한다.

로그인 성공 후에는 위 분기 함수를 다시 호출해 `/quiz`, `/result`, 홈 문제 없음 상태 중 하나로 이동한다.

## 상태 및 예외 처리

- 앱 진입 확인 중에는 사용자가 기다릴 수 있는 짧은 로딩 상태를 보여준다.
- 세션 검증 실패 시 사용자에게 과한 오류를 보여주지 않고 홈으로 돌아가 다시 시작할 수 있게 한다.
- 오늘 문제 조회 실패 시 문제 없음 상태로 처리하지 않는다.
- 오늘 문제 조회 실패 시 재시도 가능한 오류 상태를 보여준다.
- 문제 없음 상태에서는 CTA를 비활성화하거나 숨기고 준비 중 안내를 보여준다.
- `/quiz`에 직접 접근했지만 세션이나 오늘 문제가 없으면 진입 분기 흐름을 거쳐 적절한 화면으로 이동한다.
- `/result`에 직접 접근했지만 완료 상태가 아니면 진입 분기 흐름을 거쳐 적절한 화면으로 이동한다.
- 알 수 없는 경로로 접근하면 `/`로 이동한다.

## 완료 기준

- `react-router-dom`이 의존성에 추가되어 있다.
- `/`, `/quiz`, `/result` 경로가 존재한다.
- 알 수 없는 경로가 `/`로 이동한다.
- 세션이 없으면 `/` 홈을 보여준다.
- 세션 검증 실패 시 `sessionStorage`의 세션 값을 제거하고 `/`로 이동한다.
- 오늘 문제가 없으면 홈에서 문제 없음 문구를 보여준다.
- 오늘 문제가 있고 완료 전이면 `/quiz`로 이동한다.
- 오늘 문제가 있고 `progress.isCorrect === true`이면 `/result`로 이동한다.
- 로그인 성공 후 같은 진입 분기 흐름을 사용한다.
- 홈 문제 없음 상태에 `오늘의 문제가 아직 준비되지 않았어요.`, `잠시 후 다시 확인해 주세요.` 문구가 표시된다.
- `/quiz` shell이 존재하고 오늘 문제 로딩 성공 상태를 확인할 수 있다.
- `/result` shell에 `오늘 학습을 완료했어요`, `내일 새로운 문제로 다시 만나요.` 문구가 표시된다.
- 오디오 플레이어 UI, 복수응답 UI, 정답/오답 결과 상세 UI가 이 작업에 섞이지 않았다.
- 가능하면 다음 흐름에 대한 컴포넌트 또는 함수 단위 테스트가 존재한다.
  - 세션 없음: `/` 유지
  - 세션 검증 실패: `sessionStorage` 제거 후 `/` 이동
  - 오늘 문제 없음: 홈 문제 없음 상태 표시
  - 오늘 문제 있음 + 미완료: `/quiz` 이동
  - 오늘 문제 있음 + 완료: `/result` 이동
  - 알 수 없는 경로: `/` 이동
- `npm run build`가 통과한다.
- `npm run lint`가 통과한다.

## Git 전략

- 최신 `dev` 기준에서 `codex/08-home-entry-empty-state` 브랜치를 만든다.
- 라우터 도입, 페이지 shell 생성, 진입 분기 구현, 문제 없음 상태, 검증 기록을 의미 있는 단위로 커밋한다.
- 작업 완료 후 `docs/exec-plans/completed/08-home-entry-empty-state-result.md`를 작성한다.
- 작업 브랜치에서 `dev`로 PR을 보낸다.
- PR 설명에는 이 active 문서와 completed 문서를 함께 링크한다.

## 다음 작업과의 연결

- 9번 오디오 재생 UI 구현은 `/quiz` shell과 7번에서 받은 `audioUrl`을 사용한다.
- 10번 복수응답 퀴즈 풀이 UI 구현은 `/quiz` shell과 7번에서 받은 `choices`를 사용한다.
- 11번 정답 검증 API 구현은 `/quiz`에서 제출할 답안을 서버에서 검증한다.
- 14번 결과 화면 상태 분기와 보상 상태 UI 구현은 `/result` shell을 실제 정답/오답/완료/보상 상태 UI로 확장한다.
