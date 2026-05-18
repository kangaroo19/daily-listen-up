# 6. Toss 로그인 클라이언트 및 홈 CTA 구현 결과

## 작업 요약

- 기존 Apps in Toss scaffold 안내 화면을 MVP 홈 화면 문구와 `시작하기` CTA로 교체했다.
- `appLogin()`으로 받은 `authorizationCode`, `referrer`를 서버 로그인 API로 전달하는 클라이언트 로그인 흐름을 추가했다.
- 로그인 성공 시 앱 세션 토큰과 만료 시각을 `sessionStorage`에 저장하고, 저장 직후 `GET /api/me`로 세션을 검증한다.
- 로그인 진행, 성공, 실패 상태를 홈 화면 상태 문구와 CTA 비활성화/로딩 상태로 표현했다.
- `.env.example`에 프론트 API base URL 기준을 추가했다.

## 변경 파일

- `.env.example`
- `src/App.tsx`
- `src/App.css`
- `src/auth/loginFlow.ts`
- `src/auth/loginFlow.test.ts`

## 완료 기준 확인

- [x] scaffold 안내 화면이 MVP 홈 화면 문구와 CTA로 교체되어 있다.
  - 확인: `src/App.tsx`
- [x] 홈 화면에서 TDS 컴포넌트를 우선 사용한다.
  - 확인: `src/App.tsx`의 `Top`, `Button`
- [x] `시작하기` 클릭 시 `appLogin()`을 호출하는 코드가 존재한다.
  - 확인: `src/App.tsx`, `src/auth/loginFlow.ts`
- [x] `appLogin()` 결과의 `authorizationCode`, `referrer`를 `POST /api/login/toss`로 전달한다.
  - 확인: `src/auth/loginFlow.test.ts`
- [x] 로그인 성공 시 `sessionStorage`에 `daily-listen-up.sessionToken`, `daily-listen-up.sessionExpiresAt`을 저장한다.
  - 확인: `src/auth/loginFlow.test.ts`
- [x] 세션 저장 후 `GET /api/me`를 `Authorization: Bearer ${sessionToken}` 헤더와 함께 호출한다.
  - 확인: `src/auth/loginFlow.test.ts`
- [x] `appLogin()` 취소 또는 실패 시 홈에 머물고 실패 안내를 보여준다.
  - 확인: `src/App.tsx`, 브라우저 수동 확인
- [x] 서버 로그인 실패 시 홈에 머물고 실패 안내를 보여준다.
  - 확인: `src/App.tsx`, `src/auth/loginFlow.ts`
- [x] `/api/me` 실패 시 저장한 세션 정보를 제거하고 실패 안내를 보여준다.
  - 확인: `src/auth/loginFlow.test.ts`
- [x] 로그인 진행 중 CTA가 비활성화되어 중복 요청이 발생하지 않는다.
  - 확인: `src/App.tsx`
- [x] 클라이언트 코드가 Toss access token, refresh token, 원본 `userKey`를 저장하거나 표시하지 않는다.
  - 확인: `src/App.tsx`, `src/auth/loginFlow.ts`
- [x] `.env.example`에 `VITE_API_BASE_URL=http://localhost:4000` 기준이 있다.
  - 확인: `.env.example`
- [x] 오늘 문제 조회, 홈 진입 분기, 문제 없음 상태가 이 작업에 섞이지 않았다.
  - 확인: `src/App.tsx`, `src/auth/loginFlow.ts`
- [x] `npm run build`가 통과한다.
- [x] `npm run lint`가 통과한다.
- [x] 가능하면 다음 흐름에 대한 컴포넌트 또는 함수 단위 테스트가 존재한다.
  - 확인: `src/auth/loginFlow.test.ts`

## 검증 명령

```bash
npx vitest run src/auth/loginFlow.test.ts
npm run build
npm run lint
```

## 브라우저 확인

- `http://localhost:5173`에서 홈 제목, 설명, 보조 설명, `시작하기` CTA 렌더링을 확인했다.
- 일반 브라우저 환경에서 CTA 클릭 시 native bridge 로그인 실패로 실패 안내가 표시되고, 버튼이 다시 활성화되는 것을 확인했다.
- 일반 브라우저에서는 `TDSMobileAITProvider`가 native safe-area constant를 읽지 못해 콘솔 로그를 남긴다. Toss WebView 환경 의존 로그로 보고 이번 작업 범위에서는 변경하지 않았다.
