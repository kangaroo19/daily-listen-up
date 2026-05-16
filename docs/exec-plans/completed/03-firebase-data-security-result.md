# 3. Firestore/Storage 데이터 모델 및 보안 기준 구현 결과

## 작업 요약

- Firebase 설정 파일과 Firestore/Storage 기본 차단 rules를 추가했다.
- 서버 전용 Firebase Admin 초기화 모듈을 추가했다.
- Firestore 컬렉션 이름 상수와 컬렉션별 문서 타입 기준을 추가했다.
- Storage 오디오 경로 helper를 추가했다.
- `.env.example`에 Firebase project, emulator, service account 환경변수 기준을 보강했다.

## 변경 파일

- `firebase.json`
- `firestore.rules`
- `storage.rules`
- `firestore.indexes.json`
- `.env.example`
- `server/src/firebase/admin.ts`
- `server/src/firebase/admin.test.ts`
- `server/src/firebase/collections.ts`
- `server/src/firebase/collections.test.ts`
- `server/src/firebase/storagePaths.ts`
- `server/src/firebase/storagePaths.test.ts`
- `package.json`
- `package-lock.json`

## 완료 기준 확인

- [x] `firebase.json`, `firestore.rules`, `storage.rules`, `firestore.indexes.json` 파일이 존재한다.
  - 확인 파일: `firebase.json`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`

- [x] 서버 Firebase Admin 초기화 모듈이 `server/` 아래에 분리되어 있다.
  - 확인 파일: `server/src/firebase/admin.ts`
  - 확인 명령: `npm run typecheck:server`

- [x] Firestore 컬렉션 이름 기준이 서버 코드에서 재사용 가능한 형태로 존재한다.
  - 확인 파일: `server/src/firebase/collections.ts`
  - 확인 명령: `npm run test:server`

- [x] Storage 오디오 경로 기준이 서버 코드에서 재사용 가능한 형태로 존재한다.
  - 확인 파일: `server/src/firebase/storagePaths.ts`
  - 확인 명령: `npm run test:server`

- [x] `.env.example`에 Firebase 관련 환경변수 이름이 있고 실제 secret 값은 없다.
  - 확인 파일: `.env.example`
  - 포함 변수: `FIREBASE_PROJECT_ID`, `FIRESTORE_EMULATOR_HOST`, `FIREBASE_STORAGE_EMULATOR_HOST`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

- [x] Firestore rules가 기본 차단 정책을 표현한다.
  - 확인 파일: `firestore.rules`
  - 기준: 모든 document read/write를 `false`로 차단

- [x] Storage rules가 기본 차단 정책을 표현한다.
  - 확인 파일: `storage.rules`
  - 기준: 모든 object read/write를 `false`로 차단

- [x] 클라이언트 코드가 Firebase Admin 모듈을 import하지 않는다.
  - 확인 명령: `rg "firebase-admin|server/src/firebase|src/firebase/admin|initializeFirebaseAdmin|getFirebaseFirestore|getFirebaseStorage" src server --glob "!server/src/firebase/*.test.ts"`
  - 확인 결과: Firebase Admin import는 `server/src/firebase/admin.ts`에만 존재

- [x] 기존 2번 `/api/health` 서버 흐름이 깨지지 않는다.
  - 확인 명령: `npm run dev:server` 백그라운드 실행 후 `GET /api/health` 호출
  - 확인 결과: `{ "ok": true, "service": "daily-listen-up-server" }`

- [x] 4번 Toss 로그인 서버 연동과 7번 오늘 문제 조회 API가 이 구조를 사용할 수 있다.
  - 확인: `getFirebaseFirestore`, `getFirebaseStorage`, `FIRESTORE_COLLECTIONS`, `getQuizAudioStoragePath`를 서버 코드에서 재사용 가능하게 분리

## 실행한 검증 명령

- `npm run test:server`
- `npm run typecheck:server`
- `npm run lint`
- `npm run build`
- `npm run dev:server` 백그라운드 실행 후 `GET /api/health` 호출
- `rg "firebase-admin|server/src/firebase|src/firebase/admin|initializeFirebaseAdmin|getFirebaseFirestore|getFirebaseStorage" src server --glob "!server/src/firebase/*.test.ts"`

## 참고 사항

- 실제 Firebase 운영 프로젝트 연결, service account key 커밋, seed 데이터 생성, 오디오 업로드는 작업지시서 제외 범위라 수행하지 않았다.
- `firebase-admin` 설치 과정에서 기존 Apps in Toss 하위 의존성 peer dependency 경고와 audit 취약점 알림이 출력되었다. 이번 작업 범위와 직접 관련이 없어 별도 수정하지 않았다.
