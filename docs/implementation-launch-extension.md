# Launch Extension 구현 가이드

이 데모 앱의 **기본 구현 방식**입니다. 클라이언트는 `adobeDataLayer.push()`로 이벤트를 발행하고, Adobe Tags(Launch)의 Rules + Extensions가 AA/ECID/Target 처리를 담당합니다.

## 아키텍처

```
React App (src/analytics/aa.ts)
    │
    ▼ adobeDataLayer.push({ event, page, product, _aa, ... })
    │
Adobe Tags (Launch)
    ├── Client Data Layer Extension  → Rule 트리거
    ├── Data Elements                → event._aa.* 값 추출
    ├── Adobe Analytics Extension    → s.* 변수 설정 + Send Beacon
    ├── ECID Extension               → MID 발급
    └── Target Extension (at.js)     → Offer / mbox
```

## 1. 필수 Extension 설치

Launch Property → **Extensions** → Catalog에서 설치:

| Extension | 역할 |
|-----------|------|
| **Adobe Client Data Layer** | `adobeDataLayer` 이벤트 수신, Rule 트리거 |
| **Adobe Analytics** | AppMeasurement 비콘 전송 (Report Suite 연결) |
| **Experience Cloud ID Service** | ECID(MID) 발급 — `src/analytics/ecid.ts` 연동 |
| **Adobe Target (at.js)** | Offer / mbox — `src/analytics/target.ts` 연동 |

## 2. Embed Code 설정

### index.html

```html
<script src="https://assets.adobedtm.com/{ORG}/{PROP}/launch-{ID}-development.min.js" async></script>
```

### 환경변수 (.env.development)

```bash
VITE_LAUNCH_URL=https://assets.adobedtm.com/YOUR_ORG/YOUR_PROP/launch-SCRIPT_ID-development.min.js
```

환경별 URL 템플릿은 [`.env.example`](../.env.example) 참고.

## 3. Data Element 정의

ACDL 이벤트의 `_aa` 키 또는 표준 객체에서 값을 추출합니다.

| Data Element 이름 | 타입 | 반환 값 |
|-------------------|------|---------|
| ACDL - Event Name | Client Data Layer | `event` (예: "pageView") |
| ACDL - Page Name | Custom Code | `event._aa?.pageName \|\| event.page?.name` |
| ACDL - Channel | Custom Code | `event._aa?.channel \|\| event.page?.channel` |
| ACDL - Products | Custom Code | `event._aa?.products` |
| ACDL - Events | Custom Code | `event._aa?.events` |
| ACDL - Purchase ID | Custom Code | `event._aa?.purchaseID` |
| ACDL - Search Term | Custom Code | `event.search?.term` |
| ACDL - Promo Name | Custom Code | `event.promo?.name` |

> `_aa` 키는 AA Extension 변수 매핑 전용 커스텀 필드입니다. Launch Rule에서 Data Element로 참조합니다.

## 4. Rule 구성 패턴

모든 ecommerce 이벤트 Rule은 동일한 패턴을 따릅니다:

```
Trigger:  Client Data Layer → Specific Event → event equals "{eventName}"
Condition: (선택) page.channel equals "ecommerce"
Actions:
  1) Adobe Analytics → Set Variables (s.pageName = %ACDL - Page Name%, ...)
  2) Adobe Analytics → Send Beacon
```

Link tracking 이벤트(scAdd, scRemove, promoClick)는 **Send Beacon** 대신 link tracking 옵션 사용.

이벤트별 상세 체크리스트: [launch-rules/](./launch-rules/)

## 5. 클라이언트 코드 (ACDL push)

`src/analytics/aa.ts`가 모든 이벤트를 ACDL로 push합니다:

```typescript
import { trackPageView, trackProductView, initAdobeDataLayer } from "@/analytics";

// 앱 시작 시
initAdobeDataLayer();

// 페이지뷰
trackPageView("홈페이지", "ecommerce");

// 상품 조회
trackProductView({ id: "1", sku: "SHOE-001", name: "...", category: "신발", price: 159000 });
```

push되는 payload 예시 (pageView):

```javascript
adobeDataLayer.push({
  event: "pageView",
  page: { name: "홈페이지", channel: "ecommerce" },
  _aa: {
    pageName: "홈페이지",
    channel: "ecommerce",
    prop1: "홈페이지",
    eVar1: "ecommerce",
    events: "event1"
  },
  _timestamp: "2024-05-31T12:00:00.000Z"
});
```

## 6. _aa → AA 변수 매핑 전체표

| _aa 필드 | AA 변수 | 설명 |
|----------|---------|------|
| pageName | s.pageName | 페이지명 |
| channel | s.channel | 채널 |
| products | s.products | 상품 문자열 |
| events | s.events | 이벤트 (prodView, scAdd, purchase 등) |
| purchaseID | s.purchaseID | 주문 ID (중복 방지) |
| transactionID | s.transactionID | 거래 ID |
| prop1~prop8 | s.prop1~s.prop8 | Traffic 변수 |
| eVar1~eVar16 | s.eVar1~s.eVar16 | Conversion 변수 |

이벤트별 상세 매핑은 [implementation-appmeasurement.md](./implementation-appmeasurement.md) 표 참고.

## 7. ECID 연동

```typescript
import { getECID, onLaunchReady } from "@/analytics/ecid";

onLaunchReady(() => {
  getECID().then((mid) => console.log("ECID:", mid));
});
```

- ECID Extension이 `window.Visitor` 또는 `_satellite.getVar('ecid')` 제공
- Launch 로드 전 호출 시 폴링 + 타임아웃 처리 (`ecid.ts`)

## 8. Target 연동

```typescript
import { getAndApplyOffer } from "@/analytics/target";

getAndApplyOffer("homepage-hero", "#hero-banner");
```

- Target Extension (at.js 2.x) 필요
- mbox 이름은 Launch Property에서 생성한 Activity와 일치해야 함

## 9. 검증 체크리스트

- [ ] Launch embed code 로드 확인 (`window._satellite` 존재)
- [ ] `adobeDataLayer.push` 후 배열에 이벤트 추가 확인
- [ ] Adobe Debugger에서 Rule 실행 및 비콘 수신 확인
- [ ] Report Suite에서 eVar/prop/event 데이터 수신 확인
- [ ] ECID(MID) 발급 확인
- [ ] (선택) Target Offer 렌더링 확인

## 10. Launch Extension vs Web SDK

| 항목 | Launch Extension (이 가이드) | Web SDK |
|------|------------------------------|---------|
| 클라이언트 API | `adobeDataLayer.push()` | `alloy('sendEvent')` |
| 데이터 형식 | 커스텀 JSON + `_aa` | XDM 스키마 |
| AA 전송 | AA Extension | Datastream → Experience Event Forwarding |
| AEP 연동 | 별도 설정 | 네이티브 |

Web SDK 방식은 [implementation-web-sdk.md](./implementation-web-sdk.md) 참고.
