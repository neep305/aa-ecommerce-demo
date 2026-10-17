/**
 * index.ts — Adobe Analytics 통합 export
 *
 * 사용법:
 *   import { trackPageView, trackProductView, initAdobeDataLayer } from "@/analytics"
 */

// ACDL 초기화 및 push 헬퍼
export {
  initAdobeDataLayer,
  resetAdobeDataLayer,
  pushToDataLayer,
  getDataLayerState,
  getUserEmail,
  getUserName,
  getUserGuid,
  getUserIdentity,
  buildIdentityMap,
} from "./acdl";
export type { UserIdentity } from "./acdl";
export type {
  ACDLEvent,
  ACDLPageData,
  ACDLProductData,
  ACDLCartData,
  ACDLOrderData,
  ACDLSearchData,
  ACDLPromoData,
  ACDLXDMData,
  ACDLXDMCommerce,
  ACDLXDMProductListItem,
  ACDLIdentityMap,
  ACDLIdentityMapItem,
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
  trackSignUp,
  trackLogin,
  trackLogout,
} from "./aa";

// ECID 헬퍼
export { getECID, isLaunchLoaded, onLaunchReady } from "./ecid";

// Launch 연동 검증
export { verifyLaunchSetup } from "./launch-verify";
export type { LaunchVerifyResult } from "./launch-verify";

// Adobe Target 헬퍼
export {
  getAndApplyOffer,
  targetTrackEvent,
  triggerTargetView,
} from "./target";
export type { TargetOfferContent, TargetGetOfferOptions } from "./target";
