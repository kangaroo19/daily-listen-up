# 11. 실제 Firebase 운영 연결과 Secret Manager 배포 준비 결과

## 기준 문서

- Active 작업지시서: `docs/exec-plans/active/11-firebase-release-secret-manager-setup.md`
- 직전 완료 문서: `docs/exec-plans/completed/10-mvp-polish-test-verification-result.md`
- MVP 기준: `docs/exec-plans/index.md`
- 백엔드 기준: `docs/product-specs/backend.md`
- Firebase 설정: `firebase.json`, `.firebaserc`
- 환경변수 기준: `.env.example`
- Toss 클라이언트: `functions/src/services/tossLoginClient.ts`, `functions/src/services/tossPromotionClient.ts`

## 작업 체크리스트

- [x] 작업 시작 시 `docs/exec-plans/completed/10-mvp-polish-test-verification-result.md`를 읽고 남은 확인 필요 항목을 반영했다.
  - 근거: 10번의 미완료 항목인 Firebase Functions 운영 배포 전 Toss mTLS Secret Manager 주입 필요를 이번 작업 범위에 반영했다.
- [x] `.firebaserc`의 default 프로젝트를 `daily-listen-up`으로 수정했다.
  - 근거: `.firebaserc`.
- [x] 현재 Firebase CLI 로그인/프로젝트 접근 권한을 `firebase projects:list` 또는 `firebase use`로 확인했다.
  - 근거: `firebase projects:list`에서 `daily-listen-up`이 current로 표시됐고, `firebase use`가 `daily-listen-up`을 반환했다.
- [x] Toss 로그인 클라이언트가 Secret Manager 기반 mTLS 인증서/개인키를 사용할 수 있게 수정했다.
  - 근거: `functions/src/services/tossLoginClient.ts`, `functions/src/services/tossMtlsConfig.ts`, `functions/src/__tests__/tossMtlsConfig.test.ts`.
- [x] Toss 프로모션 클라이언트가 Secret Manager 기반 mTLS 인증서/개인키를 사용할 수 있게 수정했다.
  - 근거: `functions/src/services/tossPromotionClient.ts`, `functions/src/services/tossMtlsConfig.ts`, `functions/src/__tests__/tossMtlsConfig.test.ts`.
- [x] `TOSS_PROMOTION_CODE`, mTLS 인증서/개인키 secret 이름을 코드와 문서에서 일관되게 정했다.
  - 근거: `functions/src/releaseSecrets.ts`, `.env.example`, `functions/src/__tests__/releaseSecrets.test.ts`.
  - 확정 secret 이름: `TOSS_PROMOTION_CODE`, `TOSS_MTLS_CERT`, `TOSS_MTLS_KEY`.
  - 참고: 앱인토스 개발자 커뮤니티 답변 기준 토스 로그인 연동에는 별도 client secret이 필요하지 않아 `TOSS_CLIENT_SECRET`은 제외했다.
- [x] 로컬 Emulator 검증에서 기존 `.env.local` 파일 경로 방식이 깨지지 않는지 확인했다.
  - 근거: `readTossMtlsConfigFromEnv`가 `TOSS_MTLS_CERT_PATH`, `TOSS_MTLS_KEY_PATH`를 우선 사용한다. `tossMtlsConfig.test.ts`에서 secret 값이 같이 있어도 파일 경로가 유지되는지 검증했다.
- [x] 실제 secret 값을 저장소, 로그, completed 문서에 남기지 않았다.
  - 근거: secret 조회는 메타데이터 확인 명령만 사용했고, `functions:secrets:access`는 실행하지 않았다.
- [x] `.env.example`에 운영/로컬 환경변수 구분과 실제 값 미기록 원칙을 정리했다.
  - 근거: `.env.example`.
- [x] Firestore rules/indexes 배포 명령을 실행했다.
  - 실행 명령: `firebase deploy --only firestore:rules,firestore:indexes,storage --project daily-listen-up`.
  - 결과: Firestore rules 컴파일/릴리스 성공, indexes 배포 성공. 기본 Firestore database가 생성됐다.
- [x] Storage rules 배포 명령을 실행했다.
  - 실행 명령: `firebase deploy --only firestore:rules,firestore:indexes,storage --project daily-listen-up`.
  - 결과: Storage rules 컴파일/릴리스 성공.
- [x] Functions secrets 등록 명령을 실행하거나, 실제 secret 값 부재로 실행하지 못하면 필요한 명령과 입력값 목록을 completed 문서에 남긴다.
  - 등록 결과: 사용자가 실제 값을 입력한 뒤 `firebase functions:secrets:get <SECRET_NAME> --project daily-listen-up`로 메타데이터만 확인했다.
  - 등록 secret: `TOSS_PROMOTION_CODE`, `TOSS_MTLS_CERT`, `TOSS_MTLS_KEY`.
  - 확인 상태: 세 secret 모두 version 1, ENABLED.
- [x] Functions 배포 명령을 실행하거나, 실행하지 못하면 사유와 출시 전 실행 기준을 completed 문서에 남긴다.
  - 실행 명령: `firebase deploy --only functions --project daily-listen-up`.
  - 결과: Functions `api(asia-northeast3)` 생성 성공. CLI 최종 exit code는 Artifact Registry cleanup policy 미설정 때문에 1이었지만, 함수 생성 자체는 성공했다.
- [x] 배포된 Functions API URL 형식을 확인하고 `VITE_APP_API_BASE_URL`에 반영할 값을 정리한다.
  - 확인 URL: `https://asia-northeast3-daily-listen-up.cloudfunctions.net/api`.
  - 반영 값: `VITE_APP_API_BASE_URL=https://asia-northeast3-daily-listen-up.cloudfunctions.net/api`.
- [x] 실제 Firebase Web App 설정값(`VITE_FIREBASE_*`)을 어디서 가져오는지 문서화했다.
  - 근거: `.env.example`에 Firebase Console > Project settings > General > Web app config 기준을 기록했다.
- [x] 배포 후 API smoke test 기준을 정리했다.
  - 기준: Functions 배포 후 실제 API base URL로 `GET /api/check-today-quiz`를 호출해 인증 없는 요청이 JSON 401 계열 응답을 반환하는지 확인한다.
  - 예: `curl -i https://asia-northeast3-daily-listen-up.cloudfunctions.net/api/api/check-today-quiz`.
- [x] `npm run typecheck`, `npm --prefix functions run test`, `npm run build`를 실행했다.
  - 근거: 아래 검증 결과.
- [x] 가능한 경우 Firebase Emulator verify 스크립트도 다시 실행했다.
  - 근거: 실행 중인 Emulator가 `daily-listen-up-dev` 네임스페이스였기 때문에 해당 네임스페이스로 seed/sample/home/answer/today 검증을 통과했다. `daily-listen-up` 네임스페이스의 Functions endpoint는 기존 실행 중인 Emulator에 로드되어 있지 않아 404로 실패했다.

## 검증 체크리스트

- [x] `.firebaserc` default가 `daily-listen-up`을 가리킨다.
  - 근거: `.firebaserc`, `firebase use`.
- [x] Firestore rules/indexes 배포가 성공했거나, 미실행 사유와 후속 명령이 문서화됐다.
  - 근거: `firebase deploy --only firestore:rules,firestore:indexes,storage --project daily-listen-up` 성공.
- [x] Storage rules 배포가 성공했거나, 미실행 사유와 후속 명령이 문서화됐다.
  - 근거: `firebase deploy --only firestore:rules,firestore:indexes,storage --project daily-listen-up` 성공.
- [x] Functions가 Secret Manager 값을 사용하도록 코드 경계가 정리됐다.
  - 근거: `functions/src/releaseSecrets.ts`에서 secret을 `onRequest`에 바인딩하고, Toss mTLS는 `TOSS_MTLS_CERT`/`TOSS_MTLS_KEY` 값을 읽는다.
- [x] 로컬 Emulator 검증 흐름이 유지된다.
  - 근거: 파일 경로 우선 테스트와 실행 중인 Emulator에 대한 verify 통과.
- [x] 실제 secret 값이 Git diff, 문서, 로그에 포함되지 않았다.
  - 근거: secret 값 접근 명령을 사용하지 않았고, 문서에는 secret 이름만 기록했다.
- [x] Functions 배포가 성공했거나, 미실행 사유와 후속 명령이 문서화됐다.
  - 근거: `firebase functions:list --project daily-listen-up`에서 `api` v2 HTTPS Function이 `asia-northeast3`, `nodejs20`으로 표시됐다.
- [x] 실제 API URL과 프론트 env 반영 기준이 문서화됐다.
  - 근거: `.env.example`, 이 문서의 최종 정리.
- [x] 타입 검사, Functions 테스트, 프론트 빌드가 통과한다.
  - 근거: 아래 검증 결과.
- [x] 실제 Firebase 배포/설정 결과와 남은 운영 확인 항목이 completed 문서에 기록된다.
  - 근거: 이 문서.

## 변경 요약

- `.firebaserc` default 프로젝트와 운영 기본 project id를 `daily-listen-up`으로 맞췄다.
- Functions v2 `onRequest`에 Toss release secret 4개를 바인딩했다.
- Toss 로그인/프로모션 mTLS 요청이 로컬 파일 경로 또는 운영 Secret Manager 문자열 값을 모두 사용할 수 있게 공통 mTLS 설정 경계를 추가했다.
- `.env.example`에 로컬/운영 환경변수 기준, Functions API URL 형식, secret 값 미기록 원칙을 정리했다.
- Firestore rules/indexes와 Storage rules를 실제 Firebase 프로젝트 `daily-listen-up`에 배포했다.

## 검증 결과

- `firebase projects:list`: 통과. `daily-listen-up` 접근 가능 및 current 확인.
- `firebase use`: 통과. `daily-listen-up`.
- `firebase deploy --only firestore:rules,firestore:indexes,storage --project daily-listen-up`: 통과. Firestore rules/indexes, Storage rules 배포 완료.
- `firebase functions:secrets:get TOSS_PROMOTION_CODE --project daily-listen-up`: 통과. version 1, ENABLED.
- `firebase functions:secrets:get TOSS_MTLS_CERT --project daily-listen-up`: 통과. version 1, ENABLED.
- `firebase functions:secrets:get TOSS_MTLS_KEY --project daily-listen-up`: 통과. version 1, ENABLED.
- `firebase deploy --only functions --project daily-listen-up`: Functions `api(asia-northeast3)` 생성 성공. 최종 exit code는 Artifact Registry cleanup policy 미설정 때문에 1.
- `firebase functions:list --project daily-listen-up`: `api`, v2, https, `asia-northeast3`, `nodejs20` 확인.
- `curl -i https://asia-northeast3-daily-listen-up.cloudfunctions.net/api/api/check-today-quiz`: 통과. HTTP 401, `{"code":"unauthorized"}`.
- `npm run typecheck`: 통과.
- `npm --prefix functions run test`: 통과, 36개 테스트.
- `npm run build`: 통과. Vite chunk size 경고는 기존처럼 발생.
- `firebase emulators:exec --project daily-listen-up --only firestore,storage "npm --prefix functions run seed:sample && npm --prefix functions run verify:sample"`: 미완료. 기존 Emulator가 8080/9199 포트를 사용 중이라 새 Emulator 시작 실패.
- 실행 중인 Emulator 직접 검증:
  - `GCLOUD_PROJECT=daily-listen-up FIREBASE_PROJECT_ID=daily-listen-up ... npm --prefix functions run seed:sample && npm --prefix functions run verify:sample`: 통과.
  - `GCLOUD_PROJECT=daily-listen-up ... npm run firebase:verify-home-entry`: 실패. 기존 실행 중인 Functions Emulator에 `daily-listen-up` endpoint가 로드되어 있지 않아 404.
  - `GCLOUD_PROJECT=daily-listen-up-dev FIREBASE_PROJECT_ID=daily-listen-up-dev ... npm --prefix functions run seed:sample && npm --prefix functions run verify:sample && npm --prefix functions run verify:home-entry && npm --prefix functions run verify:answer-result && npm --prefix functions run verify:today-quiz`: 통과. 기존 실행 중인 Emulator 네임스페이스 기준 로컬 흐름 검증.

## Secret 등록 및 Functions 배포 결과

1. 실제 값을 로컬 터미널에서 입력해 secret을 등록했다. 값은 저장소와 문서에 기록하지 않았다.
   - 등록 secret: `TOSS_PROMOTION_CODE`, `TOSS_MTLS_CERT`, `TOSS_MTLS_KEY`
2. 메타데이터만 확인했다.
   - 세 secret 모두 version 1, ENABLED
3. Functions를 배포했다.
   - 실행 명령: `firebase deploy --only functions --project daily-listen-up`
   - 함수 생성: 성공
   - 남은 운영 설정: Artifact Registry cleanup policy 미설정
4. 배포 URL을 확인했다.
   - `https://asia-northeast3-daily-listen-up.cloudfunctions.net/api`
5. 프론트 환경값에 실제 API base URL을 반영해야 한다.
   - `VITE_APP_API_BASE_URL=https://asia-northeast3-daily-listen-up.cloudfunctions.net/api`

## 실제 Firebase 사용 가능 여부

- Firestore: 사용 가능. 기본 database 생성 및 rules/indexes 배포 완료.
- Storage: 사용 가능. rules 배포 완료.
- Functions: 사용 가능. `api` HTTPS Function이 `asia-northeast3`에 배포됐고, 인증 없는 smoke test에서 JSON 401 응답을 확인했다.

## 프론트 env 반영 필요 값

- `VITE_FIREBASE_API_KEY`: Firebase Console의 Web app config에서 확인.
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase Console의 Web app config에서 확인.
- `VITE_FIREBASE_PROJECT_ID`: `daily-listen-up`.
- `VITE_FIREBASE_STORAGE_BUCKET`: Firebase Console의 Web app config에서 확인.
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase Console의 Web app config에서 확인.
- `VITE_FIREBASE_APP_ID`: Firebase Console의 Web app config에서 확인.
- `VITE_APP_API_BASE_URL`: `https://asia-northeast3-daily-listen-up.cloudfunctions.net/api`.

## Toss 운영 전환 전 남은 항목

- Artifact Registry cleanup policy 보존 기간을 정하고 설정한다.
  - 도움말 확인 명령: `firebase functions:artifacts:setpolicy --help`
  - 예시 형식: `firebase functions:artifacts:setpolicy --location asia-northeast3 --days <보존일수> --project daily-listen-up`
- 프론트 `VITE_APP_API_BASE_URL`에 실제 Functions URL을 반영한다.
- 실제 Toss 운영 요청 전 smoke test는 인증 없는 API, 로그인 토큰 교환 실패 케이스 등 지급이 발생하지 않는 요청으로 먼저 확인한다.
- 실제 Toss 프로모션 지급은 운영 검수/정책과 테스트 대상이 확정되기 전까지 임의 실행하지 않는다.
- Node.js 20 Functions 런타임은 2026-04-30 deprecated, 2026-10-30 decommission 예정이라는 CLI 경고가 있으므로 런타임 업그레이드 계획을 별도 작업으로 잡는다.
