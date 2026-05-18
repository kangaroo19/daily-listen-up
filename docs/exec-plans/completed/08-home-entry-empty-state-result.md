# 8. 홈 진입 분기와 문제 없음 상태 구현 결과

## 작업 요약

- `react-router-dom`을 추가하고 `/`, `/quiz`, `/result` 경로를 구성했다.
- 앱 시작 시 `sessionStorage`의 앱 세션 토큰을 확인하고, `/api/me`와 `/api/today-quiz`를 순서대로 호출하는 진입 분기 함수를 추가했다.
- 세션 검증 실패 시 저장된 세션 토큰과 만료 시각을 제거하고 홈으로 이동한다.
- 오늘 문제가 없으면 홈에서 문제 없음 상태와 준비 중 안내를 보여준다.
- 오늘 문제가 있고 미완료이면 `/quiz`, 이미 완료이면 `/result`로 이동한다.
- 로그인 성공 후에도 같은 진입 분기 함수를 재사용한다.
- `/quiz`, `/result`는 후속 작업이 확장할 수 있는 최소 shell로 구현했다.

## 변경 파일

- `package.json`
- `package-lock.json`
- `src/main.tsx`
- `src/App.tsx`
- `src/App.css`
- `src/app/entryFlow.ts`
- `src/app/entryFlow.test.ts`
- `docs/exec-plans/completed/08-home-entry-empty-state-result.md`

## 완료 기준 확인

- [x] `react-router-dom`이 의존성에 추가되어 있다.
  - 확인: `package.json`
- [x] `/`, `/quiz`, `/result` 경로가 존재한다.
  - 확인: `src/App.tsx`
- [x] 알 수 없는 경로가 `/`로 이동한다.
  - 확인: `src/App.tsx`, 브라우저 확인
- [x] 세션이 없으면 `/` 홈을 보여준다.
  - 확인: `src/app/entryFlow.test.ts`, 브라우저 확인
- [x] 세션 검증 실패 시 `sessionStorage`의 세션 값을 제거하고 `/`로 이동한다.
  - 확인: `src/app/entryFlow.test.ts`
- [x] 오늘 문제가 없으면 홈에서 문제 없음 문구를 보여준다.
  - 확인: `src/app/entryFlow.test.ts`, `src/App.tsx`
- [x] 오늘 문제가 있고 완료 전이면 `/quiz`로 이동한다.
  - 확인: `src/app/entryFlow.test.ts`
- [x] 오늘 문제가 있고 `progress.isCorrect === true`이면 `/result`로 이동한다.
  - 확인: `src/app/entryFlow.test.ts`
- [x] 로그인 성공 후 같은 진입 분기 흐름을 사용한다.
  - 확인: `src/App.tsx`
- [x] 홈 문제 없음 상태에 `오늘의 문제가 아직 준비되지 않았어요.`, `잠시 후 다시 확인해 주세요.` 문구가 표시된다.
  - 확인: `src/App.tsx`
- [x] `/quiz` shell이 존재하고 오늘 문제 로딩 성공 상태를 확인할 수 있다.
  - 확인: `src/App.tsx`
- [x] `/result` shell에 `오늘 학습을 완료했어요`, `내일 새로운 문제로 다시 만나요.` 문구가 표시된다.
  - 확인: `src/App.tsx`
- [x] 오디오 플레이어 UI, 복수응답 UI, 정답/오답 결과 상세 UI가 이 작업에 섞이지 않았다.
  - 확인: `src/App.tsx`
- [x] 가능하면 다음 흐름에 대한 컴포넌트 또는 함수 단위 테스트가 존재한다.
  - 확인: `src/app/entryFlow.test.ts`
- [x] `npm run build`가 통과한다.
- [x] `npm run lint`가 통과한다.

## 검증 명령

```bash
npx vitest run src/app/entryFlow.test.ts src/auth/loginFlow.test.ts src/quiz/todayQuizClient.test.ts
npm run test:server
npm run typecheck:server
npm run build
npm run lint
```

## 브라우저 확인

- `http://localhost:5173/unknown-path` 접근 시 `/`로 이동하는 것을 확인했다.
- 세션 없는 상태에서 `http://localhost:5173/quiz`에 직접 접근하면 `/` 홈으로 이동하는 것을 확인했다.
