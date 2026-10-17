# ACDL to XDM 3-Tier Data Mapping Specification (SDR)

> **문서 개요**: 본 문서는 프론트엔드 **ACDL (Adobe Client Data Layer)** 데이터 ➔ **Adobe Launch Data Element** ➔ **AEP XDM Schema** (`_experience.analytics` 및 Standard XDM)를 1:1로 연결하는 3-Tier Data Mapping Workbook (Solution Design Reference) 문서입니다.

---

## 1. 3-Tier 데이터 매핑 개요 (3-Tier Mapping Overview)

엔터프라이즈 AEP/CJA 수집 아키텍처에서는 아래 3단계 레이어를 연결하는 매핑 워크북이 필수적입니다.

```
[ Tier 1: Source Data ]               [ Tier 2: Tag Manager ]            [ Tier 3: Target Schema ]
ACDL JSON Path                ───>   Launch Data Element        ───>    AEP XDM Path / AA Variable
(event.page.channel 등)               (%ACDL - Channel%)                 (web.webPageDetails.siteSection)
```

> ⚠️ **XDM Path 규칙**: `_experience.analytics.customDimensions` 하위에는 오직 `eVars`, `props`, `listVars`, `hierarchies`만 존재합니다. `pageName`, `channel`, `purchaseID` 등 시스템 예약 변수는 Standard XDM 경로(`web.webPageDetails.name`, `web.webPageDetails.siteSection`, `commerce.order.purchaseID`)를 사용합니다.

---

## 2. Traffic Variables & Page Context (Props & Web)

| Event Name | ACDL JSON Path (Source Data) | Launch Data Element Name | Target XDM Path (Standard) | `_experience.analytics` XDM Path | Display Name | Example Value |
|---|---|---|---|---|---|---|
| `pageView` | `event.page.name` | `%ACDL - Page Name%` | `web.webPageDetails.name` | `_experience.analytics.customDimensions.props.prop1` | Page Name | `"홈페이지"` |
| `pageView` | `event.page.channel`<br>`event._aa.channel` | `%ACDL - Channel%` | `web.webPageDetails.siteSection` | `_experience.analytics.customDimensions.eVars.eVar1` | Site Channel | `"ecommerce"` |
| `prodView` | `event.product.category`<br>`event._aa.prop2` | `%ACDL - Product Category%` | `productListItems[].productCategories[].categoryID` | `_experience.analytics.customDimensions.props.prop2`<br>`_experience.analytics.customDimensions.eVars.eVar4` | Product Category | `"신발"` |
| `scAdd`<br>`scRemove` | `event._aa.prop3` | `%ACDL - Cart Action%` | `productListItems[].productAddMethod` | `_experience.analytics.customDimensions.props.prop3` | Cart Action | `"add_to_cart"` |
| `scView` | `event._aa.prop4` | `%ACDL - Cart View State%` | `commerce.productListViews` (Event) | `_experience.analytics.customDimensions.props.prop4` | Cart View State | `"cart_view"` |
| `scCheckout` | `event._aa.prop5` | `%ACDL - Checkout Step Label%` | `commerce.checkouts` (Event) | `_experience.analytics.customDimensions.props.prop5` | Checkout Step Label | `"checkout_step_1"` |
| `purchase` | `event._aa.prop6` | `%ACDL - Purchase State%` | `commerce.purchases` (Event) | `_experience.analytics.customDimensions.props.prop6` | Purchase Complete State | `"purchase_complete"` |
| `internalSearch` | `event.search.term`<br>`event._aa.prop7` | `%ACDL - Search Term%` | N/A | `_experience.analytics.customDimensions.props.prop7`<br>`_experience.analytics.customDimensions.eVars.eVar13` | Internal Search Keyword | `"러닝화"` |
| `promoClick` | `event.promo.name`<br>`event._aa.prop8` | `%ACDL - Promo Name%` | `web.webInteraction.name` | `_experience.analytics.customDimensions.props.prop8`<br>`_experience.analytics.customDimensions.eVars.eVar15` | Promotion Name | `"여름 세일"` |

---

## 3. Conversion Variables (eVars)

| Event Name | ACDL JSON Path (Source Data) | Launch Data Element Name | Target XDM Path (Standard) | `_experience.analytics` XDM Path | Display Name | Recommended Expiration | Example Value |
|---|---|---|---|---|---|---|---|
| `pageView` | `event.page.channel` | `%ACDL - Channel%` | `web.webPageDetails.siteSection` | `_experience.analytics.customDimensions.eVars.eVar1` | Site Channel | Visit / Most Recent | `"ecommerce"` |
| `prodView` | `event.product.sku` | `%ACDL - Product SKU%` | `productListItems[].SKU` | `_experience.analytics.customDimensions.eVars.eVar2` | Product SKU (Viewed) | Hit / Most Recent | `"SHOE-001"` |
| `prodView` | `event.product.name` | `%ACDL - Product Name%` | `productListItems[].name` | `_experience.analytics.customDimensions.eVars.eVar3` | Product Name (Viewed) | Hit / Most Recent | `"프리미엄 러닝화"` |
| `prodView` | `event.product.category` | `%ACDL - Product Category%` | `productListItems[].productCategories[].categoryID` | `_experience.analytics.customDimensions.eVars.eVar4` | Product Category (Viewed) | Hit / Most Recent | `"신발"` |
| `scAdd`<br>`scRemove` | `event.product.sku` | `%ACDL - Cart Product SKU%` | `productListItems[].SKU` | `_experience.analytics.customDimensions.eVars.eVar5` | Cart Product SKU | Event / Most Recent | `"SHOE-001"` |
| `scAdd` | `event.product.quantity` | `%ACDL - Cart Quantity%` | `productListItems[].quantity` | `_experience.analytics.customDimensions.eVars.eVar6` | Cart Add Quantity | Event / Most Recent | `"1"` |
| `scView` | `event._aa.eVar7`<br>`event.cart.items.length` | `%ACDL - Cart Item Count%` | N/A | `_experience.analytics.customDimensions.eVars.eVar7` | Cart Item Count | Visit / Most Recent | `"2"` |
| `scCheckout` | `event.cart.totalValue`<br>`event._aa.eVar8` | `%ACDL - Checkout Amount%` | `commerce.order.priceTotal` | `_experience.analytics.customDimensions.eVars.eVar8` | Checkout Total Amount | Event / Most Recent | `"159000"` |
| `scCheckout` | `event._aa.eVar9` | `%ACDL - Checkout Step Number%` | N/A | `_experience.analytics.customDimensions.eVars.eVar9` | Checkout Step Number | Event / Most Recent | `"1"` |
| `purchase` | `event.order.id`<br>`event._aa.purchaseID` | `%ACDL - Order ID%` | `commerce.order.purchaseID` | `_experience.analytics.customDimensions.eVars.eVar10` | Order ID | Purchase / Most Recent | `"ORD-20240531-001"` |
| `purchase` | `event.order.totalValue` | `%ACDL - Order Total Amount%` | `commerce.order.priceTotal` | `_experience.analytics.customDimensions.eVars.eVar11` | Order Total Amount | Purchase / Most Recent | `"159000"` |
| `purchase` | `event._aa.eVar12` | `%ACDL - Order Item Count%` | N/A | `_experience.analytics.customDimensions.eVars.eVar12` | Order Item Count | Purchase / Most Recent | `"1"` |
| `internalSearch` | `event.search.term` | `%ACDL - Search Term%` | N/A | `_experience.analytics.customDimensions.eVars.eVar13` | Internal Search Keyword | Visit / Most Recent | `"러닝화"` |
| `internalSearch` | `event.search.resultCount` | `%ACDL - Search Result Count%` | N/A | `_experience.analytics.customDimensions.eVars.eVar14` | Search Result Count | Visit / Most Recent | `"3"` |
| `promoClick` | `event.promo.name` | `%ACDL - Promo Name%` | `web.webInteraction.name` | `_experience.analytics.customDimensions.eVars.eVar15` | Promotion Banner Name | Visit / Most Recent | `"여름 세일"` |
| `promoClick` | `event.promo.position` | `%ACDL - Promo Position%` | `web.webInteraction.region` | `_experience.analytics.customDimensions.eVars.eVar16` | Promotion Position | Visit / Most Recent | `"hero_banner"` |

---

## 4. Success & Commerce Events

| Event Name | ACDL Trigger Event | Launch Data Element / Rule Trigger | Target XDM Event Type | `_experience.analytics` Event Path | Display Name | Event Serialization |
|---|---|---|---|---|---|---|
| `pageView` | `pageView` | ACDL Event equals `"pageView"` | `web.webPageDetails.pageViews` | `_experience.analytics.event1to100.event1.value` = 1 | Page Views | Counter Event |
| `internalSearch` | `internalSearch` | ACDL Event equals `"internalSearch"` | `web.webinteraction.linkClicks` | `_experience.analytics.event1to100.event2.value` = 1 | Internal Searches | Counter Event |
| `promoClick` | `promoClick` | ACDL Event equals `"promoClick"` | `web.webinteraction.linkClicks` | `_experience.analytics.event1to100.event3.value` = 1 | Promotion Clicks | Counter Event |
| `prodView` | `prodView` | ACDL Event equals `"prodView"` | `commerce.productViews` | `_experience.analytics.event1to100.prodView.value` = 1 | Product Views | Standard Commerce Event |
| `scAdd` | `scAdd` | ACDL Event equals `"scAdd"` | `commerce.productListAdds` | `_experience.analytics.event1to100.scAdd.value` = 1 | Cart Additions | Standard Commerce Event |
| `scRemove` | `scRemove` | ACDL Event equals `"scRemove"` | `commerce.productListRemovals` | `_experience.analytics.event1to100.scRemove.value` = 1 | Cart Removals | Standard Commerce Event |
| `scView` | `scView` | ACDL Event equals `"scView"` | `commerce.productListViews` | `_experience.analytics.event1to100.scView.value` = 1 | Cart Views | Standard Commerce Event |
| `scCheckout` | `scCheckout` | ACDL Event equals `"scCheckout"` | `commerce.checkouts` | `_experience.analytics.event1to100.scCheckout.value` = 1 | Checkouts | Standard Commerce Event |
| `purchase` | `purchase` | ACDL Event equals `"purchase"` | `commerce.purchases` | `_experience.analytics.event1to100.purchase.value` = 1 | Purchases | Serialized by `purchaseID` |

---

## 5. Launch 설정 가이드 (Best Practice)

1. **ACDL Data Element 일괄 등록**:
   - 상기 명세표의 **Launch Data Element Name** 명칭 컨벤션(`%ACDL - {필드명}%`)을 그대로 Launch에 등록합니다.
2. **XDM Object 중앙 바인딩**:
   - `XDM Object` 타입의 Data Element 하나를 생성하여 상기 명세표의 **Target XDM Path**와 **`_experience.analytics` XDM Path**에 매칭되는 Launch Data Element를 일괄 맵핑해 둡니다.
3. **Send Event Rule 연동**:
   - Launch Rule 액션에서 AEP Web SDK `Send Event` 액션을 추가하고, Payload 항목에 해당 `XDM Object`를 선택하여 발송합니다.
