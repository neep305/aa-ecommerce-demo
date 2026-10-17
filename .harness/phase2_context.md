---
phase: 2-context
request: |
  현재 이 소스를 모든 Adobe Launch(=Tag)의 Skeleton으로 사용할 수 있도록 구조를 변경.
---

## 프로젝트 구조

```
aa-ecommerce-demo/
├── index.html                      # Vite 진입점 — Launch embed code placeholder 추가 필요
├── vite.config.ts                  # Vite + React 설정 (path alias @/ → src/)
├── .parcelrc                       # Parcel 번들러 설정 (bundle.html 빌드용, 보조 도구)
├── package.json                    # React 19 + Vite 7 + shadcn/ui + Radix UI
├── tailwind.config.js              # shadcn/ui 토큰 기반 Tailwind 설정
├── tsconfig.app.json               # strict + ES2022 + path alias @/*
├── src/
│   ├── main.tsx                    # ReactDOM.createRoot 진입점
│   ├── App.tsx                     # 단일 파일에 모든 로직 집중 (1개 파일 800줄)
│   ├── App.css                     # Vite 기본 CSS (사실상 미사용)
│   ├── index.css                   # Tailwind 베이스 + shadcn/ui CSS 변수
│   ├── lib/utils.ts                # cn() 유틸리티 (clsx + tailwind-merge)
│   ├── hooks/use-toast.ts          # shadcn/ui toast 훅
│   └── components/ui/             # shadcn/ui 컴포넌트 전체 (accordion~tooltip, 30개+)
└── bundle.html                     # Parcel 빌드 결과물 (단일 파일 배포용)
```

## 관련 파일 목록

| 파일 | 수정 필요 여부 | 이유 |
|------|--------------|------|
| `src/App.tsx` | **핵심 리팩토링 대상** | AdobeAnalytics 모듈을 ACDL 방식으로 전환, 파일 분리 필요 |
| `index.html` | **수정 필요** | Launch embed code placeholder + 환경별 주석 추가 |
| `vite.config.ts` | **수정 필요** | `VITE_LAUNCH_URL_*` 환경변수 로드 지원 확인 |
| `package.json` | **수정 필요** | `VITE_LAUNCH_ENV` 등 스크립트에 환경변수 주입 명령 추가 |
| `src/main.tsx` | 소폭 수정 | ACDL 초기화 타입 선언 추가 |
| **신규: `src/analytics/`** | **신규 생성** | ACDL 레이어, AA/ECID/Target 분리 모듈화 |
| **신규: `.env.example`** | **신규 생성** | Launch URL 환경변수 템플릿 |
| **신규: `.env.development`** | **신규 생성** | dev Launch URL |
| `src/App.css` | 선택적 | Vite 기본 스타일 잔재 — 삭제 또는 비워도 무방 |

## 코드 패턴

- **Import 방식**: ES module, path alias `@/` (예: `import { cn } from '@/lib/utils'`)
- **컴포넌트 방식**: 함수형 React 컴포넌트 + hooks (`useState`, `useEffect`, `useCallback`)
- **상태 관리**: 로컬 `useState`만 사용 (Redux/Zustand 없음)
- **스타일**: Tailwind CSS utility class 직접 적용 (CSS-in-JS 없음)
- **타입**: TypeScript strict 모드, 모든 인터페이스 명시적 선언
- **에러 처리**: 현재 try/catch 없음 — analytics 호출 실패에 대한 방어 코드 부재
- **빌드**: Vite(dev/build) + Parcel(bundle.html 단일파일 배포) 병용
- **shadcn/ui**: `@radix-ui/*` + `class-variance-authority` 기반 30개+ UI 컴포넌트

## 현재 Adobe Analytics 구현 분석

### 현재 구조 (AppMeasurement 시뮬레이션 방식)

`src/App.tsx` 내에 `AdobeAnalytics` 객체 리터럴이 인라인으로 정의되어 있음:

```
const AdobeAnalytics = {
  trackPageView, trackProductView, trackAddToCart,
  trackRemoveFromCart, trackCartView, trackCheckoutStart,
  trackPurchase, trackInternalSearch, trackPromoClick
}
```

- 각 메서드가 AppMeasurement `s` 객체 변수명(`pageName`, `products`, `events`, `propN`, `eVarN`, `purchaseID`, `transactionID`)을 키로 하는 plain object를 반환
- 실제 `s.t()` / `s.tl()` 호출 없음 — `console.log('[AA] ...', data)` 로만 출력
- Launch 스크립트(`//assets.adobedtm.com/...`) 로드 코드 없음
- `adobeDataLayer` 전역 배열 미사용
- ECID(Visitor ID Service), Target, ACDL 코드 전혀 없음

### 추적 이벤트 목록 (현재 구현)

| 메서드 | AA Event | 트리거 조건 |
|--------|----------|------------|
| `trackPageView` | `event1` | 페이지 초기 로드, 카테고리 클릭, 홈 이동 |
| `trackProductView` | `prodView` | 상품 카드/제목 클릭 |
| `trackAddToCart` | `scAdd` | 장바구니 담기 버튼 / 수량 증가 |
| `trackRemoveFromCart` | `scRemove` | 삭제 버튼 / 수량 0 이하 / 수량 감소 |
| `trackCartView` | `scView` | 장바구니 시트 열기 |
| `trackCheckoutStart` | `scCheckout` | 결제하기 버튼 |
| `trackPurchase` | `purchase` | 결제 완료하기 버튼 |
| `trackInternalSearch` | `event2` | 검색 입력 (1자 이상) |
| `trackPromoClick` | `event3` | 프로모 배너 클릭 |

### Analytics 로그 UI

우측 패널(`<aside>`)에 `analyticsLog` state로 이벤트 히스토리를 시각화:
- "이벤트 로그" 탭: 타임스탬프 + 이벤트타입 + 상세 + rawData(접기/펼치기)
- "구현 코드" 탭: AppMeasurement 코드 스니펫 정적 표시 (하드코딩)

## 주의사항

1. **단일 파일 800줄 구조**: `App.tsx`에 타입 정의, 샘플 데이터, Analytics 모듈, 컴포넌트가 모두 혼재. 리팩토링 시 import 순환 참조 주의.

2. **Vite + Parcel 병용**: `vite`는 dev/build 용, `parcel`은 `bundle.html` 단일파일 배포용으로 따로 사용 중. 환경변수 방식이 다름 (Vite는 `VITE_*`, Parcel은 별도). `bundle.html` 생성 파이프라인 유지 시 Parcel 쪽 처리 필요.

3. **TypeScript strict 모드**: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` 모두 활성화. 새 파일 추가 시 미사용 export/import 주의.

4. **`window.adobeDataLayer` 타입**: 브라우저 전역에 없는 타입이므로 `src/types/acdl.d.ts` 또는 `src/main.tsx`에 선언 필요.

5. **`window._satellite` (Launch) 타입**: Launch 로드 시 `_satellite.track()` 호출을 위한 타입 선언 추가 필요.

6. **Target mbox 방식 결정**: at.js(레거시 mbox.js 계열) vs Adobe Web SDK(alloy.js) 중 at.js 기준으로 구현 예정. `adobe.target.getOffer()` / `adobe.target.trackEvent()` 타입 선언 필요.

7. **ECID 접근 방식**: Launch의 ECID Extension이 `window.Visitor` 인스턴스를 제공하는 방식 vs `_satellite.getVar('ecid')` 방식 — Launch 로드 이후 접근이므로 비동기 처리 필요.

8. **환경변수 런타임 주입 불가**: Vite의 `import.meta.env.VITE_*`는 빌드 타임에 인라인됨. `bundle.html` 단일파일 배포 시 런타임 환경변수 대신 빌드 시 주입 방식 사용해야 함.

9. **기존 `analyticsLog` UI 유지**: 이벤트 발화를 시각적으로 확인하는 우측 패널은 데모/교육 목적으로 반드시 유지. ACDL 전환 후에도 `adobeDataLayer` push 내용을 동일하게 패널에 표시해야 함.

## 핵심 코드 스니펫

### index.html (현재 — Launch 코드 없음)
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>aa-ecommerce-demo</title>
    <!-- ❌ Launch embed code 없음 -->
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    <!-- ❌ Launch footer code 없음 -->
  </body>
</html>
```

### 현재 AdobeAnalytics 모듈 핵심 패턴 (App.tsx:80~213)
```typescript
const AdobeAnalytics = {
  trackPageView: (pageName: string, channel: string = 'web') => {
    const data = {
      pageName, channel,
      prop1: pageName, eVar1: channel,
      events: 'event1'
    }
    console.log('[AA] Page View:', data)
    return data  // rawData를 UI 패널에 표시하기 위해 반환
  },
  trackPurchase: (cartItems: CartItem[], orderId: string) => {
    const data = {
      pageName: '구매완료',
      products: cartItems.map(i => `;${i.sku};${i.quantity};${i.price * i.quantity}`).join(','),
      events: 'purchase',
      purchaseID: orderId,
      transactionID: orderId,
      // ... eVars
    }
    console.log('[AA] Purchase:', data)
    return data
  }
  // ... 7개 메서드
}
```

### 이벤트 로그 연결 패턴 (App.tsx:227~234)
```typescript
const logAnalyticsEvent = useCallback((eventType: string, details: string, rawData: Record<string, unknown>) => {
  setAnalyticsLog(prev => [{
    timestamp: new Date().toLocaleTimeString('ko-KR'),
    eventType, details, rawData
  }, ...prev].slice(0, 50))
}, [])

// 사용 예시
const data = AdobeAnalytics.trackProductView(product)
logAnalyticsEvent('prodView', `상품 조회: ${product.name}`, data)
```

### 변환 목표: ACDL 방식 (신규)
```typescript
// src/analytics/acdl.ts — 신규 생성
export function pushToDataLayer(event: ACDLEvent): void {
  window.adobeDataLayer = window.adobeDataLayer || []
  window.adobeDataLayer.push(event)
}

// 사용 예 (trackProductView 대체)
pushToDataLayer({
  event: 'prodView',
  product: { id: product.sku, name: product.name, category: product.category, price: product.price },
  page: { name: `상품상세:${product.name}`, channel: 'ecommerce' }
})
```

### 변환 목표: Launch embed placeholder (index.html 신규)
```html
<!-- Adobe Launch Embed Code (Header) -->
<!-- REPLACE: src 값을 Launch Property의 Embed Code URL로 교체하세요 -->
<!-- DEV:   https://assets.adobedtm.com/{org}/{prop}/launch-{id}-development.min.js -->
<!-- STAGE: https://assets.adobedtm.com/{org}/{prop}/launch-{id}-staging.min.js    -->
<!-- PROD:  https://assets.adobedtm.com/{org}/{prop}/launch-{id}.min.js            -->
<script src="%VITE_LAUNCH_URL%" async></script>
```

### 변환 목표: 환경변수 파일 구조
```
.env.development   → VITE_LAUNCH_URL=https://assets.adobedtm.com/.../launch-xxx-development.min.js
.env.staging       → VITE_LAUNCH_URL=https://assets.adobedtm.com/.../launch-xxx-staging.min.js
.env.production    → VITE_LAUNCH_URL=https://assets.adobedtm.com/.../launch-xxx.min.js
.env.example       → VITE_LAUNCH_URL=https://assets.adobedtm.com/YOUR_ORG/YOUR_PROP/launch-SCRIPT_ID.min.js
```

### 변환 목표: 디렉토리 구조
```
src/
├── analytics/
│   ├── index.ts          # 통합 export + logAnalyticsEvent 연동 타입
│   ├── acdl.ts           # ACDL pushToDataLayer + 타입 정의
│   ├── aa.ts             # AA 이벤트 메서드 (ACDL 기반으로 전환)
│   ├── ecid.ts           # ECID 접근 유틸리티 (Launch 로드 후 _satellite 기반)
│   └── target.ts         # Target at.js getOffer/trackEvent 래퍼
├── types/
│   └── adobe.d.ts        # window.adobeDataLayer, window._satellite, window.adobe 타입 선언
├── components/
│   └── ui/               # shadcn/ui (기존 유지)
├── lib/utils.ts          # 기존 유지
├── hooks/use-toast.ts    # 기존 유지
├── App.tsx               # AdobeAnalytics 인라인 모듈 → src/analytics/ import로 교체
├── main.tsx              # ACDL 배열 초기화 추가
└── index.css             # 기존 유지
```
