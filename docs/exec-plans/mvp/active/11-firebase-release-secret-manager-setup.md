# 11. 실제 Firebase 운영 연결과 Secret Manager 배포 준비

## 목적

Emulator 검증을 마친 MVP를 실제 Firebase 프로젝트 `daily-listen-up`에서 Firestore, Storage, Functions를 사용할 수 있는 배포 준비 상태로 전환한다.
로컬 파일 경로 기반 Toss mTLS 설정을 운영 배포에서 Firebase Secret Manager 기반으로 바꾸고, 실제 API URL과 프론트 환경값 반영 기준을 확정한다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/index.md`
- `docs/exec-plans/completed/10-mvp-polish-test-verification-result.md`
- `docs/product-specs/backend.md`
- `firebase.json`
- `.firebaserc`
- `.env.example`
- `functions/src/services/tossLoginClient.ts`
- `functions/src/services/tossPromotionClient.ts`

## 범위

- `.firebaserc` 기본 프로젝트를 실제 Firebase 프로젝트 `daily-listen-up`으로 맞춘다.
- Functions가 운영 배포에서 Firebase Secret Manager 값을 읽어 Toss 로그인/프로모션/mTLS 요청에 사용할 수 있게 한다.
- 로컬 Emulator에서는 기존 파일 경로 기반 설정 또는 개발용 환경변수 흐름을 유지한다.
- Firestore rules/indexes와 Storage rules를 실제 Firebase 프로젝트에 배포한다.
- Functions secrets를 Firebase Secret Manager에 등록하는 명령과 필요한 secret 이름을 확정한다.
- Functions 배포 전후 검증 명령과 실제 Functions API URL을 확인한다.
- 프론트 실제 환경값(`VITE_FIREBASE_*`, `VITE_APP_API_BASE_URL`) 반영 기준을 `.env.example` 또는 별도 문서에 정리한다.

## 제외 범위

- 실제 Toss 운영 키/인증서 값을 저장소에 기록하지 않는다.
- 실제 Toss 프로모션 지급을 임의 실행하지 않는다.
- 새 기능, 새 화면, 관리자 도구, 모니터링 대시보드는 만들지 않는다.
- Firestore/Storage 보안 규칙을 제품 범위 밖으로 과도하게 확장하지 않는다.
- 심사 제출용 스크린샷, 약관/개인정보 문서, Toss 검수 제출 양식 작성은 별도 작업으로 분리한다.

## 확인 필요

- 실제 Firebase 프로젝트 ID는 `daily-listen-up`으로 확인됐고, 기존 `.firebaserc`의 `daily-listen-up-dev`와 다르다.
- Toss mTLS 인증서/개인키는 파일 내용 자체를 Secret Manager에 넣을지, base64 인코딩 값으로 넣을지 결정해야 한다.
- Firebase Functions v2 Secret Param 사용 방식과 현재 Node 런타임/라이브러리 버전의 호환성을 확인해야 한다.
- Secret 등록은 사용자 로컬 Firebase CLI 인증과 프로젝트 권한이 필요하다.
- `TOSS_PROMOTION_CODE`가 민감 secret인지 일반 env인지 운영 정책 확인이 필요하다. 불확실하면 secret으로 다룬다.

## 작업 체크리스트

- [ ] 작업 시작 시 `docs/exec-plans/completed/10-mvp-polish-test-verification-result.md`를 읽고 남은 확인 필요 항목을 반영한다.
- [ ] `.firebaserc`의 default 프로젝트를 `daily-listen-up`으로 수정한다.
- [ ] 현재 Firebase CLI 로그인/프로젝트 접근 권한을 `firebase projects:list` 또는 `firebase use`로 확인한다.
- [ ] Toss 로그인 클라이언트가 Secret Manager 기반 mTLS 인증서/개인키를 사용할 수 있게 수정한다.
- [ ] Toss 프로모션 클라이언트가 Secret Manager 기반 mTLS 인증서/개인키를 사용할 수 있게 수정한다.
- [ ] `TOSS_CLIENT_SECRET`, `TOSS_PROMOTION_CODE`, mTLS 인증서/개인키 secret 이름을 코드와 문서에서 일관되게 정한다.
- [ ] 로컬 Emulator 검증에서 기존 `.env.local` 파일 경로 방식이 깨지지 않는지 확인한다.
- [ ] 실제 secret 값을 저장소, 로그, completed 문서에 남기지 않는다.
- [ ] `.env.example`에 운영/로컬 환경변수 구분과 실제 값 미기록 원칙을 정리한다.
- [ ] Firestore rules/indexes 배포 명령을 실행하거나, 실행하지 못하면 사유와 정확한 명령을 completed 문서에 남긴다.
- [ ] Storage rules 배포 명령을 실행하거나, 실행하지 못하면 사유와 정확한 명령을 completed 문서에 남긴다.
- [ ] Functions secrets 등록 명령을 실행하거나, 실제 secret 값 부재로 실행하지 못하면 필요한 명령과 입력값 목록을 completed 문서에 남긴다.
- [ ] Functions 배포 명령을 실행하거나, 실행하지 못하면 사유와 출시 전 실행 기준을 completed 문서에 남긴다.
- [ ] 배포된 Functions API URL 형식을 확인하고 `VITE_APP_API_BASE_URL`에 반영할 값을 정리한다.
- [ ] 실제 Firebase Web App 설정값(`VITE_FIREBASE_*`)을 어디서 가져오는지 문서화한다.
- [ ] 배포 후 API smoke test 기준을 정리한다.
- [ ] `npm run typecheck`, `npm --prefix functions run test`, `npm run build`를 실행한다.
- [ ] 가능한 경우 Firebase Emulator verify 스크립트도 다시 실행한다.

## 검증 체크리스트

- [ ] `.firebaserc` default가 `daily-listen-up`을 가리킨다.
- [ ] Firestore rules/indexes 배포가 성공했거나, 미실행 사유와 후속 명령이 문서화됐다.
- [ ] Storage rules 배포가 성공했거나, 미실행 사유와 후속 명령이 문서화됐다.
- [ ] Functions가 Secret Manager 값을 사용하도록 코드 경계가 정리됐다.
- [ ] 로컬 Emulator 검증 흐름이 유지된다.
- [ ] 실제 secret 값이 Git diff, 문서, 로그에 포함되지 않았다.
- [ ] Functions 배포가 성공했거나, 미실행 사유와 후속 명령이 문서화됐다.
- [ ] 실제 API URL과 프론트 env 반영 기준이 문서화됐다.
- [ ] 타입 검사, Functions 테스트, 프론트 빌드가 통과한다.
- [ ] 실제 Firebase 배포/설정 결과와 남은 운영 확인 항목이 completed 문서에 기록된다.

## 완료 후 completed 문서 작성 기준

- `docs/exec-plans/completed/11-firebase-release-secret-manager-setup-result.md`를 작성한다.
- 이 active 문서의 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 실제 secret 값은 절대 기록하지 않고, secret 이름과 등록 여부만 기록한다.
- 배포를 실행했다면 실행 명령, 대상 프로젝트, 성공 여부, 확인한 URL을 기록한다.
- 배포를 실행하지 못했다면 권한/값 부재/정책 미확정 등 사유와 출시 전 정확히 실행할 명령을 기록한다.
- 최종적으로 “실제 Firebase 사용 가능 여부”, “프론트 env 반영 필요 값”, “Toss 운영 전환 전 남은 항목”을 문서 끝에 정리한다.
