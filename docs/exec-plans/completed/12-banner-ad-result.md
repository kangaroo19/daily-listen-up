# 12. 배너 광고 추가 결과

## 기준 문서

- Active 작업지시서: `docs/exec-plans/active/12-banner-ad.md`
- 직전 완료 문서: `docs/exec-plans/completed/11-firebase-release-secret-manager-setup-result.md`
- 제품 스펙: `docs/product-specs/home.md`, `docs/product-specs/quiz.md`, `docs/product-specs/result.md`
- 광고 연동: `src/integrations/tossAds.ts`, `src/integrations/tossBannerAds.ts`
- 배너 UI: `src/components/TossBannerAd.tsx`
- 환경변수 기준: `.env.example`

## 작업 체크리스트

- [x] 작업 시작 시 `docs/exec-plans/completed/11-firebase-release-secret-manager-setup-result.md`를 읽고 운영 환경값 관련 남은 항목을 반영했다.
  - 근거: 11번 완료 문서의 실제 운영 값 미기록 원칙을 유지했고, 배너 운영 광고 그룹 ID는 저장소에 기록하지 않았다.
- [x] `docs/product-specs/home.md`, `docs/product-specs/quiz.md`, `docs/product-specs/result.md`에 배너 광고 노출 위치와 제외 상태 기준을 반영했다.
  - 근거: 각 문서의 `배너 광고 노출 정책`.
- [x] 필요하면 `docs/product-specs/index.md` 또는 관련 제품 스펙 문서에 배너 광고 정책의 공통 기준을 추가했다.
  - 근거: `docs/product-specs/index.md`는 목차 전용 문서라 중복 공통 정책은 추가하지 않고 화면별 문서에 반영했다.
- [x] `.env.example`에 `VITE_TOSS_BANNER_AD_GROUP_ID`를 추가하고 테스트 ID 기준을 기록했다.
  - 근거: `.env.example`.
- [x] `src/config/clientEnv.ts`에서 배너 광고 그룹 ID를 읽을 수 있게 했다.
  - 근거: `clientEnv.tossBannerAdGroupId`.
- [x] Toss 배너 SDK 초기화를 앱 시작 후 한 번만 수행하는 공통 훅 또는 모듈을 추가했다.
  - 근거: `src/integrations/tossBannerAds.ts`, `src/App.tsx`.
- [x] `TossAds.initialize.isSupported()`와 `TossAds.attachBanner.isSupported()`를 확인한다.
  - 근거: `initializeTossBannerAds()`, `attachTossBannerAd()`.
- [x] 미지원, 초기화 실패, no fill, render 실패 시 사용자 토스트 없이 배너 슬롯을 조용히 비운다.
  - 근거: `src/integrations/tossBannerAds.ts`가 실패 시 `false` 또는 `null`을 반환하고, `TossBannerAd`는 토스트를 호출하지 않는다.
- [x] 배너 컴포넌트 언마운트 시 `destroy()`를 호출해 부착된 배너를 제거한다.
  - 근거: `src/components/TossBannerAd.tsx`.
- [x] 홈 정상 화면에서 Stepper 이후, `시작하기` 버튼 이전에 배너를 배치했다.
  - 근거: `src/screens/HomeScreen.tsx`.
- [x] 문제 풀이 정상 화면에서 선택지 목록 이후, `답안 제출` 버튼 이전에 배너를 배치했다.
  - 근거: `src/screens/QuizScreen.tsx`.
- [x] 결과 정상 화면에서 결과/스크립트 패널 이후, 액션 버튼 묶음 이전에 배너를 배치했다.
  - 근거: `src/screens/ResultScreen.tsx`.
- [x] 로딩 화면과 오류/재시도 화면에는 배너가 렌더링되지 않게 했다.
  - 근거: `QuizScreen`의 로딩/오류 early return에는 `TossBannerAd`를 렌더링하지 않는다. 결과 대체 완료 화면에도 렌더링하지 않는다.
- [x] 배너 슬롯 스타일을 `height: 96px` 기준으로 예약하고 expanded 배너가 화면 전체폭으로 보이게 했다.
  - 근거: `src/styles.css`의 `.toss-banner-ad-slot`.
- [ ] 배너가 하단 CTA, 선택지, 결과 패널, 스크립트 패널과 겹치지 않게 모바일 WebView 기준으로 확인한다.
  - 미완료 사유: 사용자가 UI 검증은 직접 진행한다고 요청했다.
- [x] `npm run typecheck`를 실행했다.
  - 근거: 검증 결과.
- [x] 가능한 경우 `npm run build`를 실행했다.
  - 근거: 검증 결과.
- [ ] Toss 앱 또는 QR 테스트 환경에서 테스트 배너 ID로 렌더링, 클릭 후 복귀, 뒤로가기 동작을 확인한다.
  - 미완료 사유: 실제 Toss 앱 또는 QR 테스트 환경 검증은 사용자가 진행해야 한다.

## 검증 체크리스트

- [ ] 홈 정상 화면에서 배너가 보이고 `시작하기` 버튼을 가리지 않는다.
  - 미완료 사유: 사용자가 UI 검증은 직접 진행한다고 요청했다.
- [ ] 문제 풀이 정상 화면에서 배너가 선택지와 `답안 제출` 버튼 사이에 보이고 풀이 흐름을 막지 않는다.
  - 미완료 사유: 사용자가 UI 검증은 직접 진행한다고 요청했다.
- [ ] 결과 정상 화면에서 배너가 결과 콘텐츠와 액션 버튼 묶음 사이에 보인다.
  - 미완료 사유: 사용자가 UI 검증은 직접 진행한다고 요청했다.
- [x] 로딩 화면과 오류/재시도 화면에는 배너가 없다.
  - 근거: `QuizScreen` 로딩/오류 early return 코드 경로.
- [x] `docs/product-specs/` 내부 문서가 실제 구현된 배너 광고 위치와 제외 상태 기준을 설명한다.
  - 근거: `docs/product-specs/home.md`, `docs/product-specs/quiz.md`, `docs/product-specs/result.md`.
- [x] Toss Ads 배너 API 미지원 환경에서 화면이 비거나 깨지지 않는다.
  - 근거: `TossAds.initialize.isSupported()`와 `TossAds.attachBanner.isSupported()`가 false이면 배너 부착을 중단하고 슬롯만 유지한다.
- [x] 배너 렌더링 실패와 no fill 상태에서 사용자에게 불필요한 토스트가 뜨지 않는다.
  - 근거: 배너 콜백에서 토스트를 호출하지 않는다.
- [x] 배너 컴포넌트 언마운트 시 `destroy()`가 호출된다.
  - 근거: `src/components/TossBannerAd.tsx`.
- [x] 기존 전면형/보상형 광고 흐름과 답안 제출, 재도전, 스크립트 보기 동작이 유지된다.
  - 근거: 기존 `showTossAd()` 함수는 변경하지 않았고 화면 액션 핸들러의 호출 순서를 유지했다.
- [x] 타입 검사 명령이 통과한다.
  - 근거: `npm run typecheck`.
- [x] 프론트 빌드 명령이 통과하거나, 미실행 사유가 completed 문서에 기록된다.
  - 근거: `npm run build`.
- [ ] Toss 앱 또는 QR 테스트 환경의 배너 광고 수동 검증 결과가 completed 문서에 기록된다.
  - 미완료 사유: 실제 Toss 앱 또는 QR 테스트 환경 검증은 사용자가 진행해야 한다.

## 변경 요약

- `VITE_TOSS_BANNER_AD_GROUP_ID`와 개발 기본값 `ait-ad-test-banner-id` 기준을 추가했다.
- `TossAds.initialize`를 앱 시작 후 한 번만 호출하고, `TossAds.attachBanner`로 공통 배너 슬롯에 광고를 붙이는 모듈과 컴포넌트를 추가했다.
- 홈, 문제 풀이 정상 상태, 결과 정상 상태에 배너 슬롯을 배치했다.
- 배너 슬롯은 96px 높이를 예약하고 앱 shell 좌우 20px padding을 상쇄해 expanded 배너가 전체폭으로 보이게 했다.
- 제품 스펙 문서에 화면별 배너 위치와 제외 상태 기준을 추가했다.

## 검증 결과

- `npm run typecheck`: 통과.
- `npm run build`: 통과.
  - 참고: Vite chunk size 경고와 Node `DEP0190` 경고가 출력됐지만 빌드는 성공했다.
- UI 수동 검증: 미실행. 사용자가 직접 진행한다고 요청했다.
- Toss 앱/QR 테스트: 미실행. 실제 Toss 앱 또는 QR 테스트 환경에서 테스트 배너 렌더링, 클릭 후 복귀, 뒤로가기 동작 확인이 필요하다.

## 운영 전환 전 남은 항목

- 실제 배너 광고 그룹 ID를 Toss 콘솔에서 발급받아 배포 환경의 `VITE_TOSS_BANNER_AD_GROUP_ID`로 주입한다.
- 실제 운영 광고 그룹 ID는 저장소, 문서, 로그에 기록하지 않는다.
- Toss 앱 또는 QR 테스트 환경에서 테스트 배너 ID로 렌더링, 클릭 후 복귀, 뒤로가기 동작을 확인한다.
