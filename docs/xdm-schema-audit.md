# XDM Schema Payload 점검 리포트

`data/schema-sample-Jason Online Behavior Event Schema.json`(AEP 스키마 샘플 데이터 = 스키마가 실제 보유한 필드 전수)을 **계약**으로 삼아, 앱이 저작한 XDM 페이로드가 형식에 맞는지 점검한 결과입니다.

- 점검 대상
  - `src/analytics/guide-snippets.ts` — 9개 이벤트의 `webSdk.code` (`alloy("sendEvent")`)
  - `docs/implementation-web-sdk.md` — 매핑 표 및 예시
  - `data/test_payload.json` — 실제 캡처된 Alloy 비콘
- 판정 기준
  - **정상**: 스키마에 존재하고 구조/케이싱/타입/배치 일치
  - **스키마 갭(표준 XDM)**: 스키마엔 없지만 표준 XDM 필드 그룹 → 유지하되, **AEP에 필드 그룹 추가 필요**
  - **수정필요(비표준)**: 표준 XDM에도 없는 형식 → 표준 구조로 교정

## 1. 스키마 계약 (schema-sample 기준 최상위 필드 그룹)

| 필드 그룹 | 주요 하위 필드 |
|-----------|----------------|
| `_acssandboxgdctwo.jason_identities` (커스텀 ID) | `ecid`, `guid` |
| `_experience.decisioning` | `propositions[]`, `propositionEventType`, `propositionAction` |
| `web.webInteraction` | `URL`, `name`, `region`, `type`(download/exit/other), `linkClicks{id,value}` |
| `web.webPageDetails` | `URL`, `name`, `siteSection`, `server`, `viewName`, `pageViews{id,value}`, `isHomePage`, `isErrorPage`, `isPreRendered` |
| `web.webReferrer` | `URL`, `type` |
| `device` | `screenHeight`, `screenWidth`, `screenOrientation`, `colorDepth`, `type`, `model`, `manufacturer` 등 |
| `environment` | `type`, `browserDetails{viewportWidth,viewportHeight,userAgent,...}`, `operatingSystem`, `connectionType` 등 |
| `placeContext` | `localTime`, `localTimezoneOffset`, `ianaTimezone`, `geo{}`, `POIinteraction{}` |
| `implementationDetails` | `name`, `version`, `environment` |
| `identityMap` | `<namespace>[]{id, authenticatedState, primary}` |
| 기타 | `_id`, `eventMergeId`, `eventType`, `producedBy`, `segmentList[]`, `timestamp`, `userActivityRegion` |

> 스키마에 **없는** 최상위 그룹: `commerce`, `productListItems`, `_experience.analytics`, (top-level) `search`, `promo`, `advertising`, `marketing`.

## 2. 이벤트별 판정 (Web SDK 스니펫)

| 이벤트 | eventType | 사용 필드 | 판정 |
|--------|-----------|-----------|------|
| pageView | `web.webPageDetails.pageViews` ✅ | `web.webPageDetails{name,siteSection}` ✅ / `_experience.analytics.customDimensions` | 정상 + 스키마 갭(analytics) |
| prodView | `commerce.productViews` ✅ | `web.webPageDetails{name}` ✅ / `commerce.productViews{value}` / `productListItems[{SKU,name,priceTotal,productCategories[{categoryID}]}]` | 스키마 갭(commerce, productListItems) — 표준 유효 |
| scAdd | `commerce.productListAdds` ✅ | `commerce.productListAdds{value}` / `productListItems[{SKU,name,quantity,priceTotal,productAddMethod}]` | 스키마 갭 — 표준 유효 |
| scRemove | `commerce.productListRemovals` ✅ | `commerce.productListRemovals{value}` / `productListItems[]` | 스키마 갭 — 표준 유효 |
| scView | `commerce.productListViews` ✅ | `web.webPageDetails{name}` ✅ / `commerce.productListViews{value}` / `productListItems[]` | 스키마 갭 — 표준 유효 |
| scCheckout | `commerce.checkouts` ✅ | `web.webPageDetails{name}` ✅ / `commerce.checkouts{value}` / `productListItems[]` | 스키마 갭 — 표준 유효 |
| purchase | `commerce.purchases` ✅ | `web.webPageDetails{name}` ✅ / `commerce.purchases{value}` / `commerce.order{purchaseID,priceTotal,currencyCode,payments[{paymentType,paymentAmount,currencyCode}]}` / `productListItems[]` | 스키마 갭 — 표준 유효 |
| internalSearch | `web.webinteraction.linkClicks` ✅ | `web.webPageDetails{name}` ✅ / `web.webInteraction{name,type}` ✅ / **`search{isSearch,term,numberOfResults}`** ❌ | **수정필요(비표준)** |
| promoClick | **`promo.promoClicks`** ❌ | **`promo.promoClicks{value,promoInteraction{promoID,promoName,promoPosition}}`** ❌ | **수정필요(비표준)** |

## 3. 수정필요 상세

### 3-1. internalSearch — top-level `search` 비표준

- 문제: 표준 XDM `search` 데이터 타입(`https://ns.adobe.com/xdm/context/search`)의 필드는 `searchEngine`, `keywords`, `isPaid`, `pageDepth`, `position`, `slot` 뿐입니다. `isSearch`는 존재하지 않으며, `term`/`numberOfResults`는 **Internal Site Search** 데이터 타입(`siteKnowledge.supportSiteSearch` 경유) 소속으로, 최상위 `search`에 둘 수 없습니다.
- 조치: 스키마 내 `web.webInteraction`(링크 클릭)을 유지하고, 검색어/결과 수는 앱의 AA 매핑(prop7/eVar13/eVar14, event2)과 일치하도록 표준 `_experience.analytics.customDimensions`로 표현. eventType은 `web.webinteraction.linkClicks` 유지.

### 3-2. promoClick — `promo` 필드 그룹 및 eventType 비표준

- 문제: 표준 XDM에 `promo` 필드 그룹과 `promo.promoClicks` eventType이 없습니다. 프로모션/마케팅은 `marketing`(Campaign Marketing Details), `advertising`(Advertising Details), 또는 온사이트 배너 클릭이면 `web.webInteraction`(link click) + `decisioning`으로 표현합니다.
- 조치: 온사이트 배너 클릭 성격에 맞게 `web.webInteraction{name,region,type,linkClicks}`(모두 스키마 내 필드) + `_experience.analytics.customDimensions`(prop8/eVar15/eVar16, event3)로 교정. eventType은 `web.webinteraction.linkClicks`.

## 4. `test_payload.json` (실제 캡처 비콘)

- `web.webInteraction{name,region,type,URL,linkClicks{value}}`, `web.webPageDetails{URL}`, `web.webReferrer{URL}`, `device{screenHeight,screenWidth,screenOrientation}`, `environment{type,browserDetails{viewport...}}`, `placeContext{localTime,localTimezoneOffset,ianaTimezone}`, `implementationDetails`, `timestamp`, `eventType:"web.webinteraction.linkClicks"` → **모두 스키마 계약과 일치(정상)**.
- `data.__adobe.analytics.contextData`는 XDM이 아니라 Edge의 AA forwarding 블록으로, 스키마 검증 대상 아님.
- 캡처 페이로드에는 `identityMap` / `_acssandboxgdctwo.jason_identities`가 없으나, ECID/identity는 Edge Network가 수집 시점에 채우므로 비콘 자체의 결함은 아님. 다만 커스텀 identity(`ecid`,`guid`)를 명시적으로 채우려면 sendEvent에서 XDM으로 전달해야 함.
- 실제 캡처본이므로 **변경하지 않음**.

## 5. 스키마 측 조치 (필수)

Web SDK 페이로드를 이 스키마로 ingest하려면 AEP 스키마에 아래 **표준 필드 그룹 추가**가 필요합니다. (코드만으로는 완결 불가)

- **Commerce Details** — `commerce.*`, `productListItems[]`
- **Adobe Analytics ExperienceEvent Full Extension** — `_experience.analytics.customDimensions.{eVars,props}`

이 두 그룹을 추가하면 9개 이벤트 전부가 스키마 계약을 만족합니다(비표준 `search`/`promo` 교정 이후).

## 6. 조치 요약

| 대상 | 조치 |
|------|------|
| `guide-snippets.ts` internalSearch | 비표준 `search` 제거 → `_experience.analytics.customDimensions` + `webInteraction.linkClicks` |
| `guide-snippets.ts` promoClick | 비표준 `promo` 제거 → `web.webInteraction` + `_experience.analytics.customDimensions`, eventType `web.webinteraction.linkClicks` |
| `docs/implementation-web-sdk.md` | 매핑 표의 internalSearch/promoClick 행 및 스키마 필드 그룹 안내 갱신, identity 예시 추가 |
| AEP 스키마 | Commerce Details + Adobe Analytics Full Extension 필드 그룹 추가(운영 조치) |
| `test_payload.json` | 변경 없음(정상, 실제 캡처본) |
