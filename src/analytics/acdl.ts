/**
 * acdl.ts — Adobe Client Data Layer (ACDL) 통합 관리 모듈
 *
 * ACDL 표준 스펙에 따라 window.adobeDataLayer 배열을 관리하고,
 * 이벤트 및 컨텍스트 데이터를 push합니다.
 *
 * 참조: https://github.com/adobe/adobe-client-data-layer
 */

// ---------------------------------------------------------------------------
// ACDL 이벤트 / 데이터 스키마 인터페이스
// ---------------------------------------------------------------------------

export interface ACDLPageData {
  name: string;
  channel?: string;
  url?: string;
  server?: string;
  language?: string;
}

export interface ACDLProductData {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  quantity?: number;
}

export interface ACDLCartItemData extends ACDLProductData {
  quantity: number;
}

export interface ACDLCartData {
  priceTotal?: number;
  totalValue?: number;
  totalItems?: number;
  items: ACDLCartItemData[];
}

export interface ACDLOrderData {
  purchaseID?: string;
  id?: string;
  priceTotal?: number;
  totalValue?: number;
  currencyCode?: string;
  currency?: string;
  items: ACDLCartItemData[];
}

export interface ACDLSearchData {
  keyword?: string;
  term?: string;
  resultCount: number;
}

export interface ACDLPromoData {
  id?: string;
  name: string;
  position?: string;
  creative?: string;
}

export interface ACDLAAData {
  pageName?: string;
  channel?: string;
  server?: string;
  events?: string;
  products?: string;
  guid?: string;
  prop1?: string;
  prop2?: string;
  prop3?: string;
  prop4?: string;
  prop5?: string;
  prop6?: string;
  prop7?: string;
  prop8?: string;
  prop9?: string;
  prop10?: string;
  eVar1?: string;
  eVar2?: string;
  eVar3?: string;
  eVar4?: string;
  eVar5?: string;
  eVar6?: string;
  eVar7?: string;
  eVar8?: string;
  eVar9?: string;
  eVar10?: string;
  eVar11?: string;
  eVar12?: string;
  eVar13?: string;
  eVar14?: string;
  eVar15?: string;
  eVar16?: string;
  eVar17?: string;
  eVar18?: string;
  [key: string]: unknown;
}

export interface ACDLXDMCommerce {
  productListAdds?: { value: number };
  productListRemovals?: { value: number };
  productListViews?: { value: number };
  productViews?: { value: number };
  checkouts?: { value: number };
  purchases?: { value: number };
  order?: {
    purchaseID?: string;
    priceTotal?: number;
    currencyCode?: string;
  };
}

export interface ACDLXDMProductListItem {
  SKU?: string;
  name?: string;
  quantity?: number;
  priceTotal?: number;
  productAddMethod?: string;
  productCategories?: Array<{ categoryID: string }>;
}

export interface ACDLIdentityMapItem {
  id: string;
  authenticatedState?: string;
  primary?: boolean;
}

export interface ACDLIdentityMap {
  [namespace: string]: ACDLIdentityMapItem[];
}

export interface ACDLUserData {
  guid?: string;
  name?: string;
  email?: string;
  authenticatedState?: string;
}

export interface ACDLXDMData {
  eventType?: string;
  identityMap?: ACDLIdentityMap;
  commerce?: ACDLXDMCommerce;
  productListItems?: ACDLXDMProductListItem[];
  web?: {
    webPageDetails?: {
      name?: string;
      siteSection?: string;
    };
    webInteraction?: {
      name?: string;
      region?: string;
      type?: string;
    };
  };
  _experience?: {
    analytics?: {
      customDimensions?: {
        props?: Record<string, string>;
        eVars?: Record<string, string>;
      };
      event1to100?: Record<string, { value: number }>;
    };
  };
  [key: string]: unknown;
}

export interface ACDLEvent {
  event: string;
  page?: ACDLPageData;
  user?: ACDLUserData;
  product?: ACDLProductData;
  cart?: ACDLCartData;
  order?: ACDLOrderData;
  search?: ACDLSearchData;
  promo?: ACDLPromoData;
  identityMap?: ACDLIdentityMap;
  _aa?: ACDLAAData;
  _xdm?: ACDLXDMData;
  /** 추가 임의 데이터 */
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// 사용자 이덴티티 (회원가입 정보 기반 identityMap) 헬퍼
// ---------------------------------------------------------------------------
import { getMember } from "@/lib/members";

export interface UserIdentity {
  name: string;
  email: string;
  guid: string;
}

/**
 * 회원가입 정보(src/lib/members.ts)에서 현재 사용자 아이덴티티를 읽어옵니다.
 * 가입 전(비회원)에는 빈 값을 반환하며, 이 경우 identityMap은 전송되지 않습니다.
 */
export function getUserIdentity(): UserIdentity {
  const member = getMember();
  return {
    name: member?.name ?? "",
    email: member?.email ?? "",
    guid: member?.guid ?? "",
  };
}

export function getUserName(): string {
  return getUserIdentity().name;
}

export function getUserEmail(): string {
  return getUserIdentity().email;
}

export function getUserGuid(): string {
  return getUserIdentity().guid;
}

export function buildIdentityMap(email?: string, name?: string, guid?: string): ACDLIdentityMap | undefined {
  const targetEmail = email !== undefined ? email : getUserEmail();
  const targetName = name !== undefined ? name : getUserName();
  const targetGuid = guid !== undefined ? guid : getUserGuid();

  if (
    (!targetEmail || !targetEmail.trim()) &&
    (!targetName || !targetName.trim()) &&
    (!targetGuid || !targetGuid.trim())
  ) {
    return undefined;
  }

  const identityMap: ACDLIdentityMap = {};

  if (targetGuid && targetGuid.trim()) {
    identityMap.guid = [
      {
        id: targetGuid.trim(),
        primary: true,
        authenticatedState: "authenticated",
      },
    ];
  }

  if (targetEmail && targetEmail.trim()) {
    identityMap.email = [
      {
        id: targetEmail.trim(),
        primary: false,
        authenticatedState: "authenticated",
      },
    ];
  }

  if (targetName && targetName.trim()) {
    identityMap.name = [
      {
        id: targetName.trim(),
        primary: false,
        authenticatedState: "authenticated",
      },
    ];
  }

  return identityMap;
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

  // 로그인 상태인 경우 초기 state에 유저 컨텍스트 및 identityMap 세팅
  const identity = getUserIdentity();
  if (identity.guid || identity.email) {
    const identityMap = buildIdentityMap();
    window.adobeDataLayer.push({
      user: {
        guid: identity.guid,
        name: identity.name,
        email: identity.email,
        authenticatedState: "authenticated",
      },
      ...(identityMap ? { identityMap } : {}),
    });
  }
}

// ---------------------------------------------------------------------------
// Push 헬퍼
// ---------------------------------------------------------------------------

/**
 * adobeDataLayer에 이벤트를 push합니다.
 * 로그인된 상태라면 항상 guid / identityMap / user 객체를 dataLayer에 보장합니다.
 */
export function pushToDataLayer(event: ACDLEvent): ACDLEvent {
  if (typeof window === "undefined") return event;

  initAdobeDataLayer();

  const isLogoutEvent = event.event === "logout";
  const identity = getUserIdentity();
  const isLoggedIn = !isLogoutEvent && Boolean(identity.guid || identity.email);
  const currentIdentityMap = isLoggedIn ? buildIdentityMap() : undefined;

  const payload: ACDLEvent = {
    ...event,
    _timestamp: new Date().toISOString(),
  };

  // 로그인 상태인 경우 항상 user 컨텍스트 및 identityMap 매핑
  if (isLoggedIn) {
    if (!payload.user) {
      payload.user = {
        guid: identity.guid,
        name: identity.name,
        email: identity.email,
        authenticatedState: "authenticated",
      };
    }
    if (!payload.identityMap && currentIdentityMap) {
      payload.identityMap = currentIdentityMap;
    }
    if (payload._aa) {
      if (identity.guid && !payload._aa.eVar18) {
        payload._aa.eVar18 = identity.guid;
      }
      if (identity.guid && !payload._aa.guid) {
        payload._aa.guid = identity.guid;
      }
      if (identity.email && !payload._aa.eVar17) {
        payload._aa.eVar17 = identity.email;
      }
    }
    if (payload._xdm) {
      if (!payload._xdm.identityMap && currentIdentityMap) {
        payload._xdm.identityMap = currentIdentityMap;
      }
      if (identity.guid) {
        const xdmExp = payload._xdm._experience?.analytics?.customDimensions;
        if (xdmExp?.eVars && !xdmExp.eVars.eVar18) {
          xdmExp.eVars.eVar18 = identity.guid;
        }
      }
    }
  }

  window.adobeDataLayer.push(payload);
  return payload;
}

/**
 * 로그아웃 시 adobeDataLayer를 초기화합니다.
 * 누적된 큐를 비우고 사용자 컨텍스트(user, identityMap)를 리셋합니다.
 */
export function resetAdobeDataLayer(): void {
  if (typeof window === "undefined") return;

  if (!Array.isArray(window.adobeDataLayer)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).adobeDataLayer = [];
    return;
  }

  // 1. 기존 누적된 큐 배열 클리어
  window.adobeDataLayer.length = 0;

  // 2. dataLayer 상태 초기화 (user 및 identityMap 제거)
  window.adobeDataLayer.push({
    user: null,
    identityMap: null,
    _timestamp: new Date().toISOString(),
  });
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
