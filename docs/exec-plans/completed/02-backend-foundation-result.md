# 2. 프로젝트 내부 백엔드 기반 세팅 결과

## 참조 문서

- `docs/exec-plans/active/02-backend-foundation.md`
- `docs/exec-plans/index.md`

## 작업 내용

- `server/src`에 TypeScript 기반 백엔드 작업 공간을 추가했다.
- Web `Request`/`Response` 기반 API 핸들러와 Node 내장 `http` 로컬 실행 래퍼를 분리했다.
- `GET /api/health`만 실제 응답하도록 구현했다.
- 예약 API는 성공을 흉내 내지 않고 `501 not_implemented` 응답을 반환하도록 했다.
- `shared/api/contracts.ts`에 프론트와 백엔드가 함께 사용할 endpoint, health 응답, 오류 응답 계약을 정의했다.
- `src/services/api` 어댑터에 헬스체크 호출과 네트워크, 파싱, 인증 필요, 검증 실패, 서버 오류, 미구현 오류 분류를 추가했다.
- Vite 개발 서버에서 `/api/*` 요청을 로컬 백엔드 `http://localhost:8787`로 프록시하도록 설정했다.
- Firebase Admin SDK 초기화와 서버 Firestore 접근 위치를 `server/src/firebase` 아래에 예약했다.
- Toss 서버 전용 secret 접근 위치를 `server/src/integrations/toss/config.ts`와 `server/src/config/serverEnv.ts`로 분리했다.
- `.env.example`과 `.gitignore`에 서버 전용 환경변수 및 로컬 secret 파일 기준을 추가했다.

## 검증 결과

- `npm run typecheck:backend`: 통과
- `npm run typecheck:frontend`: 통과
- `npm run typecheck`: 통과
- `npm run backend:build`: 통과
- `npm run build:frontend`: 통과
- `npm run lint`: 통과
- `GET http://localhost:8787/api/health`: `{"ok":true}` 응답 확인

## 미결정 사항

- 운영 배포 대상은 아직 확정하지 않았다.
- Firebase Functions 이전 시점은 아직 확정하지 않았다.
- 실제 Toss secret 및 Firebase Admin credential 등록 방식은 이후 작업에서 결정한다.
