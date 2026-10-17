/**
 * guide-snippets.ts — 구현 가이드용 정적 스니펫 데이터
 *
 * 데모 앱 "구현 코드" 탭에서 3가지 방식(AppMeasurement / Launch Extension / Web SDK)을 표시합니다.
 */

export type ImplementationApproach =
  | "appMeasurement"
  | "launchExtension"
  | "webSdk";

export interface EventGuideSnippet {
  event: string;
  label: string;
  appMeasurement: { title: string; code: string };
  launchExtension: {
    clientCode: string;
    launchRule: string;
    dataElements?: string;
  };
  webSdk: {
    code: string;
    note?: string;
  };
}

export const LAUNCH_EXTENSION_SETUP = {
  extensions: [
    { name: "Adobe Client Data Layer", role: "adobeDataLayer 이벤트 수신 및 Rule 트리거" },
    { name: "Adobe Analytics", role: "ACDL → AppMeasurement 비콘 전송" },
    { name: "Experience Cloud ID Service", role: "ECID(MID) 발급 — getECID() 연동" },
    { name: "Adobe Target (at.js)", role: "Offer / mbox — getAndApplyOffer() 연동" },
  ],
  embedCode: `<!-- index.html — VITE_LAUNCH_URL 환경변수로 삽입 -->
<script src="https://assets.adobedtm.com/{ORG}/{PROP}/launch-{ID}-development.min.js" async></script>`,
  ecidExample: `import { getECID, onLaunchReady } from "@/analytics";

onLaunchReady(() => {
  getECID().then((ecid) => console.log("ECID:", ecid));
});`,
  targetExample: `import { getAndApplyOffer } from "@/analytics";

getAndApplyOffer("homepage-hero", "#hero-banner");`,
};

export const EVENT_GUIDE_SNIPPETS: EventGuideSnippet[] = [
  {
    event: "pageView",
    label: "페이지뷰",
    appMeasurement: {
      title: "페이지뷰",
      code: `s.pageName = "홈페이지";
s.channel = "ecommerce";
s.prop1 = "홈페이지";
s.eVar1 = "ecommerce";
s.events = "event1";
s.t();`,
    },
    launchExtension: {
      clientCode: `adobeDataLayer.push({
  event: "pageView",
  page: { name: "홈페이지", channel: "ecommerce" },
  _aa: {
    pageName: "홈페이지",
    channel: "ecommerce",
    prop1: "홈페이지",
    eVar1: "ecommerce",
    events: "event1"
  }
});`,
      launchRule: `Trigger:  Client Data Layer → Specific Event → event equals "pageView"
Actions:  1) Set Variables — s.pageName = %ACDL - Page Name%
          2) Set Variables — s.channel = %ACDL - Channel%
          3) Set Variables — s.events = %ACDL - Events%
          4) Send Beacon`,
      dataElements: `%ACDL - Page Name%  → event._aa.pageName
%ACDL - Channel%   → event._aa.channel
%ACDL - Events%    → event._aa.events`,
    },
    webSdk: {
      code: `alloy("sendEvent", {
  xdm: {
    web: {
      webPageDetails: {
        name: "홈페이지",
        siteSection: "ecommerce"
      }
    },
    _experience: {
      analytics: {
        customDimensions: {
          eVars: { eVar1: "ecommerce" },
          props: { prop1: "홈페이지" }
        }
      }
    },
    eventType: "web.webPageDetails.pageViews"
  }
});`,
      note: "Datastream에서 Adobe Analytics Experience Event Forwarding 활성화 필요",
    },
  },
  {
    event: "prodView",
    label: "상품 조회",
    appMeasurement: {
      title: "상품 조회 (prodView)",
      code: `s.pageName = "상품상세:프리미엄 러닝화";
s.products = ";SHOE-001";
s.events = "prodView";
s.prop2 = "신발";
s.eVar2 = "SHOE-001";
s.eVar3 = "프리미엄 러닝화";
s.eVar4 = "신발";
s.t();`,
    },
    launchExtension: {
      clientCode: `adobeDataLayer.push({
  event: "prodView",
  page: { name: "상품상세:프리미엄 러닝화", channel: "ecommerce" },
  product: {
    id: "1", sku: "SHOE-001", name: "프리미엄 러닝화",
    category: "신발", price: 159000
  },
  _aa: {
    pageName: "상품상세:프리미엄 러닝화",
    products: ";SHOE-001",
    events: "prodView",
    prop2: "신발", eVar2: "SHOE-001",
    eVar3: "프리미엄 러닝화", eVar4: "신발"
  }
});`,
      launchRule: `Trigger:  Client Data Layer → Specific Event → event equals "prodView"
Actions:  1) Set Variables — s.pageName, s.products, s.events
          2) Set Variables — s.prop2, s.eVar2~eVar4
          3) Send Beacon`,
      dataElements: `%ACDL - Products%  → event._aa.products
%ACDL - SKU%       → event.product.sku`,
    },
    webSdk: {
      code: `alloy("sendEvent", {
  xdm: {
    web: { webPageDetails: { name: "상품상세:프리미엄 러닝화" } },
    commerce: {
      productViews: { value: 1 }
    },
    productListItems: [{
      SKU: "SHOE-001",
      name: "프리미엄 러닝화",
      priceTotal: 159000,
      productCategories: [{ categoryID: "신발" }]
    }],
    eventType: "commerce.productViews"
  }
});`,
    },
  },
  {
    event: "scAdd",
    label: "장바구니 추가",
    appMeasurement: {
      title: "장바구니 추가 (scAdd)",
      code: `s.products = ";SHOE-001;1;159000";
s.events = "scAdd";
s.prop3 = "add_to_cart";
s.eVar5 = "SHOE-001";
s.eVar6 = "1";
s.tl(true, "o", "Add to Cart");`,
    },
    launchExtension: {
      clientCode: `adobeDataLayer.push({
  event: "scAdd",
  product: {
    id: "1", sku: "SHOE-001", name: "프리미엄 러닝화",
    category: "신발", price: 159000, quantity: 1
  },
  _aa: {
    products: ";SHOE-001;1;159000",
    events: "scAdd",
    prop3: "add_to_cart",
    eVar5: "SHOE-001",
    eVar6: "1"
  }
});`,
      launchRule: `Trigger:  Client Data Layer → Specific Event → event equals "scAdd"
Actions:  1) Set Variables — s.products, s.events, s.prop3
          2) Set Variables — s.eVar5, s.eVar6
          3) Send Beacon (link tracking)`,
      dataElements: `%ACDL - Products%  → event._aa.products
%ACDL - Quantity%  → event.product.quantity`,
    },
    webSdk: {
      code: `alloy("sendEvent", {
  xdm: {
    commerce: {
      productListAdds: { value: 1 }
    },
    productListItems: [{
      SKU: "SHOE-001",
      name: "프리미엄 러닝화",
      quantity: 1,
      priceTotal: 159000,
      productAddMethod: "add to cart button"
    }],
    eventType: "commerce.productListAdds"
  }
});`,
    },
  },
  {
    event: "scRemove",
    label: "장바구니 제거",
    appMeasurement: {
      title: "장바구니 제거 (scRemove)",
      code: `s.products = ";SHOE-001;1;159000";
s.events = "scRemove";
s.prop3 = "remove_from_cart";
s.eVar5 = "SHOE-001";
s.tl(true, "o", "Remove from Cart");`,
    },
    launchExtension: {
      clientCode: `adobeDataLayer.push({
  event: "scRemove",
  product: {
    id: "1", sku: "SHOE-001", name: "프리미엄 러닝화",
    category: "신발", price: 159000, quantity: 1
  },
  _aa: {
    products: ";SHOE-001;1;159000",
    events: "scRemove",
    prop3: "remove_from_cart",
    eVar5: "SHOE-001"
  }
});`,
      launchRule: `Trigger:  Client Data Layer → Specific Event → event equals "scRemove"
Actions:  1) Set Variables — s.products, s.events, s.prop3, s.eVar5
          2) Send Beacon (link tracking)`,
    },
    webSdk: {
      code: `alloy("sendEvent", {
  xdm: {
    commerce: {
      productListRemovals: { value: 1 }
    },
    productListItems: [{
      SKU: "SHOE-001",
      quantity: 1,
      priceTotal: 159000
    }],
    eventType: "commerce.productListRemovals"
  }
});`,
    },
  },
  {
    event: "scView",
    label: "장바구니 조회",
    appMeasurement: {
      title: "장바구니 조회 (scView)",
      code: `s.pageName = "장바구니";
s.products = ";SHOE-001;1;159000";
s.events = "scView";
s.prop4 = "cart_view";
s.eVar7 = "1";
s.t();`,
    },
    launchExtension: {
      clientCode: `adobeDataLayer.push({
  event: "scView",
  page: { name: "장바구니", channel: "ecommerce" },
  cart: {
    items: [{ id: "1", sku: "SHOE-001", quantity: 1, price: 159000 }],
    totalItems: 1,
    totalValue: 159000
  },
  _aa: {
    pageName: "장바구니",
    products: ";SHOE-001;1;159000",
    events: "scView",
    prop4: "cart_view",
    eVar7: "1"
  }
});`,
      launchRule: `Trigger:  Client Data Layer → Specific Event → event equals "scView"
Actions:  1) Set Variables — s.pageName, s.products, s.events
          2) Set Variables — s.prop4, s.eVar7
          3) Send Beacon`,
    },
    webSdk: {
      code: `alloy("sendEvent", {
  xdm: {
    web: { webPageDetails: { name: "장바구니" } },
    commerce: {
      productListViews: { value: 1 }
    },
    productListItems: [{
      SKU: "SHOE-001", quantity: 1, priceTotal: 159000
    }],
    eventType: "commerce.productListViews"
  }
});`,
    },
  },
  {
    event: "scCheckout",
    label: "결제 시작",
    appMeasurement: {
      title: "결제 시작 (scCheckout)",
      code: `s.pageName = "체크아웃:Step1";
s.products = ";SHOE-001;1;159000";
s.events = "scCheckout";
s.prop5 = "checkout_step_1";
s.eVar8 = "159000";
s.eVar9 = "1";
s.t();`,
    },
    launchExtension: {
      clientCode: `adobeDataLayer.push({
  event: "scCheckout",
  page: { name: "체크아웃:Step1", channel: "ecommerce" },
  cart: { totalItems: 1, totalValue: 159000, items: [...] },
  _aa: {
    pageName: "체크아웃:Step1",
    products: ";SHOE-001;1;159000",
    events: "scCheckout",
    prop5: "checkout_step_1",
    eVar8: "159000",
    eVar9: "1"
  }
});`,
      launchRule: `Trigger:  Client Data Layer → Specific Event → event equals "scCheckout"
Actions:  1) Set Variables — s.pageName, s.products, s.events
          2) Set Variables — s.prop5, s.eVar8, s.eVar9
          3) Send Beacon`,
    },
    webSdk: {
      code: `alloy("sendEvent", {
  xdm: {
    web: { webPageDetails: { name: "체크아웃:Step1" } },
    commerce: {
      checkouts: { value: 1 }
    },
    productListItems: [{ SKU: "SHOE-001", quantity: 1, priceTotal: 159000 }],
    eventType: "commerce.checkouts"
  }
});`,
    },
  },
  {
    event: "purchase",
    label: "구매 완료",
    appMeasurement: {
      title: "구매 완료 (purchase)",
      code: `s.pageName = "구매완료";
s.products = ";SHOE-001;1;159000";
s.events = "purchase";
s.purchaseID = "ORD-20240531-001";
s.transactionID = "ORD-20240531-001";
s.prop6 = "purchase_complete";
s.eVar10 = "ORD-20240531-001";
s.eVar11 = "159000";
s.eVar12 = "1";
s.t();`,
    },
    launchExtension: {
      clientCode: `adobeDataLayer.push({
  event: "purchase",
  page: { name: "구매완료", channel: "ecommerce" },
  order: {
    id: "ORD-20240531-001",
    totalValue: 159000,
    currency: "KRW",
    items: [{ sku: "SHOE-001", quantity: 1, price: 159000 }]
  },
  _aa: {
    pageName: "구매완료",
    products: ";SHOE-001;1;159000",
    events: "purchase",
    purchaseID: "ORD-20240531-001",
    transactionID: "ORD-20240531-001",
    prop6: "purchase_complete",
    eVar10: "ORD-20240531-001",
    eVar11: "159000",
    eVar12: "1"
  }
});`,
      launchRule: `Trigger:  Client Data Layer → Specific Event → event equals "purchase"
Actions:  1) Set Variables — s.pageName, s.products, s.events
          2) Set Variables — s.purchaseID, s.transactionID
          3) Set Variables — s.prop6, s.eVar10~eVar12
          4) Send Beacon`,
      dataElements: `%ACDL - Purchase ID% → event._aa.purchaseID
%ACDL - Order Total%  → event.order.totalValue`,
    },
    webSdk: {
      code: `alloy("sendEvent", {
  xdm: {
    web: { webPageDetails: { name: "구매완료" } },
    commerce: {
      purchases: { value: 1 },
      order: {
        purchaseID: "ORD-20240531-001",
        priceTotal: 159000,
        currencyCode: "KRW",
        payments: [{
          paymentType: "credit_card",
          paymentAmount: 159000,
          currencyCode: "KRW"
        }]
      }
    },
    productListItems: [{
      SKU: "SHOE-001", quantity: 1, priceTotal: 159000
    }],
    eventType: "commerce.purchases"
  }
});`,
      note: "purchaseID 중복 방지를 위해 order.purchaseID 고유값 필수",
    },
  },
  {
    event: "internalSearch",
    label: "내부 검색",
    appMeasurement: {
      title: "내부 검색",
      code: `s.pageName = "검색결과";
s.prop7 = "러닝화";
s.eVar13 = "러닝화";
s.eVar14 = "3";
s.events = "event2";
s.t();`,
    },
    launchExtension: {
      clientCode: `adobeDataLayer.push({
  event: "internalSearch",
  page: { name: "검색결과", channel: "ecommerce" },
  search: { term: "러닝화", resultCount: 3 },
  _aa: {
    pageName: "검색결과",
    prop7: "러닝화",
    eVar13: "러닝화",
    eVar14: "3",
    events: "event2"
  }
});`,
      launchRule: `Trigger:  Client Data Layer → Specific Event → event equals "internalSearch"
Actions:  1) Set Variables — s.pageName, s.prop7, s.eVar13, s.eVar14
          2) Set Variables — s.events = "event2"
          3) Send Beacon`,
      dataElements: `%ACDL - Search Term%   → event.search.term
%ACDL - Result Count% → event.search.resultCount`,
    },
    webSdk: {
      code: `alloy("sendEvent", {
  xdm: {
    web: {
      webPageDetails: { name: "검색결과" },
      webInteraction: {
        name: "internal search",
        type: "other",
        linkClicks: { value: 1 }
      }
    },
    _experience: {
      analytics: {
        customDimensions: {
          props: { prop7: "러닝화" },
          eVars: { eVar13: "러닝화", eVar14: "3" }
        }
      }
    },
    eventType: "web.webinteraction.linkClicks"
  }
});`,
      note: "표준 XDM에 top-level search{isSearch,term,numberOfResults}는 없음 — 검색어/결과수는 Adobe Analytics Full Extension(_experience.analytics)으로 전달",
    },
  },
  {
    event: "promoClick",
    label: "프로모션 클릭",
    appMeasurement: {
      title: "프로모션 클릭",
      code: `s.prop8 = "여름 세일";
s.eVar15 = "여름 세일";
s.eVar16 = "hero_banner";
s.events = "event3";
s.tl(true, "o", "Promo Click");`,
    },
    launchExtension: {
      clientCode: `adobeDataLayer.push({
  event: "promoClick",
  promo: { name: "여름 세일", position: "hero_banner" },
  _aa: {
    prop8: "여름 세일",
    eVar15: "여름 세일",
    eVar16: "hero_banner",
    events: "event3"
  }
});`,
      launchRule: `Trigger:  Client Data Layer → Specific Event → event equals "promoClick"
Actions:  1) Set Variables — s.prop8, s.eVar15, s.eVar16
          2) Set Variables — s.events = "event3"
          3) Send Beacon (link tracking)`,
      dataElements: `%ACDL - Promo Name%     → event.promo.name
%ACDL - Promo Position% → event.promo.position`,
    },
    webSdk: {
      code: `alloy("sendEvent", {
  xdm: {
    web: {
      webInteraction: {
        name: "여름 세일",
        region: "hero_banner",
        type: "other",
        linkClicks: { value: 1 }
      }
    },
    _experience: {
      analytics: {
        customDimensions: {
          props: { prop8: "여름 세일" },
          eVars: { eVar15: "여름 세일", eVar16: "hero_banner" }
        }
      }
    },
    eventType: "web.webinteraction.linkClicks"
  }
});`,
      note: "표준 XDM에 promo 필드그룹/promo.promoClicks eventType은 없음 — 온사이트 배너 클릭은 web.webInteraction(link click) + _experience.analytics로 표현",
    },
  },
];
