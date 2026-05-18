# 7. 오늘 문제 조회 API와 콘텐츠 로딩 구현 결과

## 작업 요약

- `GET /api/today-quiz` 라우트를 추가하고 서버 app에 등록했다.
- 5번 앱 세션 조회 기준을 재사용해 `Authorization: Bearer ${sessionToken}` 인증을 적용했다.
- 서버 KST 기준 오늘 날짜의 게시된 문제를 조회하고, 없으면 `status: "empty"`를 반환한다.
- 공개 문제 데이터만 반환하고 `correctChoiceIds`, `script`, `audioStoragePath`는 응답에서 제외했다.
- Storage path로부터 재생용 signed `audioUrl`을 발급하는 경계를 추가했다.
- 오늘 문제가 실제로 있을 때만 기본 `userProgress` 문서를 초기화한다.
- 클라이언트에서 `sessionStorage`의 세션 토큰으로 `/api/today-quiz`를 호출하는 로딩 함수를 추가하고 홈 상태에 연결했다.

## 변경 파일

- `server/src/app.ts`
- `server/src/routes/todayQuiz.ts`
- `server/src/routes/todayQuiz.test.ts`
- `server/src/quiz/audioUrlSigner.ts`
- `server/src/quiz/todayQuizRepository.ts`
- `src/App.tsx`
- `src/quiz/todayQuizClient.ts`
- `src/quiz/todayQuizClient.test.ts`

## 완료 기준 확인

- [x] `GET /api/today-quiz` 라우트가 서버 app에 등록되어 있다.
  - 확인: `server/src/app.ts`
- [x] `GET /api/today-quiz`가 5번 세션 검증 기준을 재사용한다.
  - 확인: `server/src/routes/todayQuiz.ts`, `FirestoreCurrentSessionRepository`
- [x] 토큰 누락, 만료, 잘못된 세션이면 401로 응답하는 테스트가 존재하고 통과한다.
  - 확인: `server/src/routes/todayQuiz.test.ts`
- [x] 오늘 게시된 문제가 없으면 `status: "empty"`를 반환하는 테스트가 존재하고 통과한다.
  - 확인: `server/src/routes/todayQuiz.test.ts`
- [x] 오늘 게시된 문제가 있으면 공개 문제 데이터와 `audioUrl`을 반환하는 테스트가 존재하고 통과한다.
  - 확인: `server/src/routes/todayQuiz.test.ts`
- [x] 응답에 `correctChoiceIds`, `script`, `audioStoragePath`가 포함되지 않는 테스트가 존재하고 통과한다.
  - 확인: `server/src/routes/todayQuiz.test.ts`
- [x] 오늘 문제가 실제로 있을 때 기존 `userProgress`가 없으면 기본 문서를 생성하는 테스트가 존재하고 통과한다.
  - 확인: `server/src/routes/todayQuiz.test.ts`
- [x] 기존 오늘 `userProgress`가 있으면 중복 생성하지 않고 기존 상태를 반환하는 테스트가 존재하고 통과한다.
  - 확인: `server/src/routes/todayQuiz.test.ts`
- [x] 다른 날짜 문제는 오늘 문제로 반환하지 않는 테스트가 존재하고 통과한다.
  - 확인: `server/src/routes/todayQuiz.test.ts`
- [x] `isPublished: false` 문제는 반환하지 않는다.
  - 확인: `server/src/quiz/todayQuizRepository.ts`의 Firestore query가 `isPublished == true`만 조회한다.
- [x] 선택지가 5개가 아닌 문제는 서버 데이터 오류로 처리하는 테스트가 존재하고 통과한다.
  - 확인: `server/src/routes/todayQuiz.test.ts`
- [x] 클라이언트가 `sessionStorage`의 `sessionToken`으로 `GET /api/today-quiz`를 호출하는 코드가 존재한다.
  - 확인: `src/quiz/todayQuizClient.ts`, `src/quiz/todayQuizClient.test.ts`
- [x] 클라이언트가 문제 있음, 문제 없음, 로딩 실패 상태를 구분할 수 있다.
  - 확인: `src/quiz/todayQuizClient.ts`, `src/App.tsx`
- [x] 오디오 플레이어 UI와 복수응답 UI가 이 작업에 섞이지 않았다.
  - 확인: `src/App.tsx`
- [x] `npm run test:server`가 통과한다.
- [x] `npm run typecheck:server`가 통과한다.
- [x] `npm run build`가 통과한다.
- [x] `npm run lint`가 통과한다.

## 검증 명령

```bash
npm run test:server
npx vitest run src/auth/loginFlow.test.ts src/quiz/todayQuizClient.test.ts
npm run typecheck:server
npm run build
npm run lint
```

## 브라우저 확인

- `http://localhost:5173`에서 홈 제목, 설명, 기본 상태 문구, `시작하기` CTA 렌더링을 확인했다.

## 운영 데이터 메모

- 같은 날짜에 게시된 문제가 여러 개 있으면 `multiple_published_quizzes` 서버 데이터 오류로 처리한다.
