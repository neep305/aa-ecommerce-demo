# AA Ecommerce Demo 코드베이스 이해 보고서

작성일: 2026-07-20

## 1. 한눈에 보는 결론

이 저장소는 React 19 + TypeScript + Vite로 만든 한국어 이커머스 데모이며, 핵심 목적은 쇼핑 기능 자체보다 **Adobe Analytics/Tags 교육 및 검증**에 있다. 앱에서 발생하는 9개 이커머스 이벤트를 `window.adobeDataLayer`에 넣고, Adobe Tags(Launch)의 Rule과 Extension이 이를 실제 Adobe Analytics 비콘으로 변환하도록 설계되어 있다.

현재 작업 트리에는 서로 연관되지만 독립적인 두 작업 축이 섞여 있다.

1. 단일 화면 앱을 React Router 기반 멀티페이지 쇼핑 여정으로 분리하는 작업
2. Web SDK 예제의 XDM payload를 실제 스키마에 맞게 감사하고 수정하는 작업

중요하게도 1번은 아직 연결이 끝나지 않았다. `Layout`, `pages`, 공유 store, 주문 저장 모듈은 존재하지만 실제 진입점 `src/App.tsx`는 여전히 기존 649줄짜리 단일 화면 구현이다. 따라서 현재 실행되는 앱에는 `/product/:id`, `/cart`, `/checkout` 등의 라우트가 없고, README의 라우트 설명은 현재 런타임보다 앞서 있다.

## 2. 저장소의 기준 상태와 현재 변경 상태

- 현재 브랜치: `main`
- HEAD: `e404d3a` (`origin/main`과 동일)
- 작업 트리: 다수의 수정/삭제/미추적 파일이 있는 상태
- 마지막 커밋까지의 주요 기반 작업: Adobe Launch/Tags skeleton과 연동 검증 도구
- 로컬 `.env.development`: `VITE_LAUNCH_URL`이 설정되어 있음(값은 이 보고서에 기록하지 않음)

현재 변경은 대략 다음 묶음으로 나뉜다.

### 2.1 멀티페이지 이커머스 리팩터링

추가된 파일:

- `src/components/Layout.tsx`
- `src/pages/{HomePage,ProductDetailPage,EventPage,CartPage,CheckoutPage,OrderCompletePage,MyPage}.tsx`
- `src/hooks/use-store.ts`
- `src/hooks/use-mount-once.ts`
- `src/data/products.ts`
- `src/lib/orders.ts`

관련 수정:

- `react-router-dom@7.18.1` 의존성 추가
- `formatPrice`, `renderStars`를 `src/lib/utils.ts`로 이동
- README에 라우트와 새 소스 구조를 문서화

미완료 지점:

- `src/App.tsx`에 Router/Route 테이블이 없음
- `src/main.tsx`도 기존 `<App />`만 렌더링하며 Router provider가 없음
- 새 `Layout`과 모든 `pages`는 어디에서도 import되지 않음
- 실제 실행 앱은 기존 state 기반 `checkoutStep`과 Dialog/Sheet를 사용하는 단일 화면

### 2.2 XDM 스키마 감사 및 Web SDK 문서 교정

근거 자료:

- `data/schema-sample-Jason Online Behavior Event Schema.json`
- `data/test_payload.json`
- `docs/xdm-schema-audit.md`

수정 방향:

- commerce 이벤트의 `productListItems`를 `commerce.*` 내부가 아니라 XDM 최상위 배열로 이동
- purchase의 `commerce.order` 구조와 payment/currency 필드를 표준 구조로 교정
- 비표준 top-level `search`를 제거하고 `web.webInteraction` + `_experience.analytics.customDimensions`로 검색 정보를 표현
- 존재하지 않는 `promo.promoClicks`를 제거하고 배너 클릭을 `web.webInteraction`으로 표현
- `src/analytics/guide-snippets.ts`와 `docs/implementation-web-sdk.md`를 같은 매핑으로 동기화

스키마 측에는 여전히 코드로 해결할 수 없는 운영 조치가 남는다. 현재 제공된 AEP 스키마에는 Commerce Details와 Adobe Analytics ExperienceEvent Full Extension 필드 그룹이 없으므로, Web SDK 예제를 실제 ingest하려면 해당 필드 그룹을 추가해야 한다.

### 2.3 기타 변경

- `src/analytics/aa.ts`: 9개 이벤트의 콘솔 prefix를 `[AA]`에서 `[APP LOG] [AA]`로 변경
- `index.html`: Vite가 환경변수를 치환하지 않은 `%VITE_LAUNCH_URL%` placeholder인지 판단하는 조건을 단순화
- `src/App.tsx`: 기존 Launch ready 자동 검증 호출(`onLaunchReady` → `verifyLaunchSetup`)을 제거
- `docs/launch-setup-runbook.md`: 작업 트리에서 삭제됨. 그러나 README에는 직접 링크가 없고, 기존 문서 맥락상 Launch 실제 설정 절차를 담은 유용한 문서이므로 삭제 의도 확인이 필요함
- `.cursor/`, `.harness/`, `run_phases.py`, `CLAUDE.md` 등 도구/작업 산출물이 미추적 상태로 존재

## 3. 현재 실제로 실행되는 앱

### 3.1 진입 흐름

`index.html` → `src/main.tsx` → `src/App.tsx`

1. `index.html`이 `VITE_LAUNCH_URL`을 사용해 Adobe Launch 스크립트를 비동기로 주입한다.
2. `main.tsx`가 React StrictMode 아래에서 `App`을 렌더링한다.
3. `App`이 mount되면 `initAdobeDataLayer()`를 실행하고 홈 pageView를 push한다.
4. 상품, 검색, 장바구니, 체크아웃, 구매 동작이 모두 `App` 내부 handler와 local state에서 처리된다.
5. 각 analytics helper는 ACDL event를 push한 뒤 우측 교육용 패널에 표시할 raw AA 매핑을 반환한다.

### 3.2 현재 상태 모델

`App.tsx` 한 파일이 다음 상태를 전부 소유한다.

- `cart`: 장바구니 상품과 수량
- `selectedProduct`: 상품 상세 Dialog 대상
- `searchTerm`, `selectedCategory`: 목록 필터
- `isCartOpen`: 장바구니 Sheet
- `checkoutStep`: 쇼핑(0) / 결제(1) / 완료(2)
- `orderId`: 마지막 주문번호
- `analyticsLog`: 우측 패널 최근 이벤트 50개

현재 상태는 메모리에만 있으며 새로고침 시 사라진다. 새 라우트 리팩터링 쪽에서만 주문 이력을 localStorage에 저장하도록 확장되어 있다.

## 4. 의도된 멀티페이지 구조

`Layout`이 Router outlet의 공통 shell이자 간단한 store 역할을 맡는다.

- 유지 상태: cart, search term, analytics log
- 공통 동작: 검색, 수량 변경, 추가/삭제, promo click, ACDL 초기화, Launch 검증
- 제공 방식: `<Outlet context={storeValue}>`와 `useOutletContext`
- 공통 UI: header, 검색창, 마이페이지/장바구니 링크, 우측 analytics/구현 가이드 패널

페이지별 의도는 다음과 같다.

| 경로 | 역할 | 주요 analytics |
|---|---|---|
| `/` | 상품 목록, 검색 결과, 카테고리, 프로모 배너 | mount `pageView`; category `pageView`; promo click; scAdd |
| `/product/:id` | 상품 상세 | mount `prodView`; scAdd |
| `/event` | 할인 상품 목록 | mount `pageView`; promo click |
| `/cart` | 수량/삭제/결제 이동 | cart가 있을 때 mount `scView`; scAdd/scRemove |
| `/checkout` | 배송 정보 및 결제 | mount `scCheckout`; submit `purchase` |
| `/order-complete` | 구매 결과 | 추가 tracking 없음 |
| `/mypage` | 목업 프로필과 주문 이력 | mount `pageView` |

`useMountOnce`는 React StrictMode 개발 모드의 effect 재실행으로 Adobe event가 중복 발생하는 것을 막는 ref guard다. 페이지 navigation으로 컴포넌트가 실제 unmount 후 다시 mount되면 새 인스턴스이므로 다시 tracking된다.

## 5. 구매 데이터 흐름(의도된 새 구조)

1. `Layout`의 `handleAddToCart`가 cart state를 갱신하고 `scAdd`를 push한다.
2. `/cart` mount 시 현재 cart 전체로 `scView`를 push한다.
3. `/checkout` mount 시 `scCheckout`을 push한다.
4. 결제 버튼이 order ID를 만들고 `purchase`를 먼저 push한다.
5. 같은 cart snapshot을 `localStorage["aa-demo-orders"]`에 최대 50개까지 저장한다.
6. cart를 비우고 order data를 navigation state로 `/order-complete`에 넘긴다.
7. 완료 페이지를 직접 새로고침한 경우 localStorage의 최신 주문을 fallback으로 사용한다.
8. `/mypage`는 mount 당시 주문 목록을 읽어 표시한다.

`CheckoutPage`의 `wasEmptyOnMount`는 구매 중 `clearCart()`로 발생하는 rerender가 `/cart` redirect를 유발하지 않도록 만든 방어 장치다.

## 6. Adobe Analytics 계층

### 6.1 ACDL

`src/analytics/acdl.ts`는 `window.adobeDataLayer`를 배열로 초기화하고, 각 payload에 `_timestamp`를 추가해 push한다. Launch가 늦게 로드되어도 앞서 쌓인 이벤트를 처리할 수 있는 queue 방식이다.

### 6.2 9개 이벤트

`src/analytics/aa.ts`는 다음 이벤트를 발행한다.

- `pageView` → AA `event1`
- `prodView`
- `scAdd`
- `scRemove`
- `scView`
- `scCheckout`
- `purchase`
- `internalSearch` → AA `event2`
- `promoClick` → AA `event3`

각 ACDL payload에는 의미 중심의 `page`, `product`, `cart`, `order`, `search`, `promo` 데이터와 Launch Rule용 `_aa` 매핑이 함께 들어간다. 함수 반환값은 ACDL에 실제 push된 전체 payload가 아니라 우측 UI에 보여줄 AppMeasurement 변수 mapping이다.

### 6.3 Launch/ECID 검증

- `onLaunchReady`: `_satellite`를 최대 10초 동안 polling
- `getECID`: Launch data element `ecid`를 우선 조회하고, org ID가 주어지면 Visitor API를 fallback으로 사용
- `verifyLaunchSetup`: Launch 환경, ECID, 누적 ACDL event 이름을 콘솔 그룹으로 출력

현재 실행 `App.tsx`에서는 이 자동 검증 호출이 제거된 상태다. 반면 아직 연결되지 않은 새 `Layout.tsx`에는 호출이 남아 있다. Router 연결 여부에 따라 Launch verification 동작도 달라지는 상태다.

### 6.4 교육용 구현 가이드

`ImplementationGuidePanel`은 `guide-snippets.ts`의 데이터를 이용해 같은 이벤트를 다음 세 방식으로 비교한다.

- AppMeasurement 직접 호출
- Adobe Launch Extension + ACDL
- Web SDK `alloy("sendEvent")` + XDM

이는 실제 런타임 구현 선택기가 아니라 정적 교육용 코드 예시 패널이다. 앱의 실제 런타임은 ACDL + Launch 방식이다.

## 7. 검증 결과

### 7.1 프로덕션 빌드

`npm run build`: 성공

- TypeScript project build 성공
- Vite bundle 생성 성공
- 경고: 기본 build 환경에서 `%VITE_LAUNCH_URL%`이 정의되지 않음

주의: build 성공은 멀티페이지 작업의 완료를 증명하지 않는다. 새 route 파일들은 import되지 않으므로 실제 bundle/runtime 경로에 포함되지 않은 채 TypeScript 검사만 통과할 수 있다.

### 7.2 린트

`npm run lint`: 실패(8 errors)

- `src/App.tsx`: effect 안에서 analytics log state를 동기 갱신
- shadcn UI 일부: `react-refresh/only-export-components`
- carousel: effect 안의 동기 state 갱신 규칙
- `use-toast.ts`: type 용도로만 쓰이는 값의 unused 경고

따라서 현재 저장소의 quality gate는 build는 통과하지만 lint는 통과하지 않는다. 이 중 다수는 기존 shadcn 생성 코드 이슈이며, 현재 작업에서 새로 생긴 문제와 분리해서 판단해야 한다.

## 8. 주요 리스크와 확인할 사항

1. **문서와 런타임 불일치**: README는 멀티페이지가 완료된 것처럼 서술하지만 실제 앱은 단일 페이지다.
2. **미추적 핵심 코드**: 새 페이지와 store가 모두 untracked라서 커밋/정리 과정에서 쉽게 누락될 수 있다.
3. **Launch 자동 검증 제거 여부**: 기존 App에서는 삭제했지만 새 Layout에는 유지되어 의도가 일관되지 않다.
4. **runbook 삭제 의도**: 실제 Launch 설정에 필요한 문서가 삭제 표시다.
5. **SPA 서버 fallback**: BrowserRouter를 연결하면 `/product/1` 같은 직접 URL 요청을 호스팅 서버가 `index.html`로 fallback하도록 설정해야 한다. Vite dev server만으로는 배포 환경을 보장하지 않는다.
6. **검색 event 과다 발생**: 검색 input의 매 keystroke마다 `internalSearch`가 발생한다. 교육 데모 의도일 수 있으나 실제 분석 환경에서는 debounce 또는 submit 기준이 보통 더 적절하다.
7. **페이지 tracking semantics**: 카테고리 선택도 `pageView`로 발행된다. 실제 URL 이동은 없으므로 분석 설계상 virtual page view인지 명시해야 한다.
8. **사용자 입력 검증 없음**: Checkout form은 표시만 하며 validation/submit model이 없다. 데모 범위라면 정상이나 실제 commerce 기능으로 보면 미완성이다.
9. **cart persistence 없음**: 주문 이력만 localStorage에 저장하며 cart는 새로고침 시 사라진다.
10. **XDM 스키마 운영 조치 필요**: 코드/문서 교정만으로 현재 AEP schema가 commerce payload를 ingest할 수 있는 것은 아니다.
11. **생성 스크립트 재실행 위험**: `.harness` 기록에 따르면 `run_phases.py`를 중복 실행했을 때 import와 주석이 중복 삽입된 전력이 있다. 현 상태에서 이 스크립트를 다시 실행하는 것은 안전한 작업 흐름으로 보이지 않는다.

## 9. 다음 작업 전에 결정할 질문

- 멀티페이지 리팩터링을 실제 `App.tsx`/`main.tsx`에 연결하는 것이 현재 최우선 목표인가?
- 삭제된 `docs/launch-setup-runbook.md`는 의도적으로 제거하는가, 복구하는가?
- Launch verification을 앱 시작 때 자동 실행할 것인가, 수동 진단 도구로만 둘 것인가?
- XDM 문서 변경과 라우팅 리팩터링을 하나의 변경 묶음으로 가져갈 것인가, 별도 커밋/PR로 분리할 것인가?
- 새 route 구조의 배포 대상 서버는 SPA history fallback을 지원하는가?

## 10. 현재 이해에 기반한 작업 경계

지금 단계에서 코드는 수정하지 않았다. 이 보고서만 검토용 산출물로 추가했다. 다음 구현은 사용자가 위 이해를 확인하거나 정정한 뒤 진행하는 것이 안전하다.
