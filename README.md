# AA Ecommerce Demo — Adobe Launch Skeleton

Adobe Tags(Launch) 데모/교육용 ecommerce Skeleton 앱입니다. React + Vite 기반이며, 3가지 Adobe 태깅 구현 방식을 학습하고 검증할 수 있습니다.

## 기능

- 한국어 ecommerce UI (상품 조회, 장바구니, 결제 플로우, 마이페이지, 회원가입)
- `react-router-dom` 기반 실제 URL 라우팅 — AA/CJA 저니 테스트를 위해 페이지별로 분리됨
- Adobe Client Data Layer (ACDL) 기반 10개 ecommerce 이벤트
- 회원가입 기반 identityMap — 가입 시 입력한 실제 이름/이메일이 모든 XDM 이벤트의 `identityMap`에 반영되며, 비회원 상태에서는 identityMap이 전송되지 않음 (`src/lib/members.ts`)
- Launch embed code placeholder + 환경변수 기반 URL 관리
- 우측 패널에서 이벤트 로그 및 **3가지 구현 방식** 코드 가이드 제공

## 페이지 구조 (라우트)

| 경로 | 페이지 | 마운트 시 트래킹 |
|------|--------|------------------|
| `/` | `HomePage` | `trackPageView('홈페이지')` |
| `/product/:id` | `ProductDetailPage` | `trackProductView` |
| `/event` | `EventPage` | `trackPageView('이벤트페이지')` |
| `/cart` | `CartPage` | `trackCartView` (카트가 비어있지 않을 때만) |
| `/checkout` | `CheckoutPage` | `trackCheckoutStart` |
| `/order-complete` | `OrderCompletePage` | 없음 — `trackPurchase`는 체크아웃 제출 시점에 이미 발생 |
| `/mypage` | `MyPage` | `trackPageView('마이페이지')` |
| `/signup` | `SignUpPage` | `trackPageView('회원가입')` — 가입 제출 시 `trackSignUp` 별도 발생 |

`Layout`(`src/components/Layout.tsx`)이 헤더/카트 상태/분석 로그 패널을 페이지 전환 중에도 유지하며, 각 페이지는 `useMountOnce`(`src/hooks/use-mount-once.ts`)로 StrictMode 이중 호출 없이 정확히 1회만 트래킹 콜을 실행합니다. `BrowserRouter`를 사용하므로 페이지 이동 시 주소창 path가 변경되며, ACDL `page.url`에는 `window.location.pathname`이 포함됩니다.

## 빠른 시작

```bash
pnpm install
cp .env.example .env.development
# .env.development 에 VITE_LAUNCH_URL 설정
pnpm dev
```

## 구현 방식

| 방식 | 설명 | 문서 |
|------|------|------|
| **Launch Extension** (기본) | `adobeDataLayer.push()` + Launch Rules/Extensions | [docs/implementation-launch-extension.md](./docs/implementation-launch-extension.md) |
| AppMeasurement | `s.t()` 직접 호출 (레거시 참고) | [docs/implementation-appmeasurement.md](./docs/implementation-appmeasurement.md) |
| Web SDK | `alloy('sendEvent')` XDM 방식 | [docs/implementation-web-sdk.md](./docs/implementation-web-sdk.md) |

Web SDK XDM 페이로드의 스키마 적합성 점검 결과는 [docs/xdm-schema-audit.md](./docs/xdm-schema-audit.md) 참고.

전체 문서 인덱스: [docs/README.md](./docs/README.md)

## 소스 코드 구조

```
src/
├── analytics/
│   ├── acdl.ts           # adobeDataLayer 초기화 및 push + 회원 정보 기반 identityMap 헬퍼
│   ├── aa.ts             # 10개 ecommerce 이벤트 (ACDL + _aa 매핑, [APP LOG] 콘솔 출력)
│   ├── ecid.ts           # ECID 조회 (Launch 로드 후)
│   ├── target.ts         # Target Offer (at.js)
│   ├── launch-verify.ts  # Launch 연동 상태 콘솔 검증
│   ├── guide-snippets.ts # 구현 가이드 UI용 스니펫
│   └── index.ts          # 통합 export
├── components/
│   ├── Layout.tsx                 # 헤더(가입 상태/identityMap 표시) + 분석 로그 패널 + 카트 상태 (모든 라우트 공통)
│   └── ImplementationGuidePanel.tsx
├── pages/                # 라우트별 페이지 — 위 "페이지 구조" 참고
├── hooks/
│   ├── use-mount-once.ts # StrictMode 안전 1회 실행 훅
│   └── use-store.ts      # 카트/검색어/회원정보/분석로그 공유 상태 (useOutletContext)
├── data/
│   └── products.ts       # 상품 카탈로그 + Product/CartItem 타입
├── lib/
│   ├── utils.ts          # cn / formatPrice / renderStars
│   ├── orders.ts         # 마이페이지 주문내역 (localStorage)
│   └── members.ts        # 회원가입 정보 (localStorage) — identityMap의 데이터 소스
└── App.tsx                # react-router 라우트 테이블
```

사용 예:

```typescript
import { initAdobeDataLayer, trackPageView, trackAddToCart } from "@/analytics";

initAdobeDataLayer();
trackPageView("홈페이지", "ecommerce");
```

## Launch 연동

1. `.env.development`에 Launch URL 설정:

```bash
VITE_LAUNCH_URL=https://assets.adobedtm.com/{ORG}/{PROP}/launch-{ID}-development.min.js
```

2. Launch Property에 Extension 설치: Client Data Layer, Adobe Analytics, ECID, Target
3. [Launch Rule 체크리스트](./docs/launch-rules/)에 따라 Rule 구성
4. Publish 후 Adobe Debugger로 비콘 확인

## 검증

- DevTools: `window.adobeDataLayer`, `window._satellite`
- 데모 앱 우측 패널: **이벤트 로그** / **구현 코드** (AA · Launch · Web SDK)
- Adobe Debugger Chrome Extension

## 빌드

```bash
pnpm build
```

Launch URL 미설정 시 `%VITE_LAUNCH_URL%` 경고는 정상 동작입니다 (console.log만 출력).

정적 호스팅으로 배포할 때는 `/product/1`처럼 직접 URL 접근 시에도 `index.html`로 fallback되도록 서버 설정이 필요합니다. Vite dev/preview 서버는 이 fallback을 기본 제공합니다.

## 기술 스택

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Adobe Client Data Layer (ACDL)
