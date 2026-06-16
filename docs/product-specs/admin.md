# 관리자페이지

## 목적

운영자가 날짜별 듣기 문제를 등록, 수정, 삭제, 발행할 수 있는 관리 도구를 제공한다.

관리자페이지는 문제 콘텐츠 운영을 위한 별도 웹앱이며, 일반 사용자가 이용하는 Apps in Toss 미니앱 화면과 분리한다.

## 기본 전제

- 관리자 앱은 저장소 내부의 `apps/admin` 디렉토리에 독립 React/Vite 앱으로 만든다.
- 기존 Toss 미니앱의 `src/` 내부에는 관리자 화면을 넣지 않는다.
- 관리자 앱의 퀴즈 CRUD와 오디오 업로드는 Firebase Client SDK만 사용한다.
- 관리자 v1에서는 외부 TTS API를 호출하지 않고 운영자가 준비한 mp3 파일만 업로드한다.
- `quizPool.json` 단일 객체와 일치하는 mp3 파일을 가져와 기존 퀴즈 폼과 저장 흐름으로 등록할 수 있게 한다.
- 관리자 앱은 GitHub Pages 같은 정적 호스팅으로 배포할 수 있어야 한다.
- 기존 사용자 앱은 계속 Firebase Functions API를 통해 문제를 조회하고 답안을 제출한다.

## 관리자 인증

- 관리자 로그인은 Firebase Auth 이메일/비밀번호 방식을 사용한다.
- Firebase Console에서 Email/Password Auth provider를 활성화한다.
- 관리자 계정은 1개로 시작한다.
- 관리자 앱의 Firestore와 Storage **직접 접근 권한**은 관리자 UID allowlist로 제한한다.
- 저장소의 Firestore Rules와 Storage Rules에는 관리자 UID placeholder만 둔다.
- 실제 관리자 UID는 저장소에 커밋하지 않고, 배포 전 운영 환경에서 Rules placeholder를 실제 UID로 치환해 배포한다.
- 관리자 비밀번호를 React 코드, 환경변수, 빌드 산출물에 하드코딩하지 않는다.

## 관리 기능

상세 UI 기준은 `docs/design-docs/admin-dashboard-ui.md`를 따른다.

관리자 앱은 아래 기능을 제공한다.

- 퀴즈 목록 조회
- 날짜별 퀴즈 상세 확인
- 새 퀴즈 등록
- 기존 퀴즈 수정
- 퀴즈 삭제
- 미발행 저장된 퀴즈 발행
- 퀴즈 상세 미리보기
- `quizPool.json` 단일 객체 기반 퀴즈 폼 가져오기
- mp3 오디오 파일 업로드

새 퀴즈는 기본적으로 `isPublished = false` 상태로 저장한다.
이 저장은 부분 입력 초안 저장이 아니라, 완성된 문제를 사용자 앱에 공개하지 않은 상태로 저장하는 미발행 저장이다.
운영자가 별도 발행 액션을 수행해야 사용자 앱에서 오늘 문제로 노출될 수 있다.

오디오는 아래 흐름으로 준비한다.

1. 운영자가 최종 mp3 파일을 직접 준비한다.
2. 수동 입력 시 파일 input으로 mp3 파일을 선택한다.
3. JSON 입력 시 `quizPool.json` 단일 객체에 `quizDate`를 추가해 붙여넣고, JSON의 `audioFileName`과 같은 이름의 mp3 파일을 선택한다.
4. JSON 가져오기는 Firestore 또는 Storage에 즉시 저장하지 않고 기존 퀴즈 폼과 최종 오디오 후보만 채운다.
5. 퀴즈를 저장할 때 선택된 최종 오디오를 Firebase Storage에 업로드하고 `audioStoragePath`를 Firestore에 저장한다.

mp3 파일 자동 생성과 외부 TTS API 호출은 관리자 v1 범위에 포함하지 않는다.

기존 퀴즈의 오디오를 교체할 때는 새 오디오 업로드와 Firestore `audioStoragePath` 저장이 모두 성공한 뒤 기존 Storage 오디오 파일 삭제를 시도한다.
기존 오디오 파일 삭제 실패는 퀴즈 저장 실패로 보지 않고 운영 정리 대상으로 남긴다.

## 퀴즈 데이터 구조

관리자 앱은 Firestore의 아래 문서를 직접 관리한다.

```text
quizzes/{quizDate}
```

퀴즈 문서는 아래 필드를 가진다.

- `quizDate` - 타입: `string`, 역할: KST 기준 문제 날짜. 예: `2026-05-24`
- `isPublished` - 타입: `boolean`, 역할: 사용자 앱 공개 여부
- `audioStoragePath` - 타입: `string`, 역할: Firebase Storage에 저장된 오디오 파일 경로
- `choices` - 타입: `array`, 역할: 선택지 5개. 각 항목은 선택지 ID와 문구를 포함한다
- `correctChoiceIds` - 타입: `array<string>`, 역할: 정답 선택지 ID 목록
- `script` - 타입: `string`, 역할: 광고 보상 후 열람 가능한 듣기 스크립트
- `promotionAmount` - 타입: `number`, 역할: 정답 시 지급할 토스 포인트 금액

오디오 파일은 Firebase Storage의 아래 경로에 저장한다.

```text
quiz-audio/{quizDate}/{fileName}
```

## 검증 기준

관리자 앱은 저장 전 아래 기준을 검증한다.

- 미발행 저장도 완성된 퀴즈 저장이므로 아래 필수 검증을 모두 통과해야 한다.
- `quizDate`는 `YYYY-MM-DD` 형식이어야 한다.
- 선택지는 정확히 5개여야 한다.
- 정답은 최소 1개 이상이어야 한다.
- `correctChoiceIds`는 `choices`에 존재하는 선택지 ID만 포함해야 한다.
- 오디오 파일은 mp3만 허용한다.
- `promotionAmount`는 양수 정수여야 한다.
- 같은 날짜의 퀴즈 문서가 이미 있으면 신규 등록 대신 수정 흐름으로 안내한다.

## 수정과 발행 해제 정책

관리자 앱은 `userProgress` 컬렉션에서 같은 `quizDate`의 진행 기록 존재 여부를 확인한다.

진행 기록이 없는 퀴즈는 아래 작업을 허용한다.

- 모든 퀴즈 필드 수정
- 오디오 교체
- 발행 해제
- Firestore 문서와 필요 시 Storage 오디오 파일 실제 삭제

진행 기록이 있는 퀴즈는 사용자 판정과 보상 기준이 흔들리지 않도록 아래 필드를 수정할 수 없다.

- 선택지 ID
- 선택지 개수
- `correctChoiceIds`
- `promotionAmount`
- 오디오 파일

진행 기록이 있는 퀴즈에서 허용하는 수정은 아래 오탈자 정정으로 제한한다.

- `choices[].text` 오탈자 정정
- 현재 오디오와 의미가 달라지지 않는 `script` 오탈자 또는 표기 정정

모든 퀴즈는 `isPublished = false`로 발행 해제할 수 있다.
진행 기록이 있는 퀴즈는 실제 삭제할 수 없으며, 삭제 대신 발행 해제만 허용한다.
발행 해제는 긴급 중단 액션이며, 일반 사용자 앱의 오늘 문제 신규 조회뿐 아니라 기존 진행자의 재도전과 스크립트 열람도 막는다.
진행 기록이 있는 퀴즈를 수정하거나 발행 해제할 때는 기존 사용자 진행, 보상 기록은 변경되지 않으며 발행 해제 이후 사용자 API에서 해당 퀴즈를 더 이상 공개 문제로 찾지 못할 수 있다는 경고를 표시한다.

퀴즈 버전 관리, 부분 입력 초안 저장, 기존 제출 재채점, 포인트 회수 또는 추가 지급 정책은 v1 범위에 포함하지 않는다.
스크립트와 음성이 달라질 정도의 콘텐츠 수정은 기존 퀴즈 수정이 아니라 새 퀴즈 작성 또는 발행 해제 후 재작성 대상으로 본다.

## 보안 정책

- Firestore Rules는 관리자 UID만 `quizzes` 컬렉션을 읽고 쓸 수 있게 제한한다.
- Firestore Rules는 관리자 UID만 `userProgress` 컬렉션을 읽을 수 있게 제한한다.
- 관리자 앱의 `userProgress` 접근은 v1에서 같은 `quizDate`의 진행 기록 존재 여부 확인에만 사용하며, 생성, 수정, 삭제는 허용하지 않는다.
- `userProgress` 존재 여부 확인은 추후 관리자 전용 Function 또는 날짜별 요약 문서로 축소할 수 있다.
- Storage Rules는 관리자 UID만 `quiz-audio/**` 경로에 업로드, 수정, 삭제할 수 있게 제한한다.
- 일반 앱 사용자는 Firestore와 Storage를 직접 읽거나 쓰지 않는다.
- 일반 앱 사용자는 기존 서버 API를 통해서만 오늘 문제를 조회한다.
- 정답, 스크립트, 포인트 금액, 원본 Storage 경로는 일반 앱의 공개 응답에 포함하지 않는다.
- 토스 로그인, 정답 검증, 포인트 지급, 중복 지급 방지는 기존 Firebase Functions 서버 책임으로 유지한다.
- 외부 TTS API 키와 voice ID는 관리자 앱의 React 코드, 환경변수, 빌드 산출물에 포함하지 않는다.
- 관리자 앱은 오디오 생성을 위한 외부 TTS Function을 호출하지 않는다.

## 배포 기준

- 관리자 앱은 `apps/admin` 기준으로 빌드한다.
- 관리자 앱 전용 Firebase 환경변수는 `apps/admin/.env.example`에 문서화한다.
- GitHub Pages에 배포할 수 있도록 Vite 정적 빌드 산출물을 사용한다.
- 관리자 앱 GitHub Pages 배포는 `gh-pages` 브랜치 수동 배포 방식을 사용한다.
- Pages 빌드는 루트에서 `npm run admin:pages:build`로 실행하며, Vite base 경로는 `/daily-listen-up/admin/`를 사용한다.
- Pages 배포는 루트에서 `npm run admin:pages:deploy`로 실행하며, `apps/admin/dist` 산출물을 `gh-pages` 브랜치의 `admin/` 하위경로에 배포한다.
- 관리자 앱 Pages URL 기준은 `https://kangaroo19.github.io/daily-listen-up/admin/`이다.
- GitHub Pages Source는 `Deploy from a branch`, Branch는 `gh-pages`, Folder는 `/ (root)`를 사용한다.
- GitHub Pages 도메인은 Firebase Auth 승인된 도메인에 등록한다.
- 저장소의 기존 Toss 미니앱 배포 방식과 관리자 앱 배포 방식은 분리한다.

## 아직 확정하지 않는 것

- 관리자 감사 로그
- 다중 관리자 역할과 권한 분리
- 운영 변경 이력 저장 방식
- Firestore Rules 기반 cross-collection 수정/삭제 잠금
- `userProgress` 존재 여부 확인을 위한 관리자 전용 Function 또는 날짜별 요약 문서
- 관리자 앱의 상세 화면 디자인과 컴포넌트 구성
- 외부 TTS 도구와 음성 생성 운영 방식
