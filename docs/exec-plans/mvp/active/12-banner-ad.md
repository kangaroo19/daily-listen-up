# 12. 배너 광고 추가

## 목적

홈, 문제 풀이, 결과 화면의 정상 상태에 Toss Ads 배너 광고를 추가해 수익 노출을 늘린다.
배너는 학습 흐름과 하단 주요 액션을 가리지 않게 배치하고, 기존 전면형/보상형 광고 흐름은 변경하지 않는다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/index.md`
- `docs/exec-plans/completed/11-firebase-release-secret-manager-setup-result.md`
- `docs/product-specs/home.md`
- `docs/product-specs/quiz.md`
- `docs/product-specs/result.md`
- `docs/design-docs/style-guidelines.md`
- `src/integrations/tossAds.ts`
- `.env.example`

## 범위

- 클라이언트 환경변수 `VITE_TOSS_BANNER_AD_GROUP_ID`를 추가한다.
- 개발 기본 배너 광고 그룹 ID는 Toss 공식 테스트 ID `ait-ad-test-banner-id`를 사용한다.
- Toss WebView 배너 API의 `TossAds.initialize`를 앱 시작 후 한 번만 호출할 수 있게 한다.
- 공통 배너 컴포넌트 또는 훅을 추가해 `TossAds.attachBanner`로 배너를 DOM 슬롯에 붙인다.
- 홈, 문제 풀이 정상 상태, 결과 정상 상태에만 배너 슬롯을 노출한다.
- 배너 위치는 주요 콘텐츠 이후, 하단 주요 액션 이전으로 둔다.
- 배너는 `variant: "expanded"`, `theme: "auto"`, `tone: "blackAndWhite"` 설정을 사용한다.
- 배너 슬롯은 `height: 96px`를 예약하고, expanded 배너가 화면 전체폭으로 보이도록 현재 좌우 패딩을 상쇄한다.
- 배너 광고 노출 정책과 화면별 배치 기준을 `docs/product-specs/` 내부 관련 문서에 추가하거나 수정한다.

## 제외 범위

- 서버 API, 데이터 모델, 정답 판정, 보상 지급, 진행 상태 로직은 변경하지 않는다.
- 기존 전면형 광고와 보상형 광고 함수 `showTossAd()`의 동작을 변경하지 않는다.
- 로딩 화면, 오류/재시도 화면, 광고 진행 중 전면/보상형 흐름에는 배너를 추가하지 않는다.
- 배너 광고 UI의 문구, 라벨, 색상, 클릭 동작을 임의로 수정하지 않는다.
- 운영 광고 그룹 ID를 저장소에 기록하지 않는다.
- 배너 광고 추가와 무관한 제품 정책, 문구, 화면 흐름은 수정하지 않는다.

## 확인 필요

- Toss 앱 5.241.0 미만에서는 배너 광고 API가 미지원이므로 `isSupported()` 예외 처리가 필요하다.
- 배너 광고는 Toss 앱 또는 QR 테스트 환경에서 실제 렌더링, 클릭 후 복귀, 뒤로가기 동작 확인이 필요하다.
- 로컬 브라우저 환경에서는 Toss Ads 배너 API가 미지원일 수 있으므로 미지원 상태에서 화면이 깨지지 않는지 확인한다.
- 운영 배포 전 실제 배너 광고 그룹 ID를 콘솔에서 발급받아 `VITE_TOSS_BANNER_AD_GROUP_ID`로 주입해야 한다.

## 작업 체크리스트

- [ ] 작업 시작 시 `docs/exec-plans/completed/11-firebase-release-secret-manager-setup-result.md`를 읽고 운영 환경값 관련 남은 항목을 반영한다.
- [ ] `docs/product-specs/home.md`, `docs/product-specs/quiz.md`, `docs/product-specs/result.md`에 배너 광고 노출 위치와 제외 상태 기준을 반영한다.
- [ ] 필요하면 `docs/product-specs/index.md` 또는 관련 제품 스펙 문서에 배너 광고 정책의 공통 기준을 추가한다.
- [ ] `.env.example`에 `VITE_TOSS_BANNER_AD_GROUP_ID`를 추가하고 테스트 ID 기준을 기록한다.
- [ ] `src/config/clientEnv.ts`에서 배너 광고 그룹 ID를 읽을 수 있게 한다.
- [ ] Toss 배너 SDK 초기화를 앱 시작 후 한 번만 수행하는 공통 훅 또는 모듈을 추가한다.
- [ ] `TossAds.initialize.isSupported()`와 `TossAds.attachBanner.isSupported()`를 확인한다.
- [ ] 미지원, 초기화 실패, no fill, render 실패 시 사용자 토스트 없이 배너 슬롯을 조용히 비운다.
- [ ] 배너 컴포넌트 언마운트 시 `destroy()`를 호출해 부착된 배너를 제거한다.
- [ ] 홈 정상 화면에서 Stepper 이후, `시작하기` 버튼 이전에 배너를 배치한다.
- [ ] 문제 풀이 정상 화면에서 선택지 목록 이후, `답안 제출` 버튼 이전에 배너를 배치한다.
- [ ] 결과 정상 화면에서 결과/스크립트 패널 이후, 액션 버튼 묶음 이전에 배너를 배치한다.
- [ ] 로딩 화면과 오류/재시도 화면에는 배너가 렌더링되지 않게 한다.
- [ ] 배너 슬롯 스타일을 `height: 96px` 기준으로 예약하고 expanded 배너가 화면 전체폭으로 보이게 한다.
- [ ] 배너가 하단 CTA, 선택지, 결과 패널, 스크립트 패널과 겹치지 않게 모바일 WebView 기준으로 확인한다.
- [ ] `npm run typecheck`를 실행한다.
- [ ] 가능한 경우 `npm run build`를 실행한다.
- [ ] Toss 앱 또는 QR 테스트 환경에서 테스트 배너 ID로 렌더링, 클릭 후 복귀, 뒤로가기 동작을 확인한다.

## 검증 체크리스트

- [ ] 홈 정상 화면에서 배너가 보이고 `시작하기` 버튼을 가리지 않는다.
- [ ] 문제 풀이 정상 화면에서 배너가 선택지와 `답안 제출` 버튼 사이에 보이고 풀이 흐름을 막지 않는다.
- [ ] 결과 정상 화면에서 배너가 결과 콘텐츠와 액션 버튼 묶음 사이에 보인다.
- [ ] 로딩 화면과 오류/재시도 화면에는 배너가 없다.
- [ ] `docs/product-specs/` 내부 문서가 실제 구현된 배너 광고 위치와 제외 상태 기준을 설명한다.
- [ ] Toss Ads 배너 API 미지원 환경에서 화면이 비거나 깨지지 않는다.
- [ ] 배너 렌더링 실패와 no fill 상태에서 사용자에게 불필요한 토스트가 뜨지 않는다.
- [ ] 배너 컴포넌트 언마운트 시 `destroy()`가 호출된다.
- [ ] 기존 전면형/보상형 광고 흐름과 답안 제출, 재도전, 스크립트 보기 동작이 유지된다.
- [ ] 타입 검사 명령이 통과한다.
- [ ] 프론트 빌드 명령이 통과하거나, 미실행 사유가 completed 문서에 기록된다.
- [ ] Toss 앱 또는 QR 테스트 환경의 배너 광고 수동 검증 결과가 completed 문서에 기록된다.

## 완료 후 completed 문서 작성 기준

- `docs/exec-plans/completed/12-banner-ad-result.md`를 작성한다.
- 이 active 문서의 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 각 체크 항목에는 근거가 되는 파일, 명령, 테스트 또는 수동 검증 결과를 짧게 기록한다.
- 완료하지 못한 항목은 체크하지 않고 미완료 사유와 후속 처리 기준을 적는다.
- 실제 운영 광고 그룹 ID는 기록하지 않고, 테스트 ID 또는 환경변수 이름만 기록한다.
- 제품 스펙 문서를 수정했다면 변경한 문서와 반영한 광고 정책을 요약한다.
- 최종 변경 요약, 실행한 검증 명령, Toss 앱/QR 테스트 필요 여부를 문서 끝에 정리한다.
