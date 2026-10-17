# SPA(Single Page Application) 환경 Adobe Analytics 구현 가이드

React/Vue/Angular 같은 SPA는 라우트 이동 시 **브라우저의 실제 페이지 로드(full page load)가 발생하지 않습니다.**
따라서 `<script>` 삽입 시점에 한 번만 실행되는 전통적인 "페이지 로드 = 페이지뷰" 모델이 그대로 통하지 않고,
**라우트(경로) 변경을 애플리케이션 코드가 직접 감지해서 수동으로 페이지뷰 이벤트를 발생**시켜야 합니다.

이 문서는 위 3가지 구현 방식(AppMeasurement / Launch Extension / Web SDK) 각각에 대해
**SPA에서 어떻게 라우트 변경을 감지하고 페이지뷰·액션 이벤트를 전송하는지** 샘플 코드로 정리합니다.

> 방식별 변수/XDM 매핑 상세는 [implementation-appmeasurement.md](./implementation-appmeasurement.md), [implementation-launch-extension.md](./implementation-launch-extension.md), [implementation-web-sdk.md](./implementation-web-sdk.md)를 참고하세요. 이 문서는 "SPA에서 언제/어떻게 호출하는가"에 집중합니다.

## SPA에서 흔히 겪는 문제

| 문제 | 원인 | 해결 |
|------|------|------|
| 라우트 이동 시 페이지뷰가 안 찍힘 | 최초 `<script>` 로드 시 1회만 `s.t()`/`sendEvent` 호출 | 라우터 이벤트(또는 History API)를 구독해 라우트 변경마다 재호출 |
| 페이지뷰가 2번씩 찍힘 | React 18 `StrictMode`의 개발 모드 mount→unmount→mount 이중 실행, 또는 라우터 리스너 중복 등록 | mount-once 가드 사용, `useEffect` cleanup에서 리스너 해제 |
| `pageName`/`prop1`이 이전 페이지 값으로 남음 | SPA는 `document.title`이 자동 갱신되지 않음 | 라우트 진입 시점에 매번 `pageName`을 명시적으로 세팅 |
| `s.tl()` 남용 | scAdd/scRemove 같은 비페이지뷰 이벤트도 `s.t()`로 보내 페이지뷰가 중복 집계됨 | 페이지 이동이 아닌 이벤트는 `s.tl(true, "o", ...)` 사용 |
| History API `pushState`/`replaceState`는 자체 이벤트를 발생시키지 않음 | 브라우저 스펙상 `popstate`는 뒤로/앞으로가기에서만 발생 | React Router 등 라우터가 제공하는 훅을 쓰거나, `pushState`를 몽키패치해 커스텀 이벤트 dispatch |

이 프로젝트는 React + `react-router-dom`을 사용하므로, 아래 예시는 `useLocation()` 훅으로 라우트 변경을 감지합니다.
(Vue Router `router.afterEach`, Angular `Router.events` 구독, 순수 History API 몽키패치 방식은 각 섹션 하단에 별도로 제공합니다.)

---

## 공통 패턴: 라우트 변경 감지 훅

```tsx
// src/hooks/use-track-page-view.ts (예시)
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * 라우트가 바뀔 때마다 콜백을 실행합니다.
 * SPA 최초 mount 시에도 1회 실행되어 최초 진입 페이지뷰도 함께 커버합니다.
 */
export function useTrackPageView(getPageName: (pathname: string) => string, track: (pageName: string) => void) {
  const location = useLocation();

  useEffect(() => {
    const pageName = getPageName(location.pathname);
    track(pageName);
    // location.pathname이 바뀔 때마다 재실행 (쿼리스트링 변경은 무시하고 싶다면 pathname만 deps에 둠)
  }, [location.pathname]);
}
```

```tsx
// 사용 예: Layout.tsx 또는 각 페이지 컴포넌트
import { useTrackPageView } from "@/hooks/use-track-page-view";
import { trackPageView } from "@/analytics"; // Launch Extension 방식 (이 데모의 기본값)

function pageNameFromPath(pathname: string): string {
  if (pathname === "/") return "홈페이지";
  if (pathname.startsWith("/product/")) return "상품상세";
  if (pathname === "/cart") return "장바구니";
  if (pathname === "/checkout") return "체크아웃";
  return pathname;
}

export function Layout() {
  useTrackPageView(pageNameFromPath, (pageName) => trackPageView(pageName));
  // ...
}
```

이 프로젝트의 실제 구현은 라우트 단위 훅 대신 **각 페이지 컴포넌트에서 [useMountOnce](../src/hooks/use-mount-once.ts)로 `trackPageView`/`trackProductView` 등을 1회 호출**하는 방식을 사용합니다 (예: [ProductDetailPage.tsx](../src/pages/ProductDetailPage.tsx)). React Router는 페이지 컴포넌트를 라우트마다 새로 mount하므로, 컴포넌트 단위 mount-once 호출만으로도 SPA 페이지뷰 추적이 충분합니다.

---

## Case 1 — AppMeasurement (`s.t()` / `s.tl()`) 직접 호출

레거시 방식은 라우트 변경 시 `s` 객체 변수를 새로 세팅하고 `s.t()`를 **명시적으로** 재호출해야 합니다. 최초 페이지 로드 이후 자동 호출은 없습니다.

```tsx
// Adobe Analytics(AppMeasurement)가 window.s로 이미 로드되어 있다고 가정
declare const s: AppMeasurement;

function trackPageViewAM(pageName: string, channel: string) {
  s.pageName = pageName;
  s.channel = channel;
  s.prop1 = pageName;
  s.eVar1 = channel;
  s.events = "event1";
  s.t(); // 페이지뷰: 매 라우트 변경마다 반드시 재호출
}

// React Router 라우트 변경 감지
function useAppMeasurementPageView() {
  const location = useLocation();
  useEffect(() => {
    trackPageViewAM(pageNameFromPath(location.pathname), "ecommerce");
  }, [location.pathname]);
}
```

액션성 이벤트(장바구니 담기 등)는 페이지뷰가 아니므로 `s.tl()`(link tracking)을 사용합니다. `s.t()`를 쓰면 페이지뷰가 중복 집계됩니다.

```tsx
function trackAddToCartAM(sku: string, qty: number, price: number) {
  s.products = `;${sku};${qty};${price * qty}`;
  s.events = "scAdd";
  s.prop3 = "add_to_cart";
  s.tl(true, "o", "Add to Cart"); // "o" = other (커스텀 링크), 페이지뷰로 집계되지 않음
}
```

> **SPA 주의**: `s.linkTrackVars`/`s.linkTrackEvents`를 이전 호출에서 남겨두면 다음 `s.tl()` 호출에 잔존 변수가 섞여 나갈 수 있습니다. 매 호출 전 필요한 변수만 명시적으로 재설정하세요.

---

## Case 2 — Launch Extension (`adobeDataLayer.push`)

이 데모 앱이 채택한 방식입니다. Launch의 **Core → Data Element Change** 또는 **Client Data Layer → Push** 트리거가 `adobeDataLayer` push를 감지해 Rule을 실행하므로, 클라이언트는 라우트 변경 시 `push`만 호출하면 됩니다. AA Extension이 실제 `s.t()`/`s.tl()` 호출을 대신 처리합니다.

```tsx
// src/analytics/aa.ts 발췌 패턴
import { pushToDataLayer } from "@/analytics/acdl";

export function trackPageView(pageName: string, channel = "web") {
  return pushToDataLayer({
    event: "pageView",
    page: { name: pageName, channel, url: window.location.pathname },
    _aa: { pageName, channel, prop1: pageName, eVar1: channel, events: "event1" },
  });
}
```

```tsx
// 라우트 변경 시 호출 (React Router)
function useLaunchPageView() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(pageNameFromPath(location.pathname));
  }, [location.pathname]);
}
```

Launch Rule 측 설정:

```
Trigger:  Core → Client Data Layer: Push (또는 Data Layer: Event, event equals "pageView")
Actions:  Adobe Analytics → Set Variables (pageName, channel, prop1, eVar1)
          Adobe Analytics → Track (Page View)
```

React StrictMode에서 개발 모드일 때 컴포넌트가 mount→unmount→mount로 이중 실행되어 `push`가 2번 호출될 수 있으므로, 이 프로젝트는 [useMountOnce](../src/hooks/use-mount-once.ts)로 가드합니다.

```tsx
// src/pages/ProductDetailPage.tsx 패턴
useMountOnce(() => {
  trackProductView(product);
});
```

---

## Case 3 — Web SDK (`alloy("sendEvent")`)

Web SDK도 자동 페이지뷰 트리거가 없으므로 라우트 변경마다 명시적으로 `sendEvent`를 호출합니다.

```tsx
declare const alloy: (command: string, options?: Record<string, unknown>) => Promise<unknown>;

function trackPageViewXDM(pageName: string, channel = "ecommerce") {
  return alloy("sendEvent", {
    xdm: {
      eventType: "web.webPageDetails.pageViews",
      web: { webPageDetails: { name: pageName, siteSection: channel } },
      _experience: {
        analytics: {
          customDimensions: { props: { prop1: pageName }, eVars: { eVar1: channel } },
        },
      },
    },
  });
}

function useWebSdkPageView() {
  const location = useLocation();
  useEffect(() => {
    trackPageViewXDM(pageNameFromPath(location.pathname));
  }, [location.pathname]);
}
```

액션 이벤트(장바구니 추가 등)도 동일하게 `eventType`만 바꿔 `sendEvent`를 호출하면 됩니다(페이지 로드 여부와 무관하게 매번 독립 이벤트로 전송되므로 `s.t()` vs `s.tl()` 같은 구분이 필요 없습니다):

```tsx
function trackAddToCartXDM(sku: string, name: string, qty: number, priceTotal: number) {
  return alloy("sendEvent", {
    xdm: {
      eventType: "commerce.productListAdds",
      commerce: { productListAdds: { value: 1 } },
      productListItems: [{ SKU: sku, name, quantity: qty, priceTotal, productAddMethod: "add to cart button" }],
    },
  });
}
```

---

## 프레임워크별 라우트 변경 감지 (React 외)

React Router 외 환경에서 페이지뷰 트리거 지점을 잡는 방법입니다. 내부 트래킹 함수(`trackPageView` 등)는 위 3가지 Case와 동일하게 재사용하면 됩니다.

### Vue Router

```javascript
router.afterEach((to) => {
  trackPageView(pageNameFromPath(to.path));
});
```

### Angular Router

```typescript
this.router.events
  .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
  .subscribe((event) => {
    trackPageView(pageNameFromPath(event.urlAfterRedirects));
  });
```

### 순수 History API (프레임워크 라우터 없이 직접 구현한 SPA)

`pushState`/`replaceState`는 브라우저가 자체 이벤트를 발생시키지 않으므로, 몽키패치로 커스텀 이벤트를 만들어야 합니다.

```javascript
function patchHistoryForTracking() {
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(history, args);
    window.dispatchEvent(new Event("spa:navigate"));
  };
  window.addEventListener("popstate", () => window.dispatchEvent(new Event("spa:navigate")));
}

patchHistoryForTracking();
window.addEventListener("spa:navigate", () => {
  trackPageView(pageNameFromPath(location.pathname));
});
```

---

## 체크리스트

- [ ] 최초 진입(첫 mount)과 이후 라우트 변경(뒤로가기 포함) 모두에서 페이지뷰가 1회씩만 발생하는가
- [ ] 페이지 이동이 아닌 이벤트(장바구니, 검색 등)는 `s.t()`가 아닌 `s.tl()` 또는 별도 `sendEvent`로 분리했는가
- [ ] 라우트 변경 시 `pageName`, `prop1`, `eVar1` 등 이전 페이지 값이 남아있지 않고 매번 새로 세팅되는가
- [ ] React StrictMode(dev) 등 이중 mount 환경에서 중복 호출을 막는 가드가 있는가 ([useMountOnce](../src/hooks/use-mount-once.ts) 참고)
- [ ] SPA 라우트 조건(URL path)이 Launch Rule의 "Condition → URL 조건"과 일치하는가 ([launch-rules/](./launch-rules/) 참고)
