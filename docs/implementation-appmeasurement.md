# AppMeasurement 직접 구현 가이드

레거시 Adobe Analytics(AppMeasurement) 방식으로 `s` 객체에 변수를 설정하고 `s.t()` 또는 `s.tl()`을 직접 호출하는 방법입니다.

> **참고**: 이 데모 앱의 실제 구현은 Launch Extension + ACDL 방식입니다. AppMeasurement 코드는 레거시 참고 및 비교용으로 제공됩니다.

## 언제 사용하나요?

- Adobe Launch(Tags)를 사용하지 않는 레거시 사이트
- AppMeasurement JS를 직접 페이지에 삽입하는 환경
- Launch Rule 없이 즉시 비콘을 전송해야 하는 경우

## 기본 패턴

```javascript
// 페이지뷰
s.pageName = "홈페이지";
s.channel = "ecommerce";
s.prop1 = "홈페이지";
s.eVar1 = "ecommerce";
s.events = "event1";
s.t();

// 링크/액션 이벤트 (비페이지뷰)
s.products = ";SHOE-001;1;159000";
s.events = "scAdd";
s.tl(true, "o", "Add to Cart");
```

## 이벤트별 변수 매핑

| 이벤트 | AA Event | pageName | products | prop | eVar | 기타 |
|--------|----------|----------|----------|------|------|------|
| pageView | event1 | 홈페이지 | — | prop1=pageName | eVar1=channel | s.t() |
| prodView | prodView | 상품상세:{name} | ;{sku} | prop2=category | eVar2=sku, eVar3=name, eVar4=category | s.t() |
| scAdd | scAdd | — | ;{sku};{qty};{value} | prop3=add_to_cart | eVar5=sku, eVar6=qty | s.tl() |
| scRemove | scRemove | — | ;{sku};{qty};{value} | prop3=remove_from_cart | eVar5=sku | s.tl() |
| scView | scView | 장바구니 | ;{sku};{qty};{value} | prop4=cart_view | eVar7=itemCount | s.t() |
| scCheckout | scCheckout | 체크아웃:Step{n} | ;{sku};{qty};{value} | prop5=checkout_step_{n} | eVar8=total, eVar9=step | s.t() |
| purchase | purchase | 구매완료 | ;{sku};{qty};{value} | prop6=purchase_complete | eVar10=orderId, eVar11=total, eVar12=count | purchaseID, transactionID |
| internalSearch | event2 | 검색결과 | — | prop7=term | eVar13=term, eVar14=count | s.t() |
| promoClick | event3 | — | — | prop8=name | eVar15=name, eVar16=position | s.tl() |

## Products 문자열 형식

```
;{SKU};{quantity};{price}
```

여러 상품은 쉼표로 연결:

```
;SHOE-001;1;159000,;BAG-002;2;578000
```

## Launch Extension 방식과의 차이

| 항목 | AppMeasurement | Launch Extension |
|------|----------------|------------------|
| 비콘 전송 | 클라이언트에서 `s.t()` 직접 호출 | Launch Rule → AA Extension이 전송 |
| 변수 설정 | `s.pageName = ...` | `adobeDataLayer.push({ _aa: { pageName: ... } })` |
| 태그 관리 | 코드 배포 필요 | Launch UI에서 Rule 수정 |
| ECID | Visitor API 직접 호출 | ECID Extension 자동 처리 |

## 데모 앱에서 확인

우측 패널 **구현 코드 → AA** 탭에서 9개 이벤트별 AppMeasurement 스니펫을 확인할 수 있습니다.
