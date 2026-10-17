#!/usr/bin/env python3
"""
run_phases.py — Adobe Launch Skeleton Refactoring
각 phase 함수는 독립적으로 실행 가능하며, run_all()로 전체 순서대로 실행됩니다.
"""

from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
ANALYTICS_DIR = SRC / "analytics"
TYPES_DIR = SRC / "types"


# ---------------------------------------------------------------------------
# Phase 1: src/types/adobe.d.ts — 전역 타입 선언
# ---------------------------------------------------------------------------
def phase_1_create_adobe_types() -> None:
    TYPES_DIR.mkdir(parents=True, exist_ok=True)
    (TYPES_DIR / "adobe.d.ts").write_text(
        '''\
/**
 * adobe.d.ts
 * Adobe Experience Cloud 전역 타입 선언
 * window.adobeDataLayer, window._satellite, window.adobe, window.s
 */

// ---------------------------------------------------------------------------
// Adobe Client Data Layer (ACDL)
// ---------------------------------------------------------------------------
interface ACDLDataLayerEntry {
  [key: string]: unknown;
}

interface ACDLDataLayer extends Array<ACDLDataLayerEntry> {
  push(...items: ACDLDataLayerEntry[]): number;
  getState(reference?: string): Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Adobe Launch / DTM (_satellite)
// ---------------------------------------------------------------------------
interface SatelliteLogger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

interface SatelliteProperty {
  name: string;
  settings: Record<string, unknown>;
}

interface Satellite {
  /** Launch Direct Call Rule 트리거 */
  track(identifier: string, detail?: Record<string, unknown>): void;
  /** Launch 데이터 요소 값 조회 */
  getVar(name: string): unknown;
  /** Launch 데이터 요소 값 설정 */
  setVar(name: string, value: unknown): void;
  /** Launch 규칙 강제 실행 */
  buildInfo: { buildDate: string; environment: string; turbineVersion: string };
  property: SatelliteProperty;
  logger: SatelliteLogger;
  /** ECID 등 Extension 제공 변수 접근 */
  getVisitorId?(): unknown;
}

// ---------------------------------------------------------------------------
// Adobe AppMeasurement (s object)
// ---------------------------------------------------------------------------
interface AppMeasurement {
  pageName: string;
  channel: string;
  server: string;
  pageType: string;
  prop1: string;
  prop2: string;
  prop3: string;
  prop4: string;
  prop5: string;
  prop6: string;
  prop7: string;
  prop8: string;
  eVar1: string;
  eVar2: string;
  eVar3: string;
  eVar4: string;
  eVar5: string;
  eVar6: string;
  eVar7: string;
  eVar8: string;
  eVar9: string;
  eVar10: string;
  eVar11: string;
  eVar12: string;
  eVar13: string;
  eVar14: string;
  eVar15: string;
  eVar16: string;
  products: string;
  events: string;
  purchaseID: string;
  transactionID: string;
  visitorID: string;
  trackingServer: string;
  trackingServerSecure: string;
  /** 페이지뷰 비콘 전송 */
  t(): void;
  /** 링크 트래킹 비콘 전송 */
  tl(obj: boolean | HTMLElement, linkType: string, linkName: string): void;
}

// ---------------------------------------------------------------------------
// Adobe Target (at.js)
// ---------------------------------------------------------------------------
interface AdobeTargetOffer {
  content: string | HTMLElement[];
  type: string;
}

interface AdobeTargetRequestOptions {
  mbox: string;
  params?: Record<string, string>;
  success?: (offer: AdobeTargetOffer) => void;
  error?: (status: string, error: Error) => void;
}

interface AdobeTargetTrackOptions {
  mbox: string;
  params?: Record<string, string>;
}

interface AdobeTarget {
  /** mbox 오퍼 조회 (at.js legacy) */
  getOffer(options: AdobeTargetRequestOptions): void;
  /** mbox 오퍼 적용 */
  applyOffer(options: { mbox: string; offer: AdobeTargetOffer }): void;
  /** Target 이벤트 트래킹 */
  trackEvent(options: AdobeTargetTrackOptions): void;
  /** 뷰 변경 알림 (SPA) */
  triggerView(viewName: string, options?: { page?: boolean }): void;
}

interface AdobeNamespace {
  target?: AdobeTarget;
}

// ---------------------------------------------------------------------------
// ECID / Visitor ID Service
// ---------------------------------------------------------------------------
interface AdobeVisitor {
  /** ECID(MID) 값 조회 */
  getMarketingCloudVisitorID(callback: (id: string) => void, retry?: boolean): string | void;
  /** AAM UUID 조회 */
  getAudienceManagerLocationHint(callback: (hint: number) => void): void;
  /** 동기 ECID (Launch Extension 제공 시) */
  getMarketingCloudVisitorID(): string | void;
}

// ---------------------------------------------------------------------------
// Window 전역 확장
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    /** Adobe Client Data Layer */
    adobeDataLayer: ACDLDataLayer;
    /** Adobe Launch (Tags) Runtime */
    _satellite: Satellite;
    /** Adobe AppMeasurement s 객체 */
    s: AppMeasurement;
    /** Adobe 네임스페이스 (Target at.js) */
    adobe: AdobeNamespace;
    /** ECID Visitor ID Service */
    Visitor: {
      getInstance(orgId: string, config?: Record<string, unknown>): AdobeVisitor;
    };
  }
}

export {};
''',
        encoding="utf-8",
    )
    print("✅ src/types/adobe.d.ts 생성 완료")


# ---------------------------------------------------------------------------
# Phase 2: src/analytics/acdl.ts — ACDL 초기화 및 push 헬퍼
# ---------------------------------------------------------------------------
def phase_2_create_analytics_acdl() -> None:
    ANALYTICS_DIR.mkdir(parents=True, exist_ok=True)
    (ANALYTICS_DIR / "acdl.ts").write_text(
        '''\
/**
 * acdl.ts — Adobe Client Data Layer 초기화 및 push 헬퍼
 *
 * 사용법:
 *   initAdobeDataLayer()  // main.tsx 또는 App.tsx 최상단에서 한 번만 호출
 *   pushToDataLayer({ event: 'prodView', product: { ... } })
 */

// ---------------------------------------------------------------------------
// 타입 정의
// ---------------------------------------------------------------------------
export interface ACDLPageData {
  name: string;
  channel?: string;
  type?: string;
  url?: string;
  referrer?: string;
  language?: string;
}

export interface ACDLProductData {
  id: string;
  sku?: string;
  name: string;
  category?: string;
  price?: number;
  quantity?: number;
  brand?: string;
}

export interface ACDLCartData {
  items: ACDLProductData[];
  totalItems: number;
  totalValue: number;
}

export interface ACDLOrderData {
  id: string;
  totalValue: number;
  items: ACDLProductData[];
  currency?: string;
}

export interface ACDLSearchData {
  term: string;
  resultCount: number;
}

export interface ACDLPromoData {
  name: string;
  position: string;
  creative?: string;
}

export interface ACDLEvent {
  event: string;
  page?: ACDLPageData;
  product?: ACDLProductData;
  cart?: ACDLCartData;
  order?: ACDLOrderData;
  search?: ACDLSearchData;
  promo?: ACDLPromoData;
  /** 추가 임의 데이터 */
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// ACDL 초기화
// ---------------------------------------------------------------------------

/**
 * window.adobeDataLayer 배열을 초기화합니다.
 * Launch 스크립트 로드 이전에 배열을 선언해두면,
 * Launch가 로드된 후 queue에 쌓인 이벤트를 처리합니다.
 */
export function initAdobeDataLayer(): void {
  if (typeof window === "undefined") return;
  if (!Array.isArray(window.adobeDataLayer)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).adobeDataLayer = [];
  }
}

// ---------------------------------------------------------------------------
// Push 헬퍼
// ---------------------------------------------------------------------------

/**
 * adobeDataLayer에 이벤트를 push합니다.
 * ACDL이 초기화되지 않은 경우 자동으로 배열을 생성합니다.
 */
export function pushToDataLayer(event: ACDLEvent): ACDLEvent {
  if (typeof window === "undefined") return event;

  initAdobeDataLayer();

  const payload: ACDLEvent = {
    ...event,
    _timestamp: new Date().toISOString(),
  };

  window.adobeDataLayer.push(payload);
  return payload;
}

/**
 * 현재 adobeDataLayer 상태를 반환합니다.
 * ACDL이 getState()를 지원하는 경우 해당 메서드를 사용하고,
 * 그렇지 않으면 배열 전체를 반환합니다.
 */
export function getDataLayerState(reference?: string): Record<string, unknown> | unknown[] {
  if (typeof window === "undefined") return {};
  if (!Array.isArray(window.adobeDataLayer)) return {};

  if (typeof window.adobeDataLayer.getState === "function") {
    return window.adobeDataLayer.getState(reference);
  }

  return window.adobeDataLayer as unknown as unknown[];
}
''',
        encoding="utf-8",
    )
    print("✅ src/analytics/acdl.ts 생성 완료")


# ---------------------------------------------------------------------------
# Phase 3: src/analytics/aa.ts — Adobe Analytics 이벤트 헬퍼
# ---------------------------------------------------------------------------
def phase_3_create_analytics_aa() -> None:
    ANALYTICS_DIR.mkdir(parents=True, exist_ok=True)
    (ANALYTICS_DIR / "aa.ts").write_text(
        '''\
/**
 * aa.ts — Adobe Analytics (AppMeasurement) 이벤트 헬퍼
 *
 * ACDL 방식으로 이벤트를 push하며, 로그 패널용 rawData를 반환합니다.
 * Launch의 AA Extension이 adobeDataLayer 이벤트를 수신하여
 * 실제 AppMeasurement 비콘을 전송합니다.
 */

import {
  pushToDataLayer,
  type ACDLEvent,
  type ACDLProductData,
} from "./acdl";

// ---------------------------------------------------------------------------
// 내부 타입 (기존 App.tsx 호환)
// ---------------------------------------------------------------------------
interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
}

interface CartItem extends Product {
  quantity: number;
}

// ---------------------------------------------------------------------------
// 페이지뷰
// ---------------------------------------------------------------------------
export function trackPageView(
  pageName: string,
  channel: string = "web"
): Record<string, unknown> {
  const event: ACDLEvent = {
    event: "pageView",
    page: { name: pageName, channel },
    // AppMeasurement 변수 매핑 (Launch Rule에서 참조)
    _aa: {
      pageName,
      channel,
      prop1: pageName,
      eVar1: channel,
      events: "event1",
    },
  };

  const pushed = pushToDataLayer(event);
  console.log("[AA] Page View:", pushed);

  return {
    pageName,
    channel,
    prop1: pageName,
    eVar1: channel,
    events: "event1",
  };
}

// ---------------------------------------------------------------------------
// 상품 조회 (prodView)
// ---------------------------------------------------------------------------
export function trackProductView(product: Product): Record<string, unknown> {
  const pageName = `상품상세:${product.name}`;
  const productData: ACDLProductData = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    price: product.price,
  };

  const event: ACDLEvent = {
    event: "prodView",
    page: { name: pageName, channel: "ecommerce" },
    product: productData,
    _aa: {
      pageName,
      products: `;${product.sku}`,
      events: "prodView",
      prop2: product.category,
      eVar2: product.sku,
      eVar3: product.name,
      eVar4: product.category,
    },
  };

  const pushed = pushToDataLayer(event);
  console.log("[AA] Product View:", pushed);

  return {
    pageName,
    products: `;${product.sku}`,
    events: "prodView",
    prop2: product.category,
    eVar2: product.sku,
    eVar3: product.name,
    eVar4: product.category,
  };
}

// ---------------------------------------------------------------------------
// 장바구니 추가 (scAdd)
// ---------------------------------------------------------------------------
export function trackAddToCart(
  product: Product,
  quantity: number
): Record<string, unknown> {
  const productData: ACDLProductData = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    price: product.price,
    quantity,
  };

  const event: ACDLEvent = {
    event: "scAdd",
    product: productData,
    _aa: {
      products: `;${product.sku};${quantity};${product.price * quantity}`,
      events: "scAdd",
      prop3: "add_to_cart",
      eVar5: product.sku,
      eVar6: quantity.toString(),
    },
  };

  const pushed = pushToDataLayer(event);
  console.log("[AA] Add to Cart:", pushed);

  return {
    products: `;${product.sku};${quantity};${product.price * quantity}`,
    events: "scAdd",
    prop3: "add_to_cart",
    eVar5: product.sku,
    eVar6: quantity.toString(),
  };
}

// ---------------------------------------------------------------------------
// 장바구니 제거 (scRemove)
// ---------------------------------------------------------------------------
export function trackRemoveFromCart(
  product: Product,
  quantity: number
): Record<string, unknown> {
  const event: ACDLEvent = {
    event: "scRemove",
    product: {
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: product.price,
      quantity,
    },
    _aa: {
      products: `;${product.sku};${quantity};${product.price * quantity}`,
      events: "scRemove",
      prop3: "remove_from_cart",
      eVar5: product.sku,
    },
  };

  const pushed = pushToDataLayer(event);
  console.log("[AA] Remove from Cart:", pushed);

  return {
    products: `;${product.sku};${quantity};${product.price * quantity}`,
    events: "scRemove",
    prop3: "remove_from_cart",
    eVar5: product.sku,
  };
}

// ---------------------------------------------------------------------------
// 장바구니 조회 (scView)
// ---------------------------------------------------------------------------
export function trackCartView(cartItems: CartItem[]): Record<string, unknown> {
  const productString = cartItems
    .map((item) => `;${item.sku};${item.quantity};${item.price * item.quantity}`)
    .join(",");
  const totalValue = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const event: ACDLEvent = {
    event: "scView",
    page: { name: "장바구니", channel: "ecommerce" },
    cart: {
      items: cartItems.map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
      })),
      totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      totalValue,
    },
    _aa: {
      pageName: "장바구니",
      products: productString,
      events: "scView",
      prop4: "cart_view",
      eVar7: cartItems.length.toString(),
    },
  };

  const pushed = pushToDataLayer(event);
  console.log("[AA] Cart View:", pushed);

  return {
    pageName: "장바구니",
    products: productString,
    events: "scView",
    prop4: "cart_view",
    eVar7: cartItems.length.toString(),
  };
}

// ---------------------------------------------------------------------------
// 결제 시작 (scCheckout)
// ---------------------------------------------------------------------------
export function trackCheckoutStart(
  cartItems: CartItem[],
  step: number = 1
): Record<string, unknown> {
  const productString = cartItems
    .map((item) => `;${item.sku};${item.quantity};${item.price * item.quantity}`)
    .join(",");
  const totalValue = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const event: ACDLEvent = {
    event: "scCheckout",
    page: { name: `체크아웃:Step${step}`, channel: "ecommerce" },
    cart: {
      items: cartItems.map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
      })),
      totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      totalValue,
    },
    _aa: {
      pageName: `체크아웃:Step${step}`,
      products: productString,
      events: "scCheckout",
      prop5: `checkout_step_${step}`,
      eVar8: totalValue.toString(),
      eVar9: step.toString(),
    },
  };

  const pushed = pushToDataLayer(event);
  console.log("[AA] Checkout Start:", pushed);

  return {
    pageName: `체크아웃:Step${step}`,
    products: productString,
    events: "scCheckout",
    prop5: `checkout_step_${step}`,
    eVar8: totalValue.toString(),
    eVar9: step.toString(),
  };
}

// ---------------------------------------------------------------------------
// 구매 완료 (purchase)
// ---------------------------------------------------------------------------
export function trackPurchase(
  cartItems: CartItem[],
  orderId: string
): Record<string, unknown> {
  const productString = cartItems
    .map((item) => `;${item.sku};${item.quantity};${item.price * item.quantity}`)
    .join(",");
  const totalValue = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const event: ACDLEvent = {
    event: "purchase",
    page: { name: "구매완료", channel: "ecommerce" },
    order: {
      id: orderId,
      totalValue,
      currency: "KRW",
      items: cartItems.map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
      })),
    },
    _aa: {
      pageName: "구매완료",
      products: productString,
      events: "purchase",
      purchaseID: orderId,
      transactionID: orderId,
      prop6: "purchase_complete",
      eVar10: orderId,
      eVar11: totalValue.toString(),
      eVar12: cartItems.length.toString(),
    },
  };

  const pushed = pushToDataLayer(event);
  console.log("[AA] Purchase:", pushed);

  return {
    pageName: "구매완료",
    products: productString,
    events: "purchase",
    purchaseID: orderId,
    transactionID: orderId,
    prop6: "purchase_complete",
    eVar10: orderId,
    eVar11: totalValue.toString(),
    eVar12: cartItems.length.toString(),
  };
}

// ---------------------------------------------------------------------------
// 내부 검색
// ---------------------------------------------------------------------------
export function trackInternalSearch(
  searchTerm: string,
  resultCount: number
): Record<string, unknown> {
  const event: ACDLEvent = {
    event: "internalSearch",
    page: { name: "검색결과", channel: "ecommerce" },
    search: { term: searchTerm, resultCount },
    _aa: {
      pageName: "검색결과",
      prop7: searchTerm,
      eVar13: searchTerm,
      eVar14: resultCount.toString(),
      events: "event2",
    },
  };

  const pushed = pushToDataLayer(event);
  console.log("[AA] Internal Search:", pushed);

  return {
    pageName: "검색결과",
    prop7: searchTerm,
    eVar13: searchTerm,
    eVar14: resultCount.toString(),
    events: "event2",
  };
}

// ---------------------------------------------------------------------------
// 프로모션 클릭
// ---------------------------------------------------------------------------
export function trackPromoClick(
  promoName: string,
  promoPosition: string
): Record<string, unknown> {
  const event: ACDLEvent = {
    event: "promoClick",
    promo: { name: promoName, position: promoPosition },
    _aa: {
      prop8: promoName,
      eVar15: promoName,
      eVar16: promoPosition,
      events: "event3",
    },
  };

  const pushed = pushToDataLayer(event);
  console.log("[AA] Promo Click:", pushed);

  return {
    prop8: promoName,
    eVar15: promoName,
    eVar16: promoPosition,
    events: "event3",
  };
}
''',
        encoding="utf-8",
    )
    print("✅ src/analytics/aa.ts 생성 완료")


# ---------------------------------------------------------------------------
# Phase 4: src/analytics/ecid.ts — ECID 헬퍼
# ---------------------------------------------------------------------------
def phase_4_create_analytics_ecid() -> None:
    ANALYTICS_DIR.mkdir(parents=True, exist_ok=True)
    (ANALYTICS_DIR / "ecid.ts").write_text(
        '''\
/**
 * ecid.ts — ECID (Experience Cloud ID Service) 헬퍼
 *
 * Launch의 ECID Extension이 로드된 후 window.Visitor 또는
 * window._satellite.getVar("ecid") 방식으로 ECID를 조회합니다.
 *
 * ECID Extension은 비동기 로드되므로 Promise 기반 폴링을 사용합니다.
 */

// ---------------------------------------------------------------------------
// ECID 조회 (Promise 기반)
// ---------------------------------------------------------------------------

const POLLING_INTERVAL_MS = 200;
const POLLING_TIMEOUT_MS = 10_000;

/**
 * Launch ECID Extension이 제공하는 ECID(MID)를 비동기로 조회합니다.
 * _satellite.getVar("ecid") 또는 window.Visitor 인스턴스를 통해 조회합니다.
 *
 * @param orgId  Experience Cloud Org ID (예: "XXXXXXXXXXXXXXXXXXXXXXXX@AdobeOrg")
 * @returns      ECID 문자열 또는 null (타임아웃 시)
 */
export function getECID(orgId?: string): Promise<string | null> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    function attempt(): void {
      // 방법 1: _satellite.getVar("ecid")
      if (
        typeof window !== "undefined" &&
        typeof window._satellite !== "undefined" &&
        typeof window._satellite.getVar === "function"
      ) {
        const ecidFromSatellite = window._satellite.getVar("ecid");
        if (ecidFromSatellite && typeof ecidFromSatellite === "string") {
          console.log("[ECID] _satellite.getVar('ecid'):", ecidFromSatellite);
          resolve(ecidFromSatellite);
          return;
        }
      }

      // 방법 2: window.Visitor 인스턴스
      if (
        typeof window !== "undefined" &&
        typeof window.Visitor !== "undefined" &&
        orgId
      ) {
        try {
          const visitor = window.Visitor.getInstance(orgId);
          if (visitor && typeof visitor.getMarketingCloudVisitorID === "function") {
            const ecid = visitor.getMarketingCloudVisitorID();
            if (ecid && typeof ecid === "string") {
              console.log("[ECID] Visitor.getMarketingCloudVisitorID():", ecid);
              resolve(ecid);
              return;
            }
          }
        } catch (e) {
          console.warn("[ECID] Visitor 인스턴스 조회 실패:", e);
        }
      }

      // 타임아웃 체크
      if (Date.now() - startTime >= POLLING_TIMEOUT_MS) {
        console.warn("[ECID] ECID 조회 타임아웃 — Launch가 로드되지 않았을 수 있습니다.");
        resolve(null);
        return;
      }

      setTimeout(attempt, POLLING_INTERVAL_MS);
    }

    attempt();
  });
}

/**
 * Launch 로드 여부를 확인합니다.
 */
export function isLaunchLoaded(): boolean {
  return (
    typeof window !== "undefined" && typeof window._satellite !== "undefined"
  );
}

/**
 * Launch가 로드될 때까지 대기 후 콜백을 실행합니다.
 */
export function onLaunchReady(
  callback: () => void,
  timeoutMs: number = POLLING_TIMEOUT_MS
): void {
  const startTime = Date.now();

  function check(): void {
    if (isLaunchLoaded()) {
      callback();
      return;
    }
    if (Date.now() - startTime >= timeoutMs) {
      console.warn("[ECID] Launch 로드 타임아웃");
      return;
    }
    setTimeout(check, POLLING_INTERVAL_MS);
  }

  check();
}
''',
        encoding="utf-8",
    )
    print("✅ src/analytics/ecid.ts 생성 완료")


# ---------------------------------------------------------------------------
# Phase 5: src/analytics/target.ts — Adobe Target 헬퍼
# ---------------------------------------------------------------------------
def phase_5_create_analytics_target() -> None:
    ANALYTICS_DIR.mkdir(parents=True, exist_ok=True)
    (ANALYTICS_DIR / "target.ts").write_text(
        '''\
/**
 * target.ts — Adobe Target (at.js) 헬퍼
 *
 * Launch의 Target Extension이 로드된 후 window.adobe.target 을 통해
 * getOffer / trackEvent / triggerView 를 래핑합니다.
 *
 * at.js 2.x 기준 구현 (Legacy mbox.js 아님)
 */

// ---------------------------------------------------------------------------
// 타입 (window.adobe.target 사용을 위해 adobe.d.ts에서 전역 선언)
// ---------------------------------------------------------------------------
export interface TargetOfferContent {
  type: string;
  content: string | HTMLElement[];
}

export interface TargetGetOfferOptions {
  mbox: string;
  params?: Record<string, string>;
  timeout?: number;
}

// ---------------------------------------------------------------------------
// Target 유틸리티
// ---------------------------------------------------------------------------

function isTargetAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.adobe !== "undefined" &&
    typeof window.adobe.target !== "undefined"
  );
}

// ---------------------------------------------------------------------------
// getOffer — mbox 오퍼 조회 및 적용
// ---------------------------------------------------------------------------

/**
 * Adobe Target mbox에서 오퍼를 조회하고 적용합니다.
 * at.js가 로드되지 않은 경우 조용히 건너뜁니다.
 *
 * @param mboxName  mbox 이름 (예: "hero-banner-offer")
 * @param params    mbox 파라미터 (key-value 페어)
 * @returns         성공 시 오퍼 내용, 실패 시 null
 */
export function getAndApplyOffer(
  mboxName: string,
  params?: Record<string, string>
): Promise<TargetOfferContent | null> {
  return new Promise((resolve) => {
    if (!isTargetAvailable()) {
      console.warn("[Target] adobe.target 미로드 — at.js가 Launch에 포함되어 있는지 확인하세요.");
      resolve(null);
      return;
    }

    window.adobe.target!.getOffer({
      mbox: mboxName,
      params,
      success(offer) {
        console.log(`[Target] getOffer(${mboxName}) 성공:`, offer);
        window.adobe.target!.applyOffer({ mbox: mboxName, offer });
        resolve(offer as TargetOfferContent);
      },
      error(status, error) {
        console.warn(`[Target] getOffer(${mboxName}) 실패:`, status, error);
        resolve(null);
      },
    });
  });
}

// ---------------------------------------------------------------------------
// trackEvent — Target 전환 이벤트 트래킹
// ---------------------------------------------------------------------------

/**
 * Adobe Target 전환 mbox를 호출합니다.
 * 구매 완료, CTA 클릭 등 목표 전환 이벤트에 사용합니다.
 *
 * @param mboxName  전환 mbox 이름 (예: "order-confirmation")
 * @param params    추가 파라미터 (예: orderId, orderTotal 등)
 */
export function targetTrackEvent(
  mboxName: string,
  params?: Record<string, string>
): void {
  if (!isTargetAvailable()) {
    console.warn("[Target] adobe.target 미로드 — trackEvent 건너뜀");
    return;
  }

  window.adobe.target!.trackEvent({ mbox: mboxName, params });
  console.log(`[Target] trackEvent(${mboxName}):`, params);
}

// ---------------------------------------------------------------------------
// triggerView — SPA 뷰 변경 알림 (React Router 등)
// ---------------------------------------------------------------------------

/**
 * SPA 라우트 변경 시 Target에 뷰 변경을 알립니다.
 * at.js 2.x의 triggerView()를 호출합니다.
 *
 * @param viewName  뷰 이름 (예: "home", "product-detail", "cart")
 * @param isPage    true면 새 페이지로 처리 (기본값: false)
 */
export function triggerTargetView(viewName: string, isPage: boolean = false): void {
  if (!isTargetAvailable()) {
    // SPA 라우팅 중 빈번하게 호출되므로 warn 레벨 아닌 debug 레벨
    console.debug("[Target] adobe.target 미로드 — triggerView 건너뜀:", viewName);
    return;
  }

  window.adobe.target!.triggerView(viewName, { page: isPage });
  console.log(`[Target] triggerView("${viewName}", page=${isPage})`);
}
''',
        encoding="utf-8",
    )
    print("✅ src/analytics/target.ts 생성 완료")


# ---------------------------------------------------------------------------
# Phase 6: src/analytics/index.ts — 통합 export
# ---------------------------------------------------------------------------
def phase_6_create_analytics_index() -> None:
    ANALYTICS_DIR.mkdir(parents=True, exist_ok=True)
    (ANALYTICS_DIR / "index.ts").write_text(
        '''\
/**
 * index.ts — Adobe Analytics 통합 export
 *
 * 사용법:
 *   import { trackPageView, trackProductView, initAdobeDataLayer } from "@/analytics"
 */

// ACDL 초기화 및 push 헬퍼
export {
  initAdobeDataLayer,
  pushToDataLayer,
  getDataLayerState,
} from "./acdl";
export type {
  ACDLEvent,
  ACDLPageData,
  ACDLProductData,
  ACDLCartData,
  ACDLOrderData,
  ACDLSearchData,
  ACDLPromoData,
} from "./acdl";

// Adobe Analytics 이벤트 헬퍼
export {
  trackPageView,
  trackProductView,
  trackAddToCart,
  trackRemoveFromCart,
  trackCartView,
  trackCheckoutStart,
  trackPurchase,
  trackInternalSearch,
  trackPromoClick,
} from "./aa";

// ECID 헬퍼
export { getECID, isLaunchLoaded, onLaunchReady } from "./ecid";

// Adobe Target 헬퍼
export {
  getAndApplyOffer,
  targetTrackEvent,
  triggerTargetView,
} from "./target";
export type { TargetOfferContent, TargetGetOfferOptions } from "./target";
''',
        encoding="utf-8",
    )
    print("✅ src/analytics/index.ts 생성 완료")


# ---------------------------------------------------------------------------
# Phase 7: index.html 수정 — Launch embed code placeholder 추가
# ---------------------------------------------------------------------------
def phase_7_update_index_html() -> None:
    html_path = ROOT / "index.html"
    original = html_path.read_text(encoding="utf-8")

    # <title> 다음 줄에 Launch embed 주석 블록 삽입
    launch_embed_head = """\
    <!-- ADOBE LAUNCH EMBED START -->
    <!-- Adobe Launch (Tags) Embed Code — 운영 환경에 따라 아래 URL을 교체하세요 -->
    <!-- DEV:   https://assets.adobedtm.com/{ORG}/{PROP}/launch-{ID}-development.min.js -->
    <!-- STAGE: https://assets.adobedtm.com/{ORG}/{PROP}/launch-{ID}-staging.min.js    -->
    <!-- PROD:  https://assets.adobedtm.com/{ORG}/{PROP}/launch-{ID}.min.js            -->
    <!-- 환경변수 VITE_LAUNCH_URL 에 Launch URL을 설정하면 아래 스크립트가 활성화됩니다 -->
    <script>
      (function() {
        var launchUrl = "%VITE_LAUNCH_URL%";
        if (launchUrl && launchUrl !== "%VITE_LAUNCH_URL%") {
          var s = document.createElement("script");
          s.src = launchUrl;
          s.async = true;
          document.head.appendChild(s);
        }
      })();
    </script>
    <!-- ADOBE LAUNCH EMBED END -->"""

    updated = original.replace(
        "    <title>aa-ecommerce-demo</title>",
        "    <title>AA Ecommerce Demo — Adobe Launch Skeleton</title>\n" + launch_embed_head,
    )

    html_path.write_text(updated, encoding="utf-8")
    print("✅ index.html Launch embed placeholder 추가 완료")


# ---------------------------------------------------------------------------
# Phase 8: .env.example 생성
# ---------------------------------------------------------------------------
def phase_8_create_env_example() -> None:
    (ROOT / ".env.example").write_text(
        """\
# Adobe Launch (Tags) Embed Code URLs
# 각 환경에 맞는 파일을 .env.development / .env.staging / .env.production 으로 복사하세요

# Development Launch URL
VITE_LAUNCH_URL_DEV=https://assets.adobedtm.com/YOUR_ORG/YOUR_PROP/launch-SCRIPT_ID-development.min.js

# Staging Launch URL
VITE_LAUNCH_URL_STAGE=https://assets.adobedtm.com/YOUR_ORG/YOUR_PROP/launch-SCRIPT_ID-staging.min.js

# Production Launch URL
VITE_LAUNCH_URL_PROD=https://assets.adobedtm.com/YOUR_ORG/YOUR_PROP/launch-SCRIPT_ID.min.js

# 실제 사용 시 아래 단일 변수를 환경별 .env 파일에 설정하세요
# (index.html의 %VITE_LAUNCH_URL% 를 Vite가 빌드 타임에 치환합니다)
VITE_LAUNCH_URL=https://assets.adobedtm.com/YOUR_ORG/YOUR_PROP/launch-SCRIPT_ID-development.min.js
""",
        encoding="utf-8",
    )
    print("✅ .env.example 생성 완료")


# ---------------------------------------------------------------------------
# Phase 9: src/App.tsx 수정 — AdobeAnalytics 인라인 모듈 → analytics/ import
# ---------------------------------------------------------------------------
def phase_9_update_app_tsx() -> None:
    app_path = SRC / "App.tsx"
    content = app_path.read_text(encoding="utf-8")

    # 1) 기존 import 블록 상단에 analytics import 추가
    old_imports = "import { useState, useEffect, useCallback } from 'react'"
    new_imports = (
        "import { useState, useEffect, useCallback } from 'react'\n"
        "import {\n"
        "  initAdobeDataLayer,\n"
        "  trackPageView,\n"
        "  trackProductView,\n"
        "  trackAddToCart,\n"
        "  trackRemoveFromCart,\n"
        "  trackCartView,\n"
        "  trackCheckoutStart,\n"
        "  trackPurchase,\n"
        "  trackInternalSearch,\n"
        "  trackPromoClick,\n"
        "} from '@/analytics'"
    )
    content = content.replace(old_imports, new_imports, 1)

    # 2) AdobeAnalytics 인라인 객체 전체 제거 (라인 79~213)
    #    "// Adobe Analytics Tracking Module" 주석부터 닫는 "}" + 빈 줄까지
    old_aa_block = """\
// Adobe Analytics Tracking Module
const AdobeAnalytics = {
  // Track page view
  trackPageView: (pageName: string, channel: string = 'web') => {
    const data = {
      pageName,
      channel,
      prop1: pageName,
      eVar1: channel,
      events: 'event1' // 페이지뷰 이벤트
    }
    console.log('[AA] Page View:', data)
    return data
  },

  // Track product view (prodView)
  trackProductView: (product: Product) => {
    const data = {
      pageName: `상품상세:${product.name}`,
      products: `;${product.sku}`,
      events: 'prodView',
      prop2: product.category,
      eVar2: product.sku,
      eVar3: product.name,
      eVar4: product.category
    }
    console.log('[AA] Product View:', data)
    return data
  },

  // Track add to cart (scAdd)
  trackAddToCart: (product: Product, quantity: number) => {
    const data = {
      products: `;${product.sku};${quantity};${product.price * quantity}`,
      events: 'scAdd',
      prop3: 'add_to_cart',
      eVar5: product.sku,
      eVar6: quantity.toString()
    }
    console.log('[AA] Add to Cart:', data)
    return data
  },

  // Track remove from cart (scRemove)
  trackRemoveFromCart: (product: Product, quantity: number) => {
    const data = {
      products: `;${product.sku};${quantity};${product.price * quantity}`,
      events: 'scRemove',
      prop3: 'remove_from_cart',
      eVar5: product.sku
    }
    console.log('[AA] Remove from Cart:', data)
    return data
  },

  // Track cart view (scView)
  trackCartView: (cartItems: CartItem[]) => {
    const productString = cartItems
      .map(item => `;${item.sku};${item.quantity};${item.price * item.quantity}`)
      .join(',')
    const data = {
      pageName: '장바구니',
      products: productString,
      events: 'scView',
      prop4: 'cart_view',
      eVar7: cartItems.length.toString()
    }
    console.log('[AA] Cart View:', data)
    return data
  },

  // Track checkout initiation (scCheckout)
  trackCheckoutStart: (cartItems: CartItem[], step: number = 1) => {
    const productString = cartItems
      .map(item => `;${item.sku};${item.quantity};${item.price * item.quantity}`)
      .join(',')
    const totalValue = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const data = {
      pageName: `체크아웃:Step${step}`,
      products: productString,
      events: 'scCheckout',
      prop5: `checkout_step_${step}`,
      eVar8: totalValue.toString(),
      eVar9: step.toString()
    }
    console.log('[AA] Checkout Start:', data)
    return data
  },

  // Track purchase (purchase)
  trackPurchase: (cartItems: CartItem[], orderId: string) => {
    const productString = cartItems
      .map(item => `;${item.sku};${item.quantity};${item.price * item.quantity}`)
      .join(',')
    const totalValue = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const data = {
      pageName: '구매완료',
      products: productString,
      events: 'purchase',
      purchaseID: orderId, // 중복 방지용 고유 ID
      transactionID: orderId,
      prop6: 'purchase_complete',
      eVar10: orderId,
      eVar11: totalValue.toString(),
      eVar12: cartItems.length.toString()
    }
    console.log('[AA] Purchase:', data)
    return data
  },

  // Track internal search
  trackInternalSearch: (searchTerm: string, resultCount: number) => {
    const data = {
      pageName: '검색결과',
      prop7: searchTerm,
      eVar13: searchTerm,
      eVar14: resultCount.toString(),
      events: 'event2' // 내부 검색 이벤트
    }
    console.log('[AA] Internal Search:', data)
    return data
  },

  // Track promotion click
  trackPromoClick: (promoName: string, promoPosition: string) => {
    const data = {
      prop8: promoName,
      eVar15: promoName,
      eVar16: promoPosition,
      events: 'event3' // 프로모션 클릭 이벤트
    }
    console.log('[AA] Promo Click:', data)
    return data
  }
}

// Main App Component"""
    new_aa_block = "// Main App Component"
    content = content.replace(old_aa_block, new_aa_block, 1)

    # 3) AdobeAnalytics.xxx 호출을 직접 함수 호출로 교체
    replacements = [
        ("AdobeAnalytics.trackPageView(", "trackPageView("),
        ("AdobeAnalytics.trackProductView(", "trackProductView("),
        ("AdobeAnalytics.trackAddToCart(", "trackAddToCart("),
        ("AdobeAnalytics.trackRemoveFromCart(", "trackRemoveFromCart("),
        ("AdobeAnalytics.trackCartView(", "trackCartView("),
        ("AdobeAnalytics.trackCheckoutStart(", "trackCheckoutStart("),
        ("AdobeAnalytics.trackPurchase(", "trackPurchase("),
        ("AdobeAnalytics.trackInternalSearch(", "trackInternalSearch("),
        ("AdobeAnalytics.trackPromoClick(", "trackPromoClick("),
    ]
    for old, new in replacements:
        content = content.replace(old, new)

    # 4) useEffect에 initAdobeDataLayer() 초기화 호출 추가
    old_effect = """\
  // Track initial page view
  useEffect(() => {
    const data = trackPageView('홈페이지', 'ecommerce')
    logAnalyticsEvent('pageView', '홈페이지 로드', data)
  }, [logAnalyticsEvent])"""
    new_effect = """\
  // ACDL 초기화 및 초기 페이지뷰 트래킹
  useEffect(() => {
    initAdobeDataLayer()
    const data = trackPageView('홈페이지', 'ecommerce')
    logAnalyticsEvent('pageView', '홈페이지 로드', data)
  }, [logAnalyticsEvent])"""
    content = content.replace(old_effect, new_effect, 1)

    app_path.write_text(content, encoding="utf-8")
    print("✅ src/App.tsx — AdobeAnalytics 인라인 모듈 → analytics/ import 교체 완료")


# ---------------------------------------------------------------------------
# Phase 10: src/main.tsx 수정 — ACDL 배열 초기화 타입 참조 추가
# ---------------------------------------------------------------------------
def phase_10_update_main_tsx() -> None:
    main_path = SRC / "main.tsx"
    content = main_path.read_text(encoding="utf-8")

    old_imports = "import { StrictMode } from 'react'"
    new_imports = (
        "import { StrictMode } from 'react'\n"
        "// Adobe 전역 타입 선언 로드 (window.adobeDataLayer 등)\n"
        "import '@/types/adobe.d'"
    )

    # adobe.d는 .d.ts 파일이므로 직접 import하지 않고 /// reference 방식 또는
    # tsconfig에서 자동 포함되므로, main.tsx에는 ACDL 사전 초기화만 추가
    # (타입 선언 파일은 tsconfig include에서 자동 인식)
    new_content = content.replace(
        "import { StrictMode } from 'react'",
        "import { StrictMode } from 'react'\n// ACDL 배열 사전 초기화 (Launch 로드 이전 이벤트 큐잉)\n// initAdobeDataLayer()는 App.tsx useEffect에서 호출됨",
        1,
    )

    main_path.write_text(new_content, encoding="utf-8")
    print("✅ src/main.tsx — ACDL 초기화 주석 추가 완료")


# ---------------------------------------------------------------------------
# run_all — 모든 phase 순서대로 실행
# ---------------------------------------------------------------------------
def run_all() -> None:
    print("=" * 60)
    print("Adobe Launch Skeleton 리팩토링 시작")
    print("=" * 60)

    phase_1_create_adobe_types()
    phase_2_create_analytics_acdl()
    phase_3_create_analytics_aa()
    phase_4_create_analytics_ecid()
    phase_5_create_analytics_target()
    phase_6_create_analytics_index()
    phase_7_update_index_html()
    phase_8_create_env_example()
    phase_9_update_app_tsx()
    phase_10_update_main_tsx()

    print("=" * 60)
    print("✅ 전체 리팩토링 완료")
    print("=" * 60)
    print()
    print("다음 단계:")
    print("  1. .env.example 을 복사하여 .env.development 생성 후 VITE_LAUNCH_URL 설정")
    print("  2. npm run dev 또는 pnpm dev 로 개발 서버 실행")
    print("  3. 브라우저 콘솔에서 window.adobeDataLayer 이벤트 확인")
    print("  4. Launch Property에서 ACDL 이벤트 기반 Rule 구성")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        phase_name = sys.argv[1]
        fn_map = {
            "phase_1": phase_1_create_adobe_types,
            "phase_2": phase_2_create_analytics_acdl,
            "phase_3": phase_3_create_analytics_aa,
            "phase_4": phase_4_create_analytics_ecid,
            "phase_5": phase_5_create_analytics_target,
            "phase_6": phase_6_create_analytics_index,
            "phase_7": phase_7_update_index_html,
            "phase_8": phase_8_create_env_example,
            "phase_9": phase_9_update_app_tsx,
            "phase_10": phase_10_update_main_tsx,
        }
        fn = fn_map.get(phase_name)
        if fn:
            fn()
        else:
            print(f"알 수 없는 phase: {phase_name}")
            print("사용 가능한 phase:", ", ".join(fn_map.keys()))
            sys.exit(1)
    else:
        run_all()
