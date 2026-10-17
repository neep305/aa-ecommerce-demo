/**
 * aa.ts — Adobe Analytics (AppMeasurement) 이벤트 헬퍼
 *
 * ACDL 방식으로 이벤트를 push하며, 로그 패널용 rawData를 반환합니다.
 * Launch의 AA Extension이 adobeDataLayer 이벤트를 수신하여
 * 실제 AppMeasurement 비콘을 전송합니다.
 */

import {
  pushToDataLayer,
  buildIdentityMap,
  getUserGuid,
  resetAdobeDataLayer,
  type ACDLEvent,
  type ACDLProductData,
  type ACDLXDMData,
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

function pageContext(name: string, channel: string = "ecommerce") {
  return {
    name,
    channel,
    url: window.location.pathname,
  };
}

function getXDMWithIdentity(
  xdmData: ACDLXDMData,
  overrideEmail?: string,
  overrideName?: string,
  overrideGuid?: string
): ACDLXDMData {
  const identityMap = buildIdentityMap(overrideEmail, overrideName, overrideGuid);
  const guid = overrideGuid || getUserGuid();
  if (identityMap) {
    const updated = {
      identityMap,
      ...xdmData,
    };
    if (guid) {
      if (!updated._experience) updated._experience = {};
      if (!updated._experience.analytics) updated._experience.analytics = {};
      if (!updated._experience.analytics.customDimensions) updated._experience.analytics.customDimensions = {};
      if (!updated._experience.analytics.customDimensions.eVars) updated._experience.analytics.customDimensions.eVars = {};
      updated._experience.analytics.customDimensions.eVars.eVar18 = guid;
    }
    return updated;
  }
  return xdmData;
}

// ---------------------------------------------------------------------------
// 페이지뷰
// ---------------------------------------------------------------------------
export function trackPageView(
  pageName: string,
  channel: string = "web"
): Record<string, unknown> {
  const identityMap = buildIdentityMap();
  const guid = getUserGuid();
  const xdmData: ACDLXDMData = getXDMWithIdentity({
    eventType: "web.webPageDetails.pageViews",
    web: {
      webPageDetails: {
        name: pageName,
        siteSection: channel,
      },
    },
    _experience: {
      analytics: {
        customDimensions: {
          props: { prop1: pageName },
          eVars: {
            eVar1: channel,
            ...(guid ? { eVar18: guid } : {}),
          },
        },
        event1to100: { event1: { value: 1 } },
      },
    },
  });

  const event: ACDLEvent = {
    event: "pageView",
    page: pageContext(pageName, channel),
    ...(identityMap ? { identityMap } : {}),
    // AppMeasurement 변수 매핑 (Launch Rule에서 참조)
    _aa: {
      pageName,
      channel,
      prop1: pageName,
      eVar1: channel,
      events: "event1",
      ...(guid ? { eVar18: guid, guid } : {}),
    },
    _xdm: xdmData,
  };

  const pushed = pushToDataLayer(event);
  console.log("[APP LOG] [AA] Page View:", pushed);

  return {
    pageName,
    channel,
    url: window.location.pathname,
    prop1: pageName,
    eVar1: channel,
    events: "event1",
    ...(guid ? { guid, eVar18: guid } : {}),
    ...(identityMap ? { identityMap } : {}),
    _xdm: xdmData,
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

  const identityMap = buildIdentityMap();
  const guid = getUserGuid();
  const xdmData: ACDLXDMData = getXDMWithIdentity({
    eventType: "commerce.productViews",
    web: {
      webPageDetails: {
        name: pageName,
      },
    },
    commerce: {
      productViews: { value: 1 },
    },
    productListItems: [
      {
        SKU: product.sku,
        name: product.name,
        priceTotal: product.price,
        ...(product.category ? { productCategories: [{ categoryID: product.category }] } : {}),
      },
    ],
    _experience: {
      analytics: {
        customDimensions: {
          props: { prop2: product.category },
          eVars: {
            eVar2: product.sku,
            eVar3: product.name,
            eVar4: product.category,
            ...(guid ? { eVar18: guid } : {}),
          },
        },
        event1to100: { prodView: { value: 1 } },
      },
    },
  });

  const event: ACDLEvent = {
    event: "prodView",
    page: pageContext(pageName),
    product: productData,
    ...(identityMap ? { identityMap } : {}),
    _aa: {
      pageName,
      products: `;${product.sku}`,
      events: "prodView",
      prop2: product.category,
      eVar2: product.sku,
      eVar3: product.name,
      eVar4: product.category,
      ...(guid ? { eVar18: guid, guid } : {}),
    },
    _xdm: xdmData,
  };

  const pushed = pushToDataLayer(event);
  console.log("[APP LOG] [AA] Product View:", pushed);

  return {
    pageName,
    products: `;${product.sku}`,
    events: "prodView",
    prop2: product.category,
    eVar2: product.sku,
    eVar3: product.name,
    eVar4: product.category,
    ...(guid ? { guid, eVar18: guid } : {}),
    ...(identityMap ? { identityMap } : {}),
    _xdm: xdmData,
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

  const identityMap = buildIdentityMap();
  const guid = getUserGuid();
  const xdmData: ACDLXDMData = getXDMWithIdentity({
    eventType: "commerce.productListAdds",
    commerce: {
      productListAdds: {
        value: 1,
      },
    },
    productListItems: [
      {
        SKU: product.sku,
        name: product.name,
        quantity,
        priceTotal: product.price * quantity,
        productAddMethod: "add to cart button",
        ...(product.category ? { productCategories: [{ categoryID: product.category }] } : {}),
      },
    ],
    _experience: {
      analytics: {
        customDimensions: {
          props: {
            prop3: "add_to_cart",
          },
          eVars: {
            eVar5: product.sku,
            eVar6: quantity.toString(),
            ...(guid ? { eVar18: guid } : {}),
          },
        },
        event1to100: {
          scAdd: { value: 1 },
        },
      },
    },
  });

  const event: ACDLEvent = {
    event: "scAdd",
    product: productData,
    ...(identityMap ? { identityMap } : {}),
    _aa: {
      products: `;${product.sku};${quantity};${product.price * quantity}`,
      events: "scAdd",
      prop3: "add_to_cart",
      eVar5: product.sku,
      eVar6: quantity.toString(),
      ...(guid ? { eVar18: guid, guid } : {}),
    },
    _xdm: xdmData,
  };

  const pushed = pushToDataLayer(event);
  console.log("[APP LOG] [AA] Add to Cart:", pushed);

  return {
    products: `;${product.sku};${quantity};${product.price * quantity}`,
    events: "scAdd",
    prop3: "add_to_cart",
    eVar5: product.sku,
    eVar6: quantity.toString(),
    ...(guid ? { guid, eVar18: guid } : {}),
    ...(identityMap ? { identityMap } : {}),
    _xdm: xdmData,
  };
}

// ---------------------------------------------------------------------------
// 장바구니 제거 (scRemove)
// ---------------------------------------------------------------------------
export function trackRemoveFromCart(
  product: Product,
  quantity: number
): Record<string, unknown> {
  const identityMap = buildIdentityMap();
  const guid = getUserGuid();
  const xdmData: ACDLXDMData = getXDMWithIdentity({
    eventType: "commerce.productListRemovals",
    commerce: {
      productListRemovals: { value: 1 },
    },
    productListItems: [
      {
        SKU: product.sku,
        name: product.name,
        quantity,
        priceTotal: product.price * quantity,
        ...(product.category ? { productCategories: [{ categoryID: product.category }] } : {}),
      },
    ],
    _experience: {
      analytics: {
        customDimensions: {
          props: { prop3: "remove_from_cart" },
          eVars: {
            eVar7: product.sku,
            eVar8: quantity.toString(),
            ...(guid ? { eVar18: guid } : {}),
          },
        },
        event1to100: { scRemove: { value: 1 } },
      },
    },
  });

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
    ...(identityMap ? { identityMap } : {}),
    _aa: {
      products: `;${product.sku};${quantity};${product.price * quantity}`,
      events: "scRemove",
      prop3: "remove_from_cart",
      eVar7: product.sku,
      eVar8: quantity.toString(),
      ...(guid ? { eVar18: guid, guid } : {}),
    },
    _xdm: xdmData,
  };

  const pushed = pushToDataLayer(event);
  console.log("[APP LOG] [AA] Remove from Cart:", pushed);

  return {
    products: `;${product.sku};${quantity};${product.price * quantity}`,
    events: "scRemove",
    prop3: "remove_from_cart",
    eVar7: product.sku,
    eVar8: quantity.toString(),
    ...(guid ? { guid, eVar18: guid } : {}),
    ...(identityMap ? { identityMap } : {}),
    _xdm: xdmData,
  };
}

// ---------------------------------------------------------------------------
// 장바구니 조회 (scView)
// ---------------------------------------------------------------------------
export function trackCartView(
  cart: CartItem[],
  totalPrice?: number
): Record<string, unknown> {
  const identityMap = buildIdentityMap();
  const guid = getUserGuid();
  const calculatedTotal = totalPrice !== undefined ? totalPrice : cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalCount = cart.reduce((s, i) => s + i.quantity, 0);
  const productString =
    cart.length > 0
      ? cart
          .map(
            (item) =>
              `;${item.sku};${item.quantity};${item.price * item.quantity}`
          )
          .join(",")
      : "";

  const xdmData: ACDLXDMData = getXDMWithIdentity({
    eventType: "commerce.productListViews",
    web: {
      webPageDetails: { name: "장바구니" },
    },
    commerce: {
      productListViews: { value: 1 },
    },
    productListItems: cart.map((item) => ({
      SKU: item.sku,
      name: item.name,
      quantity: item.quantity,
      priceTotal: item.price * item.quantity,
      ...(item.category ? { productCategories: [{ categoryID: item.category }] } : {}),
    })),
    _experience: {
      analytics: {
        customDimensions: {
          props: { prop4: "cart_view" },
          eVars: {
            eVar9: calculatedTotal.toString(),
            eVar10: totalCount.toString(),
            ...(guid ? { eVar18: guid } : {}),
          },
        },
        event1to100: { scView: { value: 1 } },
      },
    },
  });

  const event: ACDLEvent = {
    event: "scView",
    page: pageContext("장바구니"),
    cart: {
      priceTotal: calculatedTotal,
      totalValue: calculatedTotal,
      totalItems: totalCount,
      items: cart.map((i) => ({
        id: i.id,
        sku: i.sku,
        name: i.name,
        category: i.category,
        price: i.price,
        quantity: i.quantity,
      })),
    },
    ...(identityMap ? { identityMap } : {}),
    _aa: {
      pageName: "장바구니",
      products: productString,
      events: "scView",
      prop4: "cart_view",
      eVar9: calculatedTotal.toString(),
      eVar10: totalCount.toString(),
      ...(guid ? { eVar18: guid, guid } : {}),
    },
    _xdm: xdmData,
  };

  const pushed = pushToDataLayer(event);
  console.log("[APP LOG] [AA] Cart View:", pushed);

  return {
    pageName: "장바구니",
    products: productString,
    events: "scView",
    prop4: "cart_view",
    eVar9: calculatedTotal.toString(),
    eVar10: totalCount.toString(),
    ...(guid ? { guid, eVar18: guid } : {}),
    ...(identityMap ? { identityMap } : {}),
    _xdm: xdmData,
  };
}

// ---------------------------------------------------------------------------
// 주문서 작성 시작 (scCheckout)
// ---------------------------------------------------------------------------
export function trackCheckoutStart(
  cart: CartItem[],
  stepOrTotal: number = 1,
  totalPrice?: number
): Record<string, unknown> {
  const identityMap = buildIdentityMap();
  const guid = getUserGuid();
  const calculatedTotal =
    typeof totalPrice === "number"
      ? totalPrice
      : stepOrTotal > 10
      ? stepOrTotal
      : cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const productString = cart
    .map(
      (item) =>
        `;${item.sku};${item.quantity};${item.price * item.quantity}`
    )
    .join(",");

  const xdmData: ACDLXDMData = getXDMWithIdentity({
    eventType: "commerce.checkouts",
    web: {
      webPageDetails: { name: "주문결제" },
    },
    commerce: {
      checkouts: { value: 1 },
    },
    productListItems: cart.map((item) => ({
      SKU: item.sku,
      name: item.name,
      quantity: item.quantity,
      priceTotal: item.price * item.quantity,
      ...(item.category ? { productCategories: [{ categoryID: item.category }] } : {}),
    })),
    _experience: {
      analytics: {
        customDimensions: {
          props: { prop5: "checkout_start" },
          eVars: {
            eVar9: calculatedTotal.toString(),
            ...(guid ? { eVar18: guid } : {}),
          },
        },
        event1to100: { scCheckout: { value: 1 } },
      },
    },
  });

  const event: ACDLEvent = {
    event: "scCheckout",
    page: pageContext("주문결제"),
    cart: {
      priceTotal: calculatedTotal,
      totalValue: calculatedTotal,
      totalItems: cart.reduce((s, i) => s + i.quantity, 0),
      items: cart.map((i) => ({
        id: i.id,
        sku: i.sku,
        name: i.name,
        category: i.category,
        price: i.price,
        quantity: i.quantity,
      })),
    },
    ...(identityMap ? { identityMap } : {}),
    _aa: {
      pageName: "주문결제",
      products: productString,
      events: "scCheckout",
      prop5: "checkout_start",
      eVar9: calculatedTotal.toString(),
      ...(guid ? { eVar18: guid, guid } : {}),
    },
    _xdm: xdmData,
  };

  const pushed = pushToDataLayer(event);
  console.log("[APP LOG] [AA] Checkout Start:", pushed);

  return {
    pageName: "주문결제",
    products: productString,
    events: "scCheckout",
    prop5: "checkout_start",
    eVar9: calculatedTotal.toString(),
    ...(guid ? { guid, eVar18: guid } : {}),
    ...(identityMap ? { identityMap } : {}),
    _xdm: xdmData,
  };
}

// ---------------------------------------------------------------------------
// 구매 완료 (purchase)
// ---------------------------------------------------------------------------
export function trackPurchase(
  orderIdOrCart: string | CartItem[],
  cartOrOrderId?: CartItem[] | string,
  totalPrice?: number
): Record<string, unknown> {
  const identityMap = buildIdentityMap();
  const guid = getUserGuid();

  let orderId = "";
  let cart: CartItem[] = [];

  if (Array.isArray(orderIdOrCart)) {
    cart = orderIdOrCart;
    orderId = typeof cartOrOrderId === "string" ? cartOrOrderId : "";
  } else {
    orderId = String(orderIdOrCart);
    cart = Array.isArray(cartOrOrderId) ? cartOrOrderId : [];
  }

  const calculatedTotal =
    typeof totalPrice === "number"
      ? totalPrice
      : cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const productString = cart
    .map(
      (item) =>
        `;${item.sku};${item.quantity};${item.price * item.quantity}`
    )
    .join(",");

  const xdmData: ACDLXDMData = getXDMWithIdentity({
    eventType: "commerce.purchases",
    web: {
      webPageDetails: { name: "주문완료" },
    },
    commerce: {
      purchases: { value: 1 },
      order: {
        purchaseID: orderId,
        priceTotal: calculatedTotal,
        currencyCode: "KRW",
      },
    },
    productListItems: cart.map((item) => ({
      SKU: item.sku,
      name: item.name,
      quantity: item.quantity,
      priceTotal: item.price * item.quantity,
      ...(item.category ? { productCategories: [{ categoryID: item.category }] } : {}),
    })),
    _experience: {
      analytics: {
        customDimensions: {
          props: {
            prop6: "purchase_complete",
          },
          eVars: {
            eVar11: orderId,
            eVar12: calculatedTotal.toString(),
            ...(guid ? { eVar18: guid } : {}),
          },
        },
        event1to100: { purchase: { value: 1 } },
      },
    },
  });

  const event: ACDLEvent = {
    event: "purchase",
    page: pageContext("주문완료"),
    order: {
      id: orderId,
      purchaseID: orderId,
      totalValue: calculatedTotal,
      priceTotal: calculatedTotal,
      currency: "KRW",
      items: cart.map((i) => ({
        id: i.id,
        sku: i.sku,
        name: i.name,
        category: i.category,
        price: i.price,
        quantity: i.quantity,
      })),
    },
    ...(identityMap ? { identityMap } : {}),
    _aa: {
      pageName: "주문완료",
      purchaseID: orderId,
      products: productString,
      events: "purchase",
      prop6: "purchase_complete",
      eVar11: orderId,
      eVar12: calculatedTotal.toString(),
      ...(guid ? { eVar18: guid, guid } : {}),
    },
    _xdm: xdmData,
  };

  const pushed = pushToDataLayer(event);
  console.log("[APP LOG] [AA] Purchase:", pushed);

  return {
    pageName: "주문완료",
    purchaseID: orderId,
    products: productString,
    events: "purchase",
    prop6: "purchase_complete",
    eVar11: orderId,
    eVar12: calculatedTotal.toString(),
    ...(guid ? { guid, eVar18: guid } : {}),
    ...(identityMap ? { identityMap } : {}),
    _xdm: xdmData,
  };
}

// ---------------------------------------------------------------------------
// 내부 검색 (internalSearch)
// ---------------------------------------------------------------------------
export function trackInternalSearch(
  searchTerm: string,
  resultCount: number
): Record<string, unknown> {
  const identityMap = buildIdentityMap();
  const guid = getUserGuid();
  const xdmData: ACDLXDMData = getXDMWithIdentity({
    eventType: "web.webPageDetails.pageViews",
    web: {
      webPageDetails: { name: "검색결과" },
    },
    _experience: {
      analytics: {
        customDimensions: {
          props: { prop7: searchTerm },
          eVars: {
            eVar13: searchTerm,
            eVar14: resultCount.toString(),
            ...(guid ? { eVar18: guid } : {}),
          },
        },
        event1to100: { event2: { value: 1 } },
      },
    },
  });

  const event: ACDLEvent = {
    event: "internalSearch",
    page: pageContext("검색결과"),
    search: {
      term: searchTerm,
      keyword: searchTerm,
      resultCount,
    },
    ...(identityMap ? { identityMap } : {}),
    _aa: {
      pageName: "검색결과",
      events: "event2",
      prop7: searchTerm,
      eVar13: searchTerm,
      eVar14: resultCount.toString(),
      ...(guid ? { eVar18: guid, guid } : {}),
    },
    _xdm: xdmData,
  };

  const pushed = pushToDataLayer(event);
  console.log("[APP LOG] [AA] Internal Search:", pushed);

  return {
    pageName: "검색결과",
    prop7: searchTerm,
    eVar13: searchTerm,
    eVar14: resultCount.toString(),
    events: "event2",
    ...(guid ? { guid, eVar18: guid } : {}),
    ...(identityMap ? { identityMap } : {}),
    _xdm: xdmData,
  };
}

// ---------------------------------------------------------------------------
// 회원가입 (signUp)
// ---------------------------------------------------------------------------
export function trackSignUp(name: string, email: string, guid?: string): Record<string, unknown> {
  const targetGuid = guid || getUserGuid();
  const identityMap = buildIdentityMap(email, name, targetGuid);
  const xdmData: ACDLXDMData = getXDMWithIdentity(
    {
      eventType: "web.formFilledOut",
      web: {
        webPageDetails: { name: "회원가입" },
      },
      _experience: {
        analytics: {
          customDimensions: {
            props: { prop9: "sign_up" },
            eVars: {
              eVar17: email,
              ...(targetGuid ? { eVar18: targetGuid } : {}),
            },
          },
          event1to100: { event4: { value: 1 } },
        },
      },
    },
    email,
    name,
    targetGuid
  );

  const event: ACDLEvent = {
    event: "signUp",
    page: pageContext("회원가입"),
    user: {
      guid: targetGuid,
      name,
      email,
      authenticatedState: "authenticated",
    },
    ...(identityMap ? { identityMap } : {}),
    _aa: {
      pageName: "회원가입",
      events: "event4",
      prop9: "sign_up",
      eVar17: email,
      ...(targetGuid ? { eVar18: targetGuid, guid: targetGuid } : {}),
    },
    _xdm: xdmData,
  };

  const pushed = pushToDataLayer(event);
  console.log("[APP LOG] [AA] Sign Up:", pushed);

  return {
    pageName: "회원가입",
    events: "event4",
    prop9: "sign_up",
    eVar17: email,
    ...(targetGuid ? { guid: targetGuid, eVar18: targetGuid } : {}),
    ...(identityMap ? { identityMap } : {}),
    _xdm: xdmData,
  };
}

// ---------------------------------------------------------------------------
// 로그인 (login)
// ---------------------------------------------------------------------------
export function trackLogin(name: string, email: string, guid?: string): Record<string, unknown> {
  const targetGuid = guid || getUserGuid();
  const identityMap = buildIdentityMap(email, name, targetGuid);
  const xdmData: ACDLXDMData = getXDMWithIdentity(
    {
      eventType: "web.formFilledOut",
      web: {
        webPageDetails: { name: "로그인" },
      },
      _experience: {
        analytics: {
          customDimensions: {
            props: { prop9: "login" },
            eVars: {
              eVar17: email,
              ...(targetGuid ? { eVar18: targetGuid } : {}),
            },
          },
          event1to100: { event5: { value: 1 } },
        },
      },
    },
    email,
    name,
    targetGuid
  );

  const event: ACDLEvent = {
    event: "login",
    page: pageContext("로그인"),
    user: {
      guid: targetGuid,
      name,
      email,
      authenticatedState: "authenticated",
    },
    ...(identityMap ? { identityMap } : {}),
    _aa: {
      pageName: "로그인",
      events: "event5",
      prop9: "login",
      eVar17: email,
      ...(targetGuid ? { eVar18: targetGuid, guid: targetGuid } : {}),
    },
    _xdm: xdmData,
  };

  const pushed = pushToDataLayer(event);
  console.log("[APP LOG] [AA] Login:", pushed);

  return {
    pageName: "로그인",
    events: "event5",
    prop9: "login",
    eVar17: email,
    ...(targetGuid ? { guid: targetGuid, eVar18: targetGuid } : {}),
    ...(identityMap ? { identityMap } : {}),
    _xdm: xdmData,
  };
}

// ---------------------------------------------------------------------------
// 로그아웃 (logout)
// ---------------------------------------------------------------------------
export function trackLogout(): Record<string, unknown> {
  const xdmData: ACDLXDMData = {
    eventType: "web.formFilledOut",
    web: {
      webPageDetails: { name: "로그아웃" },
    },
    _experience: {
      analytics: {
        customDimensions: {
          props: { prop9: "logout" },
        },
      },
    },
  };

  const event: ACDLEvent = {
    event: "logout",
    page: pageContext("로그아웃"),
    user: undefined,
    identityMap: undefined,
    _aa: {
      pageName: "로그아웃",
      prop9: "logout",
    },
    _xdm: xdmData,
  };

  const pushed = pushToDataLayer(event);
  console.log("[APP LOG] [AA] Logout:", pushed);

  // adobeDataLayer 배열 및 사용자 컨텍스트를 비회원 상태로 완전 초기화
  resetAdobeDataLayer();

  return {
    pageName: "로그아웃",
    prop9: "logout",
    _xdm: xdmData,
    _reset: true,
  };
}

// ---------------------------------------------------------------------------
// 프로모션 클릭
// ---------------------------------------------------------------------------
export function trackPromoClick(
  promoName: string,
  promoPosition: string
): Record<string, unknown> {
  const identityMap = buildIdentityMap();
  const guid = getUserGuid();
  const xdmData: ACDLXDMData = getXDMWithIdentity({
    eventType: "decisioning.propositionDisplay",
    _experience: {
      analytics: {
        customDimensions: {
          props: { prop8: promoName },
          eVars: {
            eVar15: promoName,
            eVar16: promoPosition,
            ...(guid ? { eVar18: guid } : {}),
          },
        },
        event1to100: { event3: { value: 1 } },
      },
    },
  });

  const event: ACDLEvent = {
    event: "promoClick",
    promo: {
      name: promoName,
      position: promoPosition,
    },
    ...(identityMap ? { identityMap } : {}),
    _aa: {
      events: "event3",
      prop8: promoName,
      eVar15: promoName,
      eVar16: promoPosition,
      ...(guid ? { eVar18: guid, guid } : {}),
    },
    _xdm: xdmData,
  };

  const pushed = pushToDataLayer(event);
  console.log("[APP LOG] [AA] Promo Click:", pushed);

  return {
    events: "event3",
    prop8: promoName,
    eVar15: promoName,
    eVar16: promoPosition,
    ...(guid ? { guid, eVar18: guid } : {}),
    ...(identityMap ? { identityMap } : {}),
    _xdm: xdmData,
  };
}
