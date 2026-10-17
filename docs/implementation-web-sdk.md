# Web SDK (alloy.js) 구현 가이드

Adobe Experience Platform Web SDK를 사용하여 XDM 스키마 기반으로 이벤트를 전송하는 방식입니다.

> **참고**: 이 데모 앱의 실제 코드는 Launch Extension + ACDL 방식입니다. Web SDK는 가이드/문서 예시로만 제공됩니다.

## 언제 사용하나요?

- Adobe Experience Platform(AEP) 중심 아키텍처
- XDM 스키마 기반 데이터 수집 및 Real-Time CDP 연동
- AA, Target, AEP를 단일 SDK로 통합 전송
- Launch AA Extension 대신 Edge Network 경유 전송

## 사전 요구사항

1. **AEP Sandbox** 및 Schema 생성
2. **Datastream** (Edge Configuration) — AA, Target, AEP Destination 연결
3. Launch Property에 **Adobe Experience Platform Web SDK** Extension 설치
4. Web SDK Extension에 Datastream ID, Edge Domain 설정

## 기본 패턴

```javascript
alloy("configure", {
  datastreamId: "YOUR_DATASTREAM_ID",
  orgId: "YOUR_ORG_ID@AdobeOrg",
  debugEnabled: true
});

alloy("sendEvent", {
  xdm: {
    web: {
      webPageDetails: { name: "홈페이지", siteSection: "ecommerce" }
    },
    eventType: "web.webPageDetails.pageViews"
  }
});
```

## Launch Rule 패턴 (Web SDK Extension)

```
Trigger:  Core → Library Loaded (또는 Custom Event / Direct Call)
Actions:  1) Adobe Experience Platform Web SDK → Configure (datastreamId)
          2) Adobe Experience Platform Web SDK → Send Event (XDM payload)
```

ACDL과 함께 사용 시:

```
Trigger:  Client Data Layer → Specific Event → event equals "pageView"
Actions:  1) Custom Code — ACDL payload를 XDM으로 변환
          2) Adobe Experience Platform Web SDK → Send Event
```

## Ecommerce XDM 이벤트 매핑

> **핵심 구조**: `commerce.<measure>`는 액션(예: `productListAdds: { value: 1 }`)만 나타내고, 상품 상세는 `productListItems` 배열에 담습니다. `productListItems`는 `commerce`의 **하위가 아니라 ExperienceEvent root(형제)**에 위치합니다.

| 데모 이벤트 | XDM eventType | commerce measure | 상품/주문 정보 |
|-------------|---------------|------------------|----------------|
| pageView | web.webPageDetails.pageViews | - | web.webPageDetails.name |
| prodView | commerce.productViews | commerce.productViews: { value } | productListItems[] |
| scAdd | commerce.productListAdds | commerce.productListAdds: { value } | productListItems[] (productAddMethod) |
| scRemove | commerce.productListRemovals | commerce.productListRemovals: { value } | productListItems[] |
| scView | commerce.productListViews | commerce.productListViews: { value } | productListItems[] |
| scCheckout | commerce.checkouts | commerce.checkouts: { value } | productListItems[] |
| purchase | commerce.purchases | commerce.purchases: { value } | commerce.order + productListItems[] |
| internalSearch | web.webinteraction.linkClicks | - | web.webInteraction + _experience.analytics (prop7/eVar13/eVar14) |
| promoClick | web.webinteraction.linkClicks | - | web.webInteraction + _experience.analytics (prop8/eVar15/eVar16) |

> **주의**: 표준 XDM에는 top-level `search{isSearch,term,numberOfResults}`와 `promo` 필드 그룹이 **없습니다**. 내부검색/프로모션 클릭은 스키마에 존재하는 `web.webInteraction`(링크 클릭)과 표준 `_experience.analytics.customDimensions`(Adobe Analytics Full Extension)로 표현합니다. 상세 근거는 [xdm-schema-audit.md](./xdm-schema-audit.md) 참고.

## 이벤트 예시

### 페이지뷰

```javascript
alloy("sendEvent", {
  xdm: {
    web: {
      webPageDetails: { name: "홈페이지", siteSection: "ecommerce" }
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
});
```

### 장바구니 추가 (scAdd)

```javascript
alloy("sendEvent", {
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
});
```

> `commerce.productListAdds`는 `{ value: 1 }`만 담고, 상품 상세는 root의 `productListItems` 배열에 둡니다.

### 구매 완료

```javascript
alloy("sendEvent", {
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
      SKU: "SHOE-001",
      quantity: 1,
      priceTotal: 159000
    }],
    eventType: "commerce.purchases"
  }
});
```

> `commerce.order`는 measure(`purchases`)의 형제이고 `productListItems`는 root에 둡니다. `purchaseID`는 고유값이어야 하며, 중복 시 Analytics에서 중복 주문으로 처리됩니다.

### 내부 검색 (internalSearch)

```javascript
alloy("sendEvent", {
  xdm: {
    web: {
      webPageDetails: { name: "검색결과" },
      webInteraction: { name: "internal search", type: "other", linkClicks: { value: 1 } }
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
});
```

> 표준 XDM에 `search.isSearch`는 없고, `term`/`numberOfResults`는 Internal Site Search 데이터 타입(`siteKnowledge.supportSiteSearch`) 소속입니다. 온사이트 검색은 `web.webInteraction` + `_experience.analytics`로 전달합니다.

### 프로모션 클릭 (promoClick)

```javascript
alloy("sendEvent", {
  xdm: {
    web: {
      webInteraction: { name: "여름 세일", region: "hero_banner", type: "other", linkClicks: { value: 1 } }
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
});
```

> 표준 XDM에 `promo` 필드 그룹은 없습니다. 온사이트 배너 클릭은 `web.webInteraction`(link click)으로, 캠페인 트래킹이 필요하면 `marketing`(Campaign Marketing Details) 필드 그룹을 사용합니다.

## 스키마 필드 그룹 요구사항

이 데모의 Web SDK 페이로드를 XDM 스키마로 ingest하려면 ExperienceEvent 클래스에 아래 표준 필드 그룹이 필요합니다.

- **Web Details** — `web.webPageDetails`, `web.webInteraction`, `web.webReferrer`
- **Commerce Details** — `commerce.*`, `productListItems[]`
- **Adobe Analytics ExperienceEvent Full Extension** — `_experience.analytics.customDimensions.{eVars,props}`
- **Environment / Device Details** — `environment`, `device`, `placeContext`, `implementationDetails`

스키마 대비 상세 점검 결과는 [xdm-schema-audit.md](./xdm-schema-audit.md)를 참고하세요.

## Identity (identityMap / 커스텀 ID)

`identityMap`은 Web SDK가 ECID를 자동으로 채웁니다. 로그인 사용자 등 추가 식별자나 스키마의 커스텀 identity 필드 그룹을 채우려면 XDM에 명시합니다.

```javascript
alloy("sendEvent", {
  xdm: {
    identityMap: {
      Email: [{ id: "user@example.com", authenticatedState: "authenticated", primary: true }]
    },
    web: { webPageDetails: { name: "홈페이지" } },
    eventType: "web.webPageDetails.pageViews"
  }
});
```

> `authenticatedState`는 `ambiguous` / `authenticated` / `loggedOut` 중 하나입니다. 커스텀 identity 필드 그룹(예: `ecid`, `guid`)은 해당 필드 경로에 직접 값을 넣어 전달합니다.

## AA Extension vs Web SDK 선택 기준

| 기준 | AA Extension + ACDL | Web SDK |
|------|---------------------|---------|
| AEP / RT-CDP 연동 | 별도 Ingest API 필요 | Datastream으로 네이티브 |
| 기존 AA Report Suite | AA Extension 직접 연동 | Experience Event Forwarding |
| 학습 곡선 | 낮음 (s 객체 개념 유사) | XDM 스키마 이해 필요 |
| Target | Target Extension (at.js) | Web SDK Target via Datastream |
| 이 데모 앱 | **기본 구현** | 가이드 예시만 |

## Datastream 설정 체크리스트

- [ ] AEP Sandbox 선택
- [ ] Schema (Web Web Page Details, Commerce 등) 연결
- [ ] Adobe Analytics Experience Event Forwarding 활성화 (Report Suite 지정)
- [ ] (선택) Adobe Target via Web SDK
- [ ] (선택) AEP Dataset Destination
- [ ] Launch Web SDK Extension에 Datastream ID 입력

## 데모 앱에서 확인

우측 패널 **구현 코드 → Web SDK** 탭에서 9개 이벤트별 `alloy('sendEvent')` 스니펫을 확인할 수 있습니다.

## 참고

- [Adobe Web SDK 공식 문서](https://experienceleague.adobe.com/docs/experience-platform/web-sdk/home.html)
- [XDM Commerce 필드](https://experienceleague.adobe.com/docs/experience-platform/xdm/classes/experienceevent.html)
