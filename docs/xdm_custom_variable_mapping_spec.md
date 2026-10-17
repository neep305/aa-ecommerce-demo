# Adobe Analytics Custom Variable to AEP XDM Data Mapping Specification

> **문서 개요**: 본 문서는 `aa-ecommerce-demo` 소스 코드(`src/analytics/aa.ts` 및 `guide-snippets.ts`)에 구현된 Adobe Analytics(AA) 레거시 변수(`eVar`, `prop`, `event`)를 Adobe Experience Platform(AEP) **XDM ExperienceEvent 스키마** 및 **`_experience.analytics` (Adobe Analytics ExperienceEvent Full Extension)** 경로와 데이터 매핑 가이드 기준에 맞춰 재구성한 상세 데이터 명세표입니다.

---

## 1. 개요 및 스키마 아키텍처 원칙 (Overview & Principles)

1. **Dual Mapping (이중 매핑 전략)**:
   - 레거시 AA 보고서와의 하위 호환성을 위해 `_experience.analytics.customDimensions.eVars`, `props`, `event1to100` 경로를 사용합니다.
   - CJA 및 AEP 표준 데이터 모델과의 호환성을 위해 AEP 표준 OOTB 경로(`web.*`, `commerce.*`, `productListItems[]`)를 함께 구성합니다.
2. **XDM Path 엄격 준수 규칙**:
   - `_experience.analytics.customDimensions` 하위에는 오직 `eVars`, `props`, `listVars`, `hierarchies`만 존재하며, `pageName`, `channel`, `products`, `purchaseID` 같은 속성은 존재하지 않습니다.
   - 시스템 기본 예약 변수(`pageName`, `channel`, `products`, `purchaseID`)는 Standard XDM 경로(`web.webPageDetails.name`, `web.webPageDetails.siteSection`, `productListItems[]`, `commerce.order.purchaseID`)를 사용합니다.

---

## 2. Traffic Variables (Props - `prop1` ~ `prop8`)

| Source Variable | Display Name | `_experience.analytics` XDM Path | XDM Data Type | Mixin Classification | Modeling Type | Standard XDM Alternative Path | Description & Purpose |
|---|---|---|---|---|---|---|---|
| `prop1` | Page Name | `_experience.analytics.customDimensions.props.prop1` | String | Standard OOTB | Free Field - Mixin | `web.webPageDetails.name` | 현재 방문 중인 화면/페이지 명칭 |
| `prop2` | Product Category | `_experience.analytics.customDimensions.props.prop2` | String | Standard OOTB | Free Field - Mixin | `productListItems[].productCategories[].categoryID` | PDP(상품 상세) 조회 시 해당 상품의 카테고리 |
| `prop3` | Cart Action | `_experience.analytics.customDimensions.props.prop3` | String | Standard OOTB | Free Field - Mixin | `productListItems[].productAddMethod` | 장바구니 클릭 행위 (`add_to_cart` / `remove_from_cart`) |
| `prop4` | Cart View State | `_experience.analytics.customDimensions.props.prop4` | String | Standard OOTB | Free Field - Mixin | `commerce.productListViews` (Event) | 장바구니 페이지 진입 및 조회 상태 (`cart_view`) |
| `prop5` | Checkout Step Label | `_experience.analytics.customDimensions.props.prop5` | String | Standard OOTB | Free Field - Mixin | `commerce.checkouts` (Event) | 결제 단계 라벨 (`checkout_step_1`, `checkout_step_2` 등) |
| `prop6` | Purchase Complete State | `_experience.analytics.customDimensions.props.prop6` | String | Standard OOTB | Free Field - Mixin | `commerce.purchases` (Event) | 주문 완료 페이지 인터랙션 상태 (`purchase_complete`) |
| `prop7` | Internal Search Keyword | `_experience.analytics.customDimensions.props.prop7` | String | Standard OOTB | Free Field - Mixin | N/A (`_experience.analytics` 전용) | 검색창에서 유저가 입력한 검색 키워드 (Hit 단위) |
| `prop8` | Promotion Name | `_experience.analytics.customDimensions.props.prop8` | String | Standard OOTB | Free Field - Mixin | `web.webInteraction.name` | 메인/기획전에서 클릭한 배너 명칭 (Hit 단위) |

---

## 3. Conversion Variables (eVars - `eVar1` ~ `eVar16`)

| Source Variable | Display Name | `_experience.analytics` XDM Path | XDM Data Type | Mixin Classification | Modeling Type | Standard XDM Alternative Path | Recommended Expiration / Allocation | Description & Purpose |
|---|---|---|---|---|---|---|---|---|
| `eVar1` | Site Channel | `_experience.analytics.customDimensions.eVars.eVar1` | String | Standard OOTB | Free Field - Mixin | `web.webPageDetails.siteSection` | Visit / Most Recent | 웹사이트 카테고리 섹션 및 데이터 채널 (`web`, `ecommerce`) |
| `eVar2` | Product SKU (Viewed) | `_experience.analytics.customDimensions.eVars.eVar2` | String | Standard OOTB | Free Field - Mixin | `productListItems[].SKU` | Hit / Most Recent | 상품 상세 화면에서 조회가 발생한 상품의 SKU 고유 코드 |
| `eVar3` | Product Name (Viewed) | `_experience.analytics.customDimensions.eVars.eVar3` | String | Standard OOTB | Free Field - Mixin | `productListItems[].name` | Hit / Most Recent | 상품 상세 화면에서 조회가 발생한 상품 명칭 |
| `eVar4` | Product Category (Viewed) | `_experience.analytics.customDimensions.eVars.eVar4` | String | Standard OOTB | Free Field - Mixin | `productListItems[].productCategories[].categoryID` | Hit / Most Recent | 상품 상세 화면에서 조회가 발생한 상품의 분류 카테고리 |
| `eVar5` | Cart Product SKU | `_experience.analytics.customDimensions.eVars.eVar5` | String | Standard OOTB | Free Field - Mixin | `productListItems[].SKU` | Event (`scAdd`/`scRemove`) / Most Recent | 장바구니에 담기거나 제거된 상품의 SKU 식별자 |
| `eVar6` | Cart Add Quantity | `_experience.analytics.customDimensions.eVars.eVar6` | String | Standard OOTB | Free Field - Mixin | `productListItems[].quantity` | Event (`scAdd`) / Most Recent | 장바구니 추가 시 유저가 선택한 담기 수량 |
| `eVar7` | Cart Item Count | `_experience.analytics.customDimensions.eVars.eVar7` | String | Standard OOTB | Free Field - Mixin | N/A (`_experience.analytics` 전용) | Visit / Most Recent | 장바구니 페이지 조회 시 포함된 총 상품(SKU) 종류 개수 |
| `eVar8` | Checkout Total Amount | `_experience.analytics.customDimensions.eVars.eVar8` | String | Standard OOTB | Free Field - Mixin | `commerce.order.priceTotal` | Event (`scCheckout`) / Most Recent | 체크아웃 시작 시점의 장바구니 전체 결제 예정 금액 |
| `eVar9` | Checkout Step Number | `_experience.analytics.customDimensions.eVars.eVar9` | String | Standard OOTB | Free Field - Mixin | N/A (`_experience.analytics` 전용) | Event (`scCheckout`) / Most Recent | 체크아웃 진행 단계 번호 (`1`, `2`, `3` 등) |
| `eVar10` | Order ID | `_experience.analytics.customDimensions.eVars.eVar10` | String | Standard OOTB | Free Field - Mixin | `commerce.order.purchaseID` | Purchase / Most Recent | 결제 성공 후 발급된 고유 주문 거래 번호 |
| `eVar11` | Order Total Amount | `_experience.analytics.customDimensions.eVars.eVar11` | String | Standard OOTB | Free Field - Mixin | `commerce.order.priceTotal` | Purchase / Most Recent | 최종 주문 결제가 완료된 총 결제 금액 |
| `eVar12` | Order Item Count | `_experience.analytics.customDimensions.eVars.eVar12` | String | Standard OOTB | Free Field - Mixin | N/A (`_experience.analytics` 전용) | Purchase / Most Recent | 구매 완료된 주문 건에 포함된 총 상품 종류 개수 |
| `eVar13` | Internal Search Keyword | `_experience.analytics.customDimensions.eVars.eVar13` | String | Standard OOTB | Free Field - Mixin | N/A (`_experience.analytics` 전용) | Visit / Most Recent | 내부 검색창에 입력한 키워드 (전환 귀속용 지속) |
| `eVar14` | Search Result Count | `_experience.analytics.customDimensions.eVars.eVar14` | String | Standard OOTB | Free Field - Mixin | N/A (`_experience.analytics` 전용) | Visit / Most Recent | 검색 실행 시 검색 결과 화면에 노출된 상품 개수 |
| `eVar15` | Promotion Banner Name | `_experience.analytics.customDimensions.eVars.eVar15` | String | Standard OOTB | Free Field - Mixin | `web.webInteraction.name` | Visit / Most Recent | 배너 클릭 후 발생한 구매 성과 귀속용 배너 명칭 |
| `eVar16` | Promotion Position | `_experience.analytics.customDimensions.eVars.eVar16` | String | Standard OOTB | Free Field - Mixin | `web.webInteraction.region` | Visit / Most Recent | 배너 클릭 후 발생한 구매 성과 귀속용 영역 위치명 |

---

## 4. Success Events & Commerce Events (`events`)

| Source Variable | Display Name | `_experience.analytics` XDM Path | XDM Data Type | Mixin Classification | Modeling Type | Standard XDM Alternative Path | Event Type & Serialization | Description & Purpose |
|---|---|---|---|---|---|---|---|---|
| `event1` | Page Views | `_experience.analytics.event1to100.event1.value` | Short (Integer) | Standard OOTB | Free Field - Mixin | `web.webPageDetails.pageViews.value` | Counter Event | 일반 화면 조회 발생 횟수 카운터 |
| `event2` | Internal Searches | `_experience.analytics.event1to100.event2.value` | Short (Integer) | Standard OOTB | Free Field - Mixin | `web.webInteraction.linkClicks.value` | Counter Event | 내부 검색 동작 수행 횟수 카운터 |
| `event3` | Promotion Clicks | `_experience.analytics.event1to100.event3.value` | Short (Integer) | Standard OOTB | Free Field - Mixin | `web.webInteraction.linkClicks.value` | Counter Event | 배너 및 프로모션 클릭 횟수 카운터 |
| `prodView` | Product Views | `_experience.analytics.event1to100.prodView.value` | Short (Integer) | Standard OOTB | Free Field - Mixin | `commerce.productViews.value` | Standard Commerce Event | PDP 상품 상세 조회 커머스 이벤트 |
| `scAdd` | Cart Additions | `_experience.analytics.event1to100.scAdd.value` | Short (Integer) | Standard OOTB | Free Field - Mixin | `commerce.productListAdds.value` | Standard Commerce Event | 장바구니 담기 성공 커머스 이벤트 |
| `scRemove` | Cart Removals | `_experience.analytics.event1to100.scRemove.value` | Short (Integer) | Standard OOTB | Free Field - Mixin | `commerce.productListRemovals.value` | Standard Commerce Event | 장바구니 담긴 상품 삭제 커머스 이벤트 |
| `scView` | Cart Views | `_experience.analytics.event1to100.scView.value` | Short (Integer) | Standard OOTB | Free Field - Mixin | `commerce.productListViews.value` | Standard Commerce Event | 장바구니 화면 진입/조회 커머스 이벤트 |
| `scCheckout` | Checkouts | `_experience.analytics.event1to100.scCheckout.value` | Short (Integer) | Standard OOTB | Free Field - Mixin | `commerce.checkouts.value` | Standard Commerce Event | 결제 수단/주문서 진입 커머스 이벤트 |
| `purchase` | Purchases | `_experience.analytics.event1to100.purchase.value` | Short (Integer) | Standard OOTB | Free Field - Mixin | `commerce.purchases.value` | Standard Commerce Event (Serialized by `purchaseID`) | 최종 주문 결제 완료 커머스 이벤트 |

---

## 5. Reserved AA Variables (시스템 기본 변수)

| Source Variable | Display Name | `_experience.analytics` XDM Path | Standard Target XDM Path | XDM Data Type | Mixin Classification | Modeling Type | Description & Purpose |
|---|---|---|---|---|---|---|---|
| `pageName` | Page Name | N/A *(존재 안 함)* | `web.webPageDetails.name` | String | Standard OOTB | Free Field - Mixin | AA 기본 수집 대상 화면/페이지 명칭 |
| `channel` | Site Channel | N/A *(존재 안 함)* | `web.webPageDetails.siteSection` | String | Standard OOTB | Free Field - Mixin | 사이트 상위 대분류 카테고리/채널 |
| `products` | Products String | N/A *(존재 안 함)* | `productListItems[]` | Array of Object | Standard OOTB | Custom Datatype | 상품 정보 배열 (`SKU`, `quantity`, `priceTotal`) |
| `purchaseID` | Purchase Transaction ID | N/A *(존재 안 함)* | `commerce.order.purchaseID` | String | Standard OOTB | Free Field - Mixin | 구매 중복 집계 방지용 고유 주문 트랜잭션 식별자 |

---

## 6. Web SDK XDM payload 전송 예시 (JSON Snippet)

Web SDK(Alloy)를 적용하여 AEP Datastream으로 수집할 때 전송되는 XDM 객체 구성 예시입니다.

```json
{
  "xdm": {
    "_id": "8f3b2a11-091a-4f51-b992-8e10d294811a",
    "timestamp": "2026-07-27T09:30:00.000Z",
    "eventType": "web.webPageDetails.pageViews",
    "web": {
      "webPageDetails": {
        "name": "상품상세:프리미엄 러닝화",
        "siteSection": "ecommerce"
      }
    },
    "commerce": {
      "productViews": {
        "value": 1
      }
    },
    "productListItems": [
      {
        "SKU": "SHOE-001",
        "name": "프리미엄 러닝화",
        "priceTotal": 159000,
        "productCategories": [
          {
            "categoryID": "신발"
          }
        ]
      }
    ],
    "_experience": {
      "analytics": {
        "customDimensions": {
          "eVars": {
            "eVar1": "ecommerce",
            "eVar2": "SHOE-001",
            "eVar3": "프리미엄 러닝화",
            "eVar4": "신발"
          },
          "props": {
            "prop1": "상품상세:프리미엄 러닝화",
            "prop2": "신발"
          }
        },
        "event1to100": {
          "prodView": {
            "value": 1
          }
        }
      }
    }
  }
}
```

---

## 7. AEP Architect 권장사항 및 CJA 전환 가이드라인

1. **Adobe Analytics ExperienceEvent Full Extension 이용**:
   - AEP Datastream 설정 시 `Adobe Analytics` 전송 맵을 구성하면, `_experience.analytics` 하위 경로에 매핑된 데이터가 AA 레거시 `eVar`, `prop`, `event`로 1:1 자동 매핑 및 변환됩니다.
2. **CJA (Customer Journey Analytics) Transition**:
   - CJA Data Views 환경에서는 레거시 `eVar` 번호 제한이나 Expiration 고정 설정에 매여 있을 필요가 없으므로, 향후 AEP Standard Schema인 `web.webInteraction`, `commerce`, `productListItems[]` 표준 필드를 직접 바인딩하여 무제한 차원/지표 및 동적 Attribution을 사용하는 모더나이제이션 로드맵 조성을 권장합니다.
